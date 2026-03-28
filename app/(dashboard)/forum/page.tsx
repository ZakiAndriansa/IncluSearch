import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommunityDirectory } from "@/components/forum/community-directory";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Forum Komunitas",
  description: "Direktori komunitas dan organisasi pendukung ABK",
};

export const revalidate = 3600;

interface SearchParams {
  province?: string;
  focus?: string;
  type?: string;
  q?: string;
  page?: string;
  [key: string]: string | undefined;
}

export default async function ForumPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) return null;

  const page = parseInt(searchParams.page ?? "1");
  const perPage = 12;

  const where = {
    isActive: true,
    ...(searchParams.province ? { province: searchParams.province } : {}),
    ...(searchParams.type ? { orgType: searchParams.type as any } : {}),
    ...(searchParams.focus
      ? { focusAreas: { has: searchParams.focus as any } }
      : {}),
    ...(searchParams.q
      ? { name: { contains: searchParams.q, mode: "insensitive" as const } }
      : {}),
  };

  const [communities, total, provinces] = await Promise.all([
    prisma.community.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { memberCount: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.community.count({ where }),
    prisma.community.findMany({
      where: { isActive: true },
      select: { province: true },
      distinct: ["province"],
      orderBy: { province: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif font-bold text-forest-500">
          Forum & Komunitas ABK
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          {total} komunitas & organisasi pendukung Anak Berkebutuhan Khusus
        </p>
      </div>

      <CommunityDirectory
        communities={communities}
        total={total}
        page={page}
        perPage={perPage}
        provinces={provinces.map((p) => p.province)}
        searchParams={searchParams}
      />
    </div>
  );
}
