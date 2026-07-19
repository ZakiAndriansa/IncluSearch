import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const field = z.string().max(4000).optional().nullable();

const PersonalAssessmentSchema = z.object({
  cognitiveStrength: field,
  cognitiveWeakness: field,
  cognitiveNeed: field,
  socialStrength: field,
  socialWeakness: field,
  socialNeed: field,
  psychomotorStrength: field,
  psychomotorWeakness: field,
  psychomotorNeed: field,
  submit: z.boolean().optional(),
});

async function loadConsultation(id: string) {
  return prisma.consultation.findUnique({
    where: { id },
    select: {
      id: true,
      parentId: true,
      expertId: true,
      expert: { select: { userId: true } },
    },
  });
}

// GET — participant (expert or parent) reads the personal assessment.
export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const consultation = await loadConsultation(params.id);
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isExpert = consultation.expert.userId === session.user.id;
  const isParent = consultation.parentId === session.user.id;
  if (!isExpert && !isParent) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const pa = await prisma.personalAssessment.findUnique({
    where: { consultationId: params.id },
  });

  // Parents only see it once submitted.
  if (isParent && (!pa || pa.status !== "SUBMITTED")) {
    return NextResponse.json({ personalAssessment: null });
  }

  return NextResponse.json({ personalAssessment: pa });
}

// PUT — only the expert of this consultation may write (draft or submit).
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const consultation = await loadConsultation(params.id);
  if (!consultation) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (consultation.expert.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { submit, ...fields } = PersonalAssessmentSchema.parse(body);

    // Link the parent's currently-active initial assessment (for context).
    const activeAssessment = await prisma.assessment.findFirst({
      where: { userId: consultation.parentId, isActive: true },
      select: { id: true },
    });

    const status = submit ? "SUBMITTED" : "DRAFT";
    const submittedAt = submit ? new Date() : null;

    const saved = await prisma.personalAssessment.upsert({
      where: { consultationId: params.id },
      create: {
        consultationId: params.id,
        expertId: consultation.expertId,
        assessmentId: activeAssessment?.id ?? null,
        status,
        submittedAt,
        ...fields,
      },
      update: {
        assessmentId: activeAssessment?.id ?? undefined,
        status,
        submittedAt,
        ...fields,
      },
    });

    return NextResponse.json({ personalAssessment: saved });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[PERSONAL ASSESSMENT PUT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
