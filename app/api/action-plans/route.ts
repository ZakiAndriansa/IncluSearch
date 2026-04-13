import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateActionPlan } from "@/lib/action-plan-generator";
import type { ChallengeType } from "@/lib/enums";

// POST: Generate and create an action plan from assessment
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { assessmentId } = body;

  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId required" }, { status: 400 });
  }

  const assessment = await prisma.assessment.findFirst({
    where: { id: assessmentId, userId: session.user.id },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }

  // Check premium status
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // Check if there's an active plan that hasn't ended yet
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentActivePlan = await prisma.actionPlan.findFirst({
    where: {
      userId: session.user.id,
      assessmentId,
      isActive: true,
    },
    include: { activities: { select: { isCompleted: true } } },
    orderBy: { createdAt: "desc" },
  });

  // For free users: block if already has an active plan
  if (!isPremium && currentActivePlan) {
    return NextResponse.json(
      { error: "Selesaikan plan aktif Anda dulu, atau upgrade ke Premium untuk membuat plan baru." },
      { status: 403 }
    );
  }

  // For premium users: check if current plan is still fresh (created within last 24 hours)
  if (isPremium && currentActivePlan) {
    const hoursSinceCreated = (Date.now() - new Date(currentActivePlan.createdAt).getTime()) / (1000 * 60 * 60);
    const completedCount = currentActivePlan.activities.filter(a => a.isCompleted).length;
    const totalCount = currentActivePlan.activities.length;
    const progress = totalCount > 0 ? completedCount / totalCount : 0;

    // Block if plan was just created (< 1 day) and less than 50% done
    if (hoursSinceCreated < 24 && progress < 0.5) {
      return NextResponse.json(
        { error: "Plan aktif baru dibuat. Selesaikan minimal 50% aktivitas sebelum membuat plan baru." },
        { status: 400 }
      );
    }
  }

  // Get current week number (count all plans for this assessment)
  const existingPlans = await prisma.actionPlan.count({
    where: { userId: session.user.id, assessmentId },
  });
  const weekNumber = existingPlans + 1;

  const planData = generateActionPlan(assessment.challengeType as ChallengeType, weekNumber);

  const startDate = new Date();
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + 6);

  // Deactivate previous active plans for this assessment
  await prisma.actionPlan.updateMany({
    where: { userId: session.user.id, assessmentId, isActive: true },
    data: { isActive: false },
  });

  const plan = await prisma.actionPlan.create({
    data: {
      userId: session.user.id,
      assessmentId,
      title: planData.title,
      weekNumber,
      startDate,
      endDate,
      domain: planData.domain as "COMMUNICATION" | "BEHAVIOR" | "SOCIAL" | "ACADEMIC" | "MOTOR" | "EMOTION",
      goalText: planData.goalText,
      activities: {
        create: planData.activities.map((act, i) => ({
          title: act.title,
          description: act.description,
          domain: act.domain as "COMMUNICATION" | "BEHAVIOR" | "SOCIAL" | "ACADEMIC" | "MOTOR" | "EMOTION",
          dayOfWeek: act.dayOfWeek,
          sortOrder: i,
        })),
      },
    },
    include: { activities: { orderBy: { sortOrder: "asc" } } },
  });

  return NextResponse.json({ plan }, { status: 201 });
}

// GET: List user's action plans
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const activeOnly = searchParams.get("active") === "true";

  const plans = await prisma.actionPlan.findMany({
    where: {
      userId: session.user.id,
      ...(activeOnly ? { isActive: true } : {}),
    },
    include: {
      activities: { orderBy: { sortOrder: "asc" } },
      assessment: { select: { childName: true, challengeType: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ plans });
}
