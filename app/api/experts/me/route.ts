import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateExpertProfile } from "@/lib/expert";
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

const ProfileSchema = z.object({
  bio: z.string().max(2000).optional(),
  hourlyRate: z.number().int().min(0).max(100_000_000).optional(),
  yearsExperience: z.number().int().min(0).max(80).optional(),
  education: z.string().max(500).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  locationType: z.enum(["ONLINE", "OFFLINE", "BOTH"]).optional(),
  specializations: z.array(z.enum(SPECIALIZATIONS)).max(10).optional(),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const profile = await getOrCreateExpertProfile(session.user.id);
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const data = ProfileSchema.parse(body);

    // Ensure the profile exists (lazily created for first-time experts).
    await getOrCreateExpertProfile(session.user.id);

    const updated = await prisma.expertProfile.update({
      where: { userId: session.user.id },
      data,
    });

    // Keep the account avatar in sync with the profile photo.
    if (data.profilePhotoUrl !== undefined) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: data.profilePhotoUrl },
      });
    }

    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[EXPERT PROFILE PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
