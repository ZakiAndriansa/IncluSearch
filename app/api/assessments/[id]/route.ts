import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id, isActive: true },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(assessment);
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id, isActive: true },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await request.json();
  const { childName, childAge, challengeType, challengeDetails, learningEnv, locationPref, goals } = body;

  const updated = await prisma.assessment.update({
    where: { id: params.id },
    data: {
      ...(childName !== undefined && { childName }),
      ...(childAge !== undefined && { childAge: parseInt(childAge) }),
      ...(challengeType !== undefined && { challengeType }),
      ...(challengeDetails !== undefined && { challengeDetails }),
      ...(learningEnv !== undefined && { learningEnv }),
      ...(locationPref !== undefined && { locationPref }),
      ...(goals !== undefined && { goals }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.assessment.update({
    where: { id: params.id },
    data: { isActive: false },
  });

  return NextResponse.json({ success: true });
}
