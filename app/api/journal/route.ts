import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const journalSchema = z.object({
  date: z.string(),
  childName: z.string().min(1),
  mood: z.enum(["VERY_HAPPY", "HAPPY", "NEUTRAL", "SAD", "VERY_SAD"]),
  sleepQuality: z.enum(["VERY_GOOD", "GOOD", "FAIR", "POOR", "VERY_POOR"]).optional(),
  appetiteLevel: z.enum(["VERY_GOOD", "GOOD", "FAIR", "POOR", "REFUSED"]).optional(),
  tantrumCount: z.number().int().min(0).default(0),
  achievements: z.array(z.string()).default([]),
  challenges: z.array(z.string()).default([]),
  behaviors: z.array(z.string()).default([]),
  activities: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

// POST: Create or update daily journal entry
export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = journalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;
  const dateObj = new Date(data.date);
  dateObj.setHours(0, 0, 0, 0);

  // Check premium for journal history limit
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // Free users: max 7 days of journal entries
  if (!isPremium) {
    const journalCount = await prisma.dailyJournal.count({
      where: { userId: session.user.id },
    });
    if (journalCount >= 30) {
      // Keep last 30 entries for free users, delete oldest
      const oldest = await prisma.dailyJournal.findMany({
        where: { userId: session.user.id },
        orderBy: { date: "asc" },
        take: 1,
        select: { id: true },
      });
      if (oldest.length > 0) {
        await prisma.dailyJournal.delete({ where: { id: oldest[0].id } });
      }
    }
  }

  const journal = await prisma.dailyJournal.upsert({
    where: {
      userId_date_childName: {
        userId: session.user.id,
        date: dateObj,
        childName: data.childName,
      },
    },
    update: {
      mood: data.mood,
      sleepQuality: data.sleepQuality,
      appetiteLevel: data.appetiteLevel,
      tantrumCount: data.tantrumCount,
      achievements: data.achievements,
      challenges: data.challenges,
      behaviors: data.behaviors,
      activities: data.activities,
      notes: data.notes,
    },
    create: {
      userId: session.user.id,
      date: dateObj,
      childName: data.childName,
      mood: data.mood,
      sleepQuality: data.sleepQuality,
      appetiteLevel: data.appetiteLevel,
      tantrumCount: data.tantrumCount,
      achievements: data.achievements,
      challenges: data.challenges,
      behaviors: data.behaviors,
      activities: data.activities,
      notes: data.notes,
    },
  });

  return NextResponse.json({ journal }, { status: 201 });
}

// GET: List journal entries
export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const childName = searchParams.get("childName");
  const days = parseInt(searchParams.get("days") || "7");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // Free users: max 7 days, premium: unlimited
  const maxDays = isPremium ? days : Math.min(days, 7);
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - maxDays);
  startDate.setHours(0, 0, 0, 0);

  const journals = await prisma.dailyJournal.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate },
      ...(childName ? { childName } : {}),
    },
    orderBy: { date: "desc" },
  });

  // Calculate trends for premium
  let trends = null;
  if (isPremium && journals.length >= 3) {
    const moodValues: Record<string, number> = {
      VERY_SAD: 1, SAD: 2, NEUTRAL: 3, HAPPY: 4, VERY_HAPPY: 5,
    };
    const moodScores = journals.map(j => moodValues[j.mood] || 3);
    const avgMood = moodScores.reduce((a, b) => a + b, 0) / moodScores.length;
    const totalTantrums = journals.reduce((a, j) => a + j.tantrumCount, 0);
    const avgTantrums = totalTantrums / journals.length;

    // Trend: compare first half vs second half
    const mid = Math.floor(moodScores.length / 2);
    const firstHalf = moodScores.slice(mid);
    const secondHalf = moodScores.slice(0, mid);
    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    trends = {
      avgMood: Math.round(avgMood * 10) / 10,
      avgTantrums: Math.round(avgTantrums * 10) / 10,
      moodTrend: secondAvg > firstAvg ? "improving" : secondAvg < firstAvg ? "declining" : "stable",
      totalEntries: journals.length,
      totalAchievements: journals.reduce((a, j) => a + j.achievements.length, 0),
    };
  }

  return NextResponse.json({ journals, trends, isPremium });
}
