import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil, Users2, BadgeCheck } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/pagination";
import { DeleteCommunityButton } from "@/components/admin/delete-community-button";
import type { Metadata } from "next";
import type { OrgType } from "@prisma/client";

export const metadata: Metadata = { title: "Kelola Forum" };

const PER_PAGE = 10;

const ORG_LABEL: Record<OrgType, string> = {
  FOUNDATION: "Yayasan",
  SCHOOL: "Sekolah",
  THERAPY_CENTER: "Pusat Terapi",
  SUPPORT_GROUP: "Kelompok Dukungan",
  GOVERNMENT: "Pemerintah",
  NGO: "LSM",
};

export default async function AdminForumPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        description: true,
        orgType: true,
        region: true,
        province: true,
        memberCount: true,
        isVerified: true,
        isActive: true,
        logoUrl: true,
      },
    }),
    prisma.community.count(),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Kelola Forum</h1>
          <p className="text-sand-500 text-sm mt-1">{total} komunitas / forum ke-ABK-an.</p>
        </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
          <Link href="/admin/forum/baru">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah
          </Link>
        </Button>
      </div>

      {communities.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center text-sand-400 text-sm">
          Belum ada komunitas.
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {communities.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-sand-200 hover:border-forest-300 hover:shadow-sm transition-all p-4 flex flex-col"
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-sand-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <Users2 className="w-6 h-6 text-sand-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-semibold text-forest-500 text-sm leading-tight truncate">
                        {c.name}
                      </h3>
                      {c.isVerified && <BadgeCheck className="w-3.5 h-3.5 text-teal-dark flex-shrink-0" />}
                    </div>
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-sand-600 border border-sand-200">
                      {ORG_LABEL[c.orgType]}
                    </span>
                    {!c.isActive && (
                      <span className="ml-1.5 text-[10px] text-amber-600">nonaktif</span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-sand-600 line-clamp-2 mb-3 leading-relaxed">
                  {c.description}
                </p>

                <div className="text-xs text-sand-400 mb-3">
                  {c.region}, {c.province} · {c.memberCount.toLocaleString("id-ID")} anggota
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3 border-t border-sand-100">
                  <Link
                    href={`/admin/forum/${c.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-sand-300 text-sand-600 hover:bg-sand-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <DeleteCommunityButton id={c.id} />
                </div>
              </div>
            ))}
          </div>
          <Pagination basePath="/admin/forum" page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
