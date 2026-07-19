import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateExpertProfile } from "@/lib/expert";
import { z } from "zod";

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/; // HH:MM 24h

const SlotSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(TIME_RE, "Format jam harus HH:MM"),
    endTime: z.string().regex(TIME_RE, "Format jam harus HH:MM"),
  })
  .refine((s) => s.startTime < s.endTime, {
    message: "Jam mulai harus sebelum jam selesai",
  });

const AvailabilitySchema = z.object({
  slots: z.array(SlotSchema).max(21), // up to 3 ranges/day
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getOrCreateExpertProfile(session.user.id);
  const slots = await prisma.availabilitySlot.findMany({
    where: { expertId: profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
  return NextResponse.json({ slots });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { slots } = AvailabilitySchema.parse(body);

    const profile = await getOrCreateExpertProfile(session.user.id);

    // Replace the whole weekly schedule atomically.
    const saved = await prisma.$transaction(async (tx) => {
      await tx.availabilitySlot.deleteMany({ where: { expertId: profile.id } });
      if (slots.length > 0) {
        await tx.availabilitySlot.createMany({
          data: slots.map((s) => ({
            expertId: profile.id,
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isActive: true,
          })),
        });
      }
      return tx.availabilitySlot.findMany({
        where: { expertId: profile.id },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      });
    });

    return NextResponse.json({ slots: saved });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[EXPERT AVAILABILITY PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
