import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpertSearch } from "@/components/experts/expert-search";
import { ExpertCardSkeleton } from "@/components/experts/expert-card-skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cari Pakar",
  description: "Temukan pakar ortopedagogik yang tepat untuk kebutuhan anak Anda",
};

interface SearchParams {
  q?: string;
  spec?: string;
  location?: string;
  sortBy?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function CariPakarPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  const page = parseInt(searchParams.page ?? "1");
  const perPage = 9;

  const activeAssessment = await prisma.assessment.findFirst({
    where: { userId: session.user.id, isActive: true },
    orderBy: { createdAt: "desc" },
  });

  const where = {
    isVerified: true,
    ...(searchParams.spec
      ? { specializations: { has: searchParams.spec as any } }
      : {}),
    ...(searchParams.location && searchParams.location !== "all"
      ? { locationType: searchParams.location as any }
      : {}),
    ...(searchParams.q
      ? {
          user: {
            name: { contains: searchParams.q, mode: "insensitive" as const },
          },
        }
      : {}),
  };

  const [experts, total] = await Promise.all([
    prisma.expertProfile.findMany({
      where,
      include: {
        user: { select: { name: true, image: true, email: true } },
        availabilitySlots: { where: { isActive: true } },
      },
      orderBy:
        searchParams.sortBy === "price-asc"
          ? { hourlyRate: "asc" }
          : searchParams.sortBy === "price-desc"
          ? { hourlyRate: "desc" }
          : [{ rating: "desc" }, { totalReviews: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.expertProfile.count({ where }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Cari Pakar Ortopedagogik
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          {total} pakar tersedia{activeAssessment ? ` · Urutan disesuaikan dengan asesmen ${activeAssessment.childName}` : ""}
        </p>
      </div>

      <ExpertSearch
        initialExperts={experts.map((e) => ({ ...e }))}
        total={total}
        page={page}
        perPage={perPage}
        assessment={activeAssessment}
        searchParams={searchParams}
      />
    </div>
  );
}
