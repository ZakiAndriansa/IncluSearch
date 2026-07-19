import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatAccess } from "@/lib/consultation";
import { z } from "zod";

const MessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// Load the consultation behind a chat room (null if room/consultation missing).
async function getRoomConsultation(roomId: string) {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    select: {
      consultation: {
        select: {
          parentId: true,
          status: true,
          scheduledAt: true,
          durationMins: true,
          expert: { select: { userId: true } },
        },
      },
    },
  });
  return chatRoom?.consultation ?? null;
}

type RoomConsultation = NonNullable<Awaited<ReturnType<typeof getRoomConsultation>>>;

function isParticipant(c: RoomConsultation, userId: string) {
  return c.parentId === userId || c.expert.userId === userId;
}

// Chat access from the consultation's schedule (single source: lib/consultation).
function chatAccessOf(c: RoomConsultation) {
  return getChatAccess(
    c.status,
    c.scheduledAt,
    c.durationMins,
    c.status !== "PENDING_PAYMENT"
  );
}

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const consultation = await getRoomConsultation(params.roomId);
  if (!consultation || !isParticipant(consultation, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // History is readable once the window has opened (during or after); before
  // the scheduled time — or when unpaid/cancelled — the room stays closed.
  const access = chatAccessOf(consultation);
  if (access !== "open" && access !== "after") {
    return NextResponse.json({ error: "Ruang chat belum tersedia" }, { status: 403 });
  }

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

  const consultation = await getRoomConsultation(params.roomId);
  if (!consultation || !isParticipant(consultation, session.user.id)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Sending is only allowed while the scheduled window is OPEN. Enforced
  // server-side so it can't be bypassed by calling the API directly.
  const access = chatAccessOf(consultation);
  if (access !== "open") {
    const message =
      access === "before"
        ? "Konsultasi belum dimulai"
        : access === "after"
        ? "Konsultasi sudah selesai"
        : access === "cancelled"
        ? "Konsultasi dibatalkan"
        : "Menunggu konfirmasi pembayaran";
    return NextResponse.json({ error: message }, { status: 403 });
  }

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
