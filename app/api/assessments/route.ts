import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessmentSchema } from "@/lib/schemas";
import { z } from "zod";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = assessmentSchema.parse(body);

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
