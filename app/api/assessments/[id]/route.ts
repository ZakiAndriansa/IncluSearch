import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { assessmentUpdateSchema } from "@/lib/schemas";
import { z } from "zod";

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
    select: { id: true },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  try {
    const body = await request.json();
    // Validate + coerce with the same rules as create; only provided fields update.
    const data = assessmentUpdateSchema.parse(body);

    const updated = await prisma.assessment.update({
      where: { id: params.id },
      data,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[ASSESSMENT UPDATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
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
