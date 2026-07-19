import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const SPECIALIZATIONS = [
  "LEARNING_DIFFICULTIES",
  "BEHAVIORAL_SUPPORT",
  "COMMUNICATION_DISORDERS",
  "SENSORY_PROCESSING",
  "AUTISM_SPECTRUM",
  "ADHD",
  "DOWN_SYNDROME",
  "EMOTIONAL_REGULATION",
  "SOCIAL_SKILLS",
  "MOTOR_DEVELOPMENT",
] as const;

const UpdateExpertSchema = z.object({
  name: z.string().min(2).optional(),
  bio: z.string().max(2000).optional(),
  hourlyRate: z.number().int().min(0).max(100_000_000).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  education: z.string().max(500).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  locationType: z.enum(["ONLINE", "OFFLINE", "BOTH"]).optional(),
  specializations: z.array(z.enum(SPECIALIZATIONS)).max(10).optional(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  isVerified: z.boolean().optional(),
});

// PATCH /api/admin/experts/[id] — admin edits any expert's profile.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { name, ...rest } = UpdateExpertSchema.parse(await request.json());

    const existing = await prisma.expertProfile.findUnique({
      where: { id: params.id },
      select: { userId: true },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.$transaction(async (tx) => {
      await tx.expertProfile.update({ where: { id: params.id }, data: rest });
      if (name !== undefined || rest.profilePhotoUrl !== undefined) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            ...(name !== undefined ? { name } : {}),
            ...(rest.profilePhotoUrl !== undefined ? { image: rest.profilePhotoUrl } : {}),
          },
        });
      }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[ADMIN EXPERT PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
