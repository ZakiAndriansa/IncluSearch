import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/shared/hero-section";
import { FeaturedExperts } from "@/components/experts/featured-experts";
import { QuickStats } from "@/components/shared/quick-stats";
import { RecentContent } from "@/components/knowledge/recent-content";
import { AssessmentCTA } from "@/components/assessment/assessment-cta";
import { QuotaStatusCard } from "@/components/consultation/quota-status-card";
import { ExpertCardSkeleton } from "@/components/experts/expert-card-skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();
  if (!session) return null;

  const [expertCount, contentCount, communityCount, userAssessment] =
    await Promise.all([
      prisma.expertProfile.count({ where: { isVerified: true, isAvailable: true } }),
      prisma.knowledgeContent.count({ where: { publishedAt: { not: null } } }),
      prisma.community.count({ where: { isActive: true } }),
      prisma.assessment.findFirst({
        where: { userId: session.user.id, isActive: true },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero / greeting */}
      <HeroSection
        userName={session.user.name ?? ""}
        isPremium={session.user.isPremium}
        hasAssessment={!!userAssessment}
      />

      {/* Quick stats */}
      <QuickStats
        expertCount={expertCount}
        contentCount={contentCount}
        communityCount={communityCount}
      />

      {/* Assessment + Quota — full width row */}
      <div className="grid sm:grid-cols-2 gap-4">
        <AssessmentCTA
          hasAssessment={!!userAssessment}
          assessmentId={userAssessment?.id}
          childName={userAssessment?.childName}
        />
        <QuotaStatusCard
          userId={session.user.id}
          isPremium={session.user.isPremium}
        />
      </div>

      {/* Featured experts */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">
            Pakar Unggulan
          </h2>
          <a
            href="/cari-pakar"
            className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors"
          >
            Lihat semua →
          </a>
        </div>
        <Suspense
          fallback={
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <ExpertCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <FeaturedExperts
            isPremium={session.user.isPremium}
            assessmentId={userAssessment?.id}
          />
        </Suspense>
      </section>

      {/* Recent knowledge content */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">
            Konten Terbaru
          </h2>
          <a
            href="/knowledge-hub"
            className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors"
          >
            Knowledge Hub →
          </a>
        </div>
        <Suspense fallback={<div className="skeleton h-40 w-full" />}>
          <RecentContent isPremium={session.user.isPremium} limit={3} />
        </Suspense>
      </section>
    </div>
  );
}
