import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";
import { DeleteParentButton } from "@/components/admin/delete-parent-button";
import { Crown, Plus, Pencil } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Database Orang Tua" };

const PER_PAGE = 10;

export default async function AdminParentsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);
  const where = { role: "PARENT" as const };

  const [parents, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        isPremium: true,
        createdAt: true,
        _count: { select: { consultationsAsParent: true, assessments: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            Database Orang Tua
          </h1>
          <p className="text-sand-500 text-sm mt-1">{total} akun orang tua / wali.</p>
        </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
          <Link href="/admin/orang-tua/baru">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah
          </Link>
        </Button>
      </div>

      {parents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center text-sand-400 text-sm">
          Belum ada akun orang tua.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-sand-200 divide-y divide-sand-100 overflow-hidden">
            {parents.map((p) => (
              <div key={p.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-500 text-sm font-semibold flex-shrink-0">
                    {getInitials(p.name ?? p.email ?? "U")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-forest-500 truncate">
                      {p.name ?? "-"}
                      {p.isPremium && (
                        <Crown className="inline w-3.5 h-3.5 text-amber-500 ml-1.5 -mt-0.5" />
                      )}
                    </div>
                    <div className="text-xs text-sand-400 truncate">{p.email}</div>
                    {p.phone && <div className="text-xs text-sand-400 truncate">{p.phone}</div>}
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="hidden md:flex items-center gap-4 text-xs text-sand-500">
                    <span>{p._count.consultationsAsParent} konsultasi</span>
                    <span>{p._count.assessments} asesmen</span>
                  </div>
                  <Link
                    href={`/admin/orang-tua/${p.id}`}
                    className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-sand-300 text-sand-600 hover:bg-sand-50"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </Link>
                  <DeleteParentButton parentId={p.id} name={p.name ?? "akun ini"} />
                </div>
              </div>
            ))}
          </div>
          <Pagination basePath="/admin/orang-tua" page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
