import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const expertProfile = await prisma.expertProfile.findUnique({
    where: { userId: session.user.id },
    select: { id: true, rating: true, totalReviews: true, hourlyRate: true },
  });

  if (!expertProfile) {
    return NextResponse.json({ error: "Expert profile not found" }, { status: 404 });
  }

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalCompleted,
    totalScheduled,
    thisMonthCompleted,
    lastMonthCompleted,
    totalEarnings,
    thisMonthEarnings,
    recentConsultations,
    reviews,
  ] = await Promise.all([
    // Total completed consultations
    prisma.consultation.count({
      where: { expertId: expertProfile.id, status: "COMPLETED" },
    }),
    // Total scheduled (upcoming)
    prisma.consultation.count({
      where: {
        expertId: expertProfile.id,
        status: "SCHEDULED",
        scheduledAt: { gte: now },
      },
    }),
    // This month completed
    prisma.consultation.count({
      where: {
        expertId: expertProfile.id,
        status: "COMPLETED",
        completedAt: { gte: thisMonthStart },
      },
    }),
    // Last month completed
    prisma.consultation.count({
      where: {
        expertId: expertProfile.id,
        status: "COMPLETED",
        completedAt: { gte: lastMonthStart, lt: thisMonthStart },
      },
    }),
    // Total earnings (from paid consultations)
    prisma.consultation.aggregate({
      where: {
        expertId: expertProfile.id,
        status: { in: ["COMPLETED", "SCHEDULED", "IN_PROGRESS"] },
        payment: { status: "PAID" },
      },
      _sum: { totalAmount: true },
    }),
    // This month earnings
    prisma.consultation.aggregate({
      where: {
        expertId: expertProfile.id,
        status: { in: ["COMPLETED", "SCHEDULED", "IN_PROGRESS"] },
        payment: { status: "PAID", paidAt: { gte: thisMonthStart } },
      },
      _sum: { totalAmount: true },
    }),
    // Recent consultations (last 30 days)
    prisma.consultation.findMany({
      where: {
        expertId: expertProfile.id,
        scheduledAt: { gte: last30Days },
        status: { in: ["COMPLETED", "SCHEDULED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMins: true,
        totalAmount: true,
        status: true,
        completedAt: true,
        parent: { select: { name: true } },
      },
      orderBy: { scheduledAt: "desc" },
      take: 20,
    }),
    // Recent reviews (join reviewer name manually since no relation)
    prisma.expertReview.findMany({
      where: { expertId: expertProfile.id },
      select: {
        id: true,
        rating: true,
        comment: true,
        createdAt: true,
        reviewerId: true,
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  // Rating distribution
  const ratingDist = await prisma.expertReview.groupBy({
    by: ["rating"],
    where: { expertId: expertProfile.id },
    _count: true,
  });

  const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratingDist.forEach((r: { rating: number; _count: number }) => {
    ratingDistribution[r.rating] = r._count;
  });

  // Resolve reviewer names
  const reviewerIds = Array.from(new Set(reviews.map((r) => r.reviewerId)));
  const reviewers = reviewerIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: reviewerIds } },
        select: { id: true, name: true },
      })
    : [];
  const reviewerMap = new Map(reviewers.map((u) => [u.id, u.name]));

  const reviewsWithNames = reviews.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    user: { name: reviewerMap.get(r.reviewerId) ?? "Pengguna" },
  }));

  return NextResponse.json({
    profile: {
      rating: expertProfile.rating,
      totalReviews: expertProfile.totalReviews,
      hourlyRate: expertProfile.hourlyRate,
    },
    stats: {
      totalCompleted,
      totalScheduled,
      thisMonthCompleted,
      lastMonthCompleted,
      monthlyGrowth: lastMonthCompleted > 0
        ? Math.round(((thisMonthCompleted - lastMonthCompleted) / lastMonthCompleted) * 100)
        : thisMonthCompleted > 0 ? 100 : 0,
      totalEarnings: totalEarnings._sum.totalAmount ?? 0,
      thisMonthEarnings: thisMonthEarnings._sum.totalAmount ?? 0,
    },
    ratingDistribution,
    recentConsultations,
    reviews: reviewsWithNames,
  });
}
