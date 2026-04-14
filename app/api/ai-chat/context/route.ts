import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // Get child context from active assessment
  const assessment = await prisma.assessment.findFirst({
    where: { userId: session.user.id, isActive: true },
    select: { childName: true, childAge: true, challengeType: true, goals: true },
  });

  // Get weekly summary for premium users
  let weekly = null;
  if (isPremium) {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [journals, activePlan] = await Promise.all([
      prisma.dailyJournal.findMany({
        where: { userId: session.user.id, date: { gte: weekAgo } },
        select: { mood: true, tantrumCount: true, achievements: true },
      }),
      prisma.actionPlan.findFirst({
        where: { userId: session.user.id, isActive: true },
        select: {
          title: true,
          activities: { select: { isCompleted: true } },
        },
      }),
    ]);

    if (journals.length > 0) {
      const moodValues: Record<string, number> = {
        VERY_SAD: 1, SAD: 2, NEUTRAL: 3, HAPPY: 4, VERY_HAPPY: 5,
      };
      const avgMood = journals.reduce((s, j) => s + (moodValues[j.mood] || 3), 0) / journals.length;
      const totalTantrums = journals.reduce((s, j) => s + j.tantrumCount, 0);
      const allAchievements = journals.flatMap((j) => j.achievements).slice(0, 5);

      const planTotal = activePlan?.activities.length || 0;
      const planDone = activePlan?.activities.filter((a) => a.isCompleted).length || 0;

      weekly = {
        avgMood: Math.round(avgMood * 10) / 10,
        totalTantrums,
        journalDays: journals.length,
        planProgress: planTotal > 0 ? Math.round((planDone / planTotal) * 100) : 0,
        planTitle: activePlan?.title || "",
        achievements: allAchievements,
      };
    }
  }

  return NextResponse.json({
    child: assessment
      ? {
          childName: assessment.childName,
          childAge: assessment.childAge,
          challengeType: assessment.challengeType,
          goals: assessment.goals,
        }
      : null,
    weekly,
    isPremium,
  });
}
