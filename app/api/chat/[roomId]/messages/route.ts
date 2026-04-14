import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const MessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// Verify user has access to this chat room and return consultation details
async function getRoomContext(roomId: string, userId: string) {
  const chatRoom = await prisma.chatRoom.findUnique({
    where: { id: roomId },
    include: {
      consultation: {
        select: {
          id: true,
          parentId: true,
          status: true,
          scheduledAt: true,
          durationMins: true,
          expert: { select: { userId: true } },
        },
      },
    },
  });

  if (!chatRoom?.consultation) return null;

  const isParent = chatRoom.consultation.parentId === userId;
  const isExpert = chatRoom.consultation.expert.userId === userId;

  if (!isParent && !isExpert) return null;

  return {
    consultation: chatRoom.consultation,
    isParent,
    isExpert,
  };
}

// Check if the consultation time window allows messaging for a parent
async function checkTimeAccess(
  consultation: {
    id: string;
    scheduledAt: Date;
    durationMins: number;
    status: string;
  },
  roomId: string
) {
  const now = new Date();
  const start = new Date(consultation.scheduledAt);
  const end = new Date(start.getTime() + consultation.durationMins * 60 * 1000);

  // Within scheduled time window → always allowed
  if (now >= start && now <= end) {
    return { allowed: true, reason: null };
  }

  // Outside time window — check if expert has initiated the session
  const expertMessage = await prisma.chatMessage.findFirst({
    where: {
      roomId,
      type: "SYSTEM",
      content: { startsWith: "__EXPERT_INITIATED__" },
    },
    select: { id: true },
  });

  if (expertMessage) {
    // Expert initiated — allow parent to chat until consultation is completed
    return { allowed: true, reason: null };
  }

  // Not within window and expert hasn't initiated
  if (now < start) {
    return {
      allowed: false,
      reason: `Sesi konsultasi belum dimulai. Jadwal dimulai pukul ${start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Asia/Jakarta" })}.`,
    };
  }

  return {
    allowed: false,
    reason: "Waktu sesi konsultasi telah berakhir.",
  };
}

export async function GET(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getRoomContext(params.roomId, session.user.id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

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

  // Also return time access status for the client
  const { consultation, isExpert } = ctx;
  const now = new Date();
  const start = new Date(consultation.scheduledAt);
  const end = new Date(start.getTime() + consultation.durationMins * 60 * 1000);

  let timeStatus: "before" | "active" | "after" = "active";
  if (now < start) timeStatus = "before";
  else if (now > end) timeStatus = "after";

  // Check if expert initiated
  let expertInitiated = false;
  if (timeStatus !== "active") {
    const expertMsg = await prisma.chatMessage.findFirst({
      where: {
        roomId: params.roomId,
        type: "SYSTEM",
        content: { startsWith: "__EXPERT_INITIATED__" },
      },
      select: { id: true },
    });
    expertInitiated = !!expertMsg;
  }

  return NextResponse.json({
    messages,
    timeStatus,
    expertInitiated,
    isExpert,
    scheduledAt: consultation.scheduledAt,
    durationMins: consultation.durationMins,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const ctx = await getRoomContext(params.roomId, session.user.id);
  if (!ctx) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { consultation, isParent, isExpert } = ctx;

  // Block if consultation is completed or cancelled
  if (consultation.status === "COMPLETED" || consultation.status === "CANCELLED") {
    return NextResponse.json(
      { error: "Sesi konsultasi sudah berakhir." },
      { status: 403 }
    );
  }

  // Time-based restriction for parents
  if (isParent) {
    const access = await checkTimeAccess(consultation, params.roomId);
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, code: "TIME_RESTRICTED" },
        { status: 403 }
      );
    }
  }

  try {
    const body = await request.json();
    const { content } = MessageSchema.parse(body);

    // If expert sends a message outside the scheduled window, mark session as expert-initiated
    if (isExpert) {
      const now = new Date();
      const start = new Date(consultation.scheduledAt);
      const end = new Date(start.getTime() + consultation.durationMins * 60 * 1000);

      if (now < start || now > end) {
        // Check if already marked
        const existing = await prisma.chatMessage.findFirst({
          where: {
            roomId: params.roomId,
            type: "SYSTEM",
            content: { startsWith: "__EXPERT_INITIATED__" },
          },
          select: { id: true },
        });

        if (!existing) {
          // Create system message to mark expert initiation and notify parent
          await prisma.chatMessage.create({
            data: {
              roomId: params.roomId,
              senderId: session.user.id,
              content: "__EXPERT_INITIATED__Pakar telah membuka sesi konsultasi. Anda sudah dapat berkonsultasi mulai sekarang.",
              type: "SYSTEM",
            },
          });

          // Update consultation status to IN_PROGRESS
          await prisma.consultation.update({
            where: { id: consultation.id },
            data: { status: "IN_PROGRESS" },
          });
        }
      }
    }

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
