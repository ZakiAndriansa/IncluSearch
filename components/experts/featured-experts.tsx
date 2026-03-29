import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ExpertCard } from "@/components/experts/expert-card";
import { matchExperts } from "@/lib/matching-algorithm";
import type { ExpertCardData } from "@/components/experts/expert-card";

interface FeaturedExpertsProps {
  assessmentId?: string;
}

export async function FeaturedExperts({ assessmentId }: FeaturedExpertsProps) {
  const experts = await prisma.expertProfile.findMany({
    where: { isVerified: true, isAvailable: true },
    include: {
      user: { select: { name: true, image: true, email: true } },
      availabilitySlots: { where: { isActive: true } },
    },
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    take: assessmentId ? 30 : 4,
  });

  let expertCards: ExpertCardData[] = experts.slice(0, 4).map((e) => ({ ...e }));
  let hasAssessment = false;

  if (assessmentId) {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
    });

    if (assessment) {
      hasAssessment = true;
      const matches = matchExperts(assessment, experts, experts.length);
      // Homepage: only show ≥50% match, max 4
      const above50 = matches
        .filter((m) => m.score >= 50)
        .slice(0, 4);

      expertCards = above50.map((m) => ({
        ...(m.expert as (typeof experts)[0]),
        user: (m.expert as (typeof experts)[0]).user,
        matchScore: m.score,
        matchReasons: m.reasons,
      }));
    }
  }

  if (expertCards.length === 0) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white p-8 text-center space-y-2">
        <p className="text-sand-500 text-sm">
          {hasAssessment
            ? "Belum ada pakar dengan kecocokan di atas 50% untuk asesmen ini."
            : "Belum ada pakar tersedia saat ini."}
        </p>
        {hasAssessment && (
          <Link
            href="/cari-pakar"
            className="text-sm text-teal-dark hover:text-olive-500 font-medium"
          >
            Lihat semua pakar →
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {expertCards.map((expert) => (
        <ExpertCard key={expert.id} expert={expert} />
      ))}
    </div>
  );
}
