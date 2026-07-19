import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
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

const CreateExpertSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  bio: z.string().max(2000).optional().default(""),
  hourlyRate: z.number().int().min(0).max(100_000_000).optional().default(0),
  yearsExperience: z.number().int().min(0).max(80).optional().default(0),
  education: z.string().max(500).optional().nullable(),
  city: z.string().max(120).optional().nullable(),
  province: z.string().max(120).optional().nullable(),
  locationType: z.enum(["ONLINE", "OFFLINE", "BOTH"]).optional().default("ONLINE"),
  specializations: z.array(z.enum(SPECIALIZATIONS)).max(10).optional().default([]),
  profilePhotoUrl: z.string().max(2000).optional().nullable(),
  isVerified: z.boolean().optional().default(true),
});

// POST /api/admin/experts — admin creates an expert account + profile.
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = CreateExpertSchema.parse(await request.json());
    const hashed = await bcrypt.hash(data.password, 12);

    const profile = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: "EXPERT",
          image: data.profilePhotoUrl ?? null,
        },
      });
      return tx.expertProfile.create({
        data: {
          userId: user.id,
          bio: data.bio,
          hourlyRate: data.hourlyRate,
          yearsExperience: data.yearsExperience,
          education: data.education ?? null,
          city: data.city ?? null,
          province: data.province ?? null,
          locationType: data.locationType,
          specializations: data.specializations,
          profilePhotoUrl: data.profilePhotoUrl ?? null,
          isVerified: data.isVerified,
        },
        select: { id: true },
      });
    });

    return NextResponse.json({ profile }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    console.error("[ADMIN EXPERT CREATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
