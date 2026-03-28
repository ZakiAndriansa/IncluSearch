import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// Verify user has access to this chat room
async function verifyRoomAccess(roomId: string, userId: string) {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      consultation: {
        select: { parentId: true, expert: { select: { userId: true } } },
      },
    },
  });

  if (!chatRoom?.consultation) return false;

  return (
    chatRoom.consultation.parentId === userId ||
    chatRoom.consultation.expert.userId === userId
  );
}

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasAccess = await verifyRoomAccess(params.roomId, session.user.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const afterId = searchParams.get("after");

  let afterSentAt: Date | undefined;
  if (afterId) {
    const ref = await prisma.chatMessage.findUnique({
      where: { id: afterId },
      select: { sentAt: true },
    });
    afterSentAt = ref?.sentAt;
  }

  const messages = await prisma.chatMessage.findMany({
    where: {
      roomId: params.roomId,
      ...(afterSentAt ? { sentAt: { gt: afterSentAt } } : {}),
    },
    include: {
      sender: { select: { id: true, name: true, image: true } },
    },
    orderBy: { sentAt: "asc" },
    take: 50,
  });

  return NextResponse.json({ messages });
}

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hasAccess = await verifyRoomAccess(params.roomId, session.user.id);
  if (!hasAccess) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const body = await request.json();
    const { content } = MessageSchema.parse(body);

    const message = await prisma.chatMessage.create({
      data: {
        roomId: params.roomId,
        senderId: session.user.id,
        content,
      },
      include: {
        sender: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
