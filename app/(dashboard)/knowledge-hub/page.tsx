import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ContentGrid } from "@/components/knowledge/content-grid";
import { ContentFilters } from "@/components/knowledge/content-filters";
import { Crown, BookOpen } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Knowledge Hub",
  description: "Artikel, video, dan modul edukasi tentang Anak Berkebutuhan Khusus",
};

interface SearchParams {
  category?: string;
  type?: string;
  q?: string;
  age?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function KnowledgeHubPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  // Always read isPremium from DB — JWT can be stale after webhook updates
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    dbUser?.isPremium === true &&
    (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date());

  const page = parseInt(searchParams.page ?? "1");
  const perPage = 12;

  const where = {
    publishedAt: { not: null as null },
    ...(searchParams.category ? { category: searchParams.category as any } : {}),
    ...(searchParams.type ? { type: searchParams.type as any } : {}),
    ...(searchParams.q
      ? { title: { contains: searchParams.q, mode: "insensitive" as const } }
      : {}),
  };

  const [contents, total, premiumCount] = await Promise.all([
    prisma.knowledgeContent.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        type: true,
        category: true,
        isPremium: true,
        thumbnailUrl: true,
        readTimeMins: true,
        viewCount: true,
        publishedAt: true,
      },
    }),
    prisma.knowledgeContent.count({ where }),
    prisma.knowledgeContent.count({
      where: { ...where, isPremium: true },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-forest-500">
          Knowledge Hub
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          {total} konten edukasi tentang Anak Berkebutuhan Khusus
        </p>
      </div>

      {/* Premium banner for free users */}
      {!isPremium && premiumCount > 0 && (
        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-white">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-white blur-2xl" />
          </div>
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-semibold text-sm">
                  {premiumCount} konten video & modul premium tersedia
                </p>
                <p className="text-amber-100 text-xs mt-0.5">
                  Upgrade ke Premium untuk akses penuh termasuk semua video tutorial eksklusif
                </p>
              </div>
            </div>
            <Link
              href="/profil?tab=premium"
              className="flex-shrink-0 px-4 py-2 bg-white text-amber-600 rounded-xl text-sm font-semibold hover:bg-amber-50 transition-colors"
            >
              Upgrade
            </Link>
          </div>
        </div>
      )}

      {/* Filters */}
      <ContentFilters searchParams={searchParams} />

      {/* Content grid */}
      <ContentGrid
        contents={contents}
        total={total}
        page={page}
        perPage={perPage}
        isPremium={isPremium}
      />
    </div>
  );
}
