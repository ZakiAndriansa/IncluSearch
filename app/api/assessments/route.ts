import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkAssessmentLimit } from "@/lib/quota-checker";
import { z } from "zod";

const AssessmentSchema = z.object({
  childName: z.string().min(1),
  childAge: z.number().int().min(1).max(30),
  challengeType: z.enum([
    "LEARNING_DIFFICULTIES",
    "BEHAVIORAL_CHALLENGES",
    "COMMUNICATION_ISSUES",
    "SENSORY_PROCESSING",
    "SOCIAL_EMOTIONAL",
    "MULTIPLE_CHALLENGES",
  ]),
  challengeDetails: z.string().optional(),
  learningEnv: z.enum(["HOME", "SCHOOL", "BOTH", "THERAPY_CENTER"]),
  locationPref: z.enum(["ONLINE", "OFFLINE", "BOTH"]).default("ONLINE"),
  goals: z.array(z.string()).default([]),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = AssessmentSchema.parse(body);

    const limit = await checkAssessmentLimit(session.user.id);
    if (!limit.allowed) {
      return NextResponse.json({ error: limit.message }, { status: 403 });
    }

    // Atomically deactivate all existing + create new active one
    const assessment = await prisma.$transaction(async (tx) => {
      await tx.assessment.updateMany({
        where: { userId: session.user.id, isActive: true },
        data: { isActive: false },
      });
      return tx.assessment.create({
        data: { userId: session.user.id, ...data, isActive: true },
      });
    });

    return NextResponse.json({ assessment }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[ASSESSMENT CREATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessments = await prisma.assessment.findMany({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ assessments });
}
