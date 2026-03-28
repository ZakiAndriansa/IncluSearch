import { prisma } from "@/lib/prisma";
import { ExpertCard } from "@/components/experts/expert-card";
import { matchExperts } from "@/lib/matching-algorithm";
import type { ExpertCardData } from "@/components/experts/expert-card";

interface FeaturedExpertsProps {
  isPremium: boolean;
  assessmentId?: string;
}

export async function FeaturedExperts({ isPremium, assessmentId }: FeaturedExpertsProps) {
  const experts = await prisma.expertProfile.findMany({
    where: { isVerified: true, isAvailable: true },
    include: {
      user: { select: { name: true, image: true, email: true } },
      availabilitySlots: { where: { isActive: true } },
    },
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    take: assessmentId ? 10 : 4,
  });

  let expertCards: ExpertCardData[] = experts.map((e) => ({ ...e }));

  // If premium + has assessment, compute match scores
  if (isPremium && assessmentId) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (assessment) {
      const matches = matchExperts(assessment, experts, 4);
      expertCards = matches.map((m) => ({
        ...m.expert,
        user: (m.expert as typeof experts[0]).user,
        matchScore: m.score,
        matchReasons: m.reasons,
      }));
    }
  } else {
    expertCards = experts.slice(0, 4).map((e) => ({ ...e }));
  }

  if (expertCards.length === 0) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white p-8 text-center">
        <p className="text-sand-500 text-sm">Belum ada pakar tersedia saat ini.</p>
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {expertCards.map((expert) => (
        <ExpertCard
          key={expert.id}
          expert={expert}
          isPremium={isPremium}
        />
      ))}
    </div>
  );
}
