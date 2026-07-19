import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDate, getInitials, SPECIALIZATION_LABELS } from "@/lib/utils";
import { VerifyExpertButton } from "@/components/admin/verify-expert-button";
import { Pagination } from "@/components/shared/pagination";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Database Akun Pakar" };

const PER_PAGE = 10;

export default async function AdminExpertsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);

  const [experts, total, verified] = await Promise.all([
    prisma.expertProfile.findMany({
      orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        isVerified: true,
        isAvailable: true,
        hourlyRate: true,
        specializations: true,
        city: true,
        province: true,
        createdAt: true,
        user: { select: { name: true, email: true, phone: true } },
        _count: { select: { consultations: true } },
      },
    }),
    prisma.expertProfile.count(),
    prisma.expertProfile.count({ where: { isVerified: true } }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Database Akun Pakar
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          {total} akun pakar · {verified} terverifikasi. Halaman ini hanya untuk admin.
        </p>
      </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
          <Link href="/admin/pakar/baru">
            <Plus className="w-4 h-4 mr-1.5" /> Tambah Pakar
          </Link>
        </Button>
      </div>

      {experts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center text-sand-400 text-sm">
          Belum ada akun pakar.
        </div>
      ) : (
        <div className="space-y-3">
          {experts.map((e) => (
            <div key={e.id} className="bg-white rounded-2xl border border-sand-200 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-500 text-sm font-semibold flex-shrink-0">
                    {getInitials(e.user.name ?? "P")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-forest-500 truncate">
                      {e.user.name ?? "-"}
                    </div>
                    <div className="text-xs text-sand-400 truncate">{e.user.email}</div>
                    {e.user.phone && (
                      <div className="text-xs text-sand-400 truncate">{e.user.phone}</div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      e.isVerified
                        ? "bg-teal-dark/5 text-teal-dark border-teal-dark/20"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    {e.isVerified ? "Terverifikasi" : "Menunggu"}
                  </span>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/admin/pakar/${e.id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-sand-300 text-sand-600 hover:bg-sand-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <VerifyExpertButton expertId={e.id} isVerified={e.isVerified} />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5 mt-3">
                {e.specializations.map((s) => (
                  <span
                    key={s}
                    className="text-[10px] px-2 py-0.5 rounded-full bg-sand-100 text-sand-600 border border-sand-200"
                  >
                    {SPECIALIZATION_LABELS[s] ?? s}
                  </span>
                ))}
              </div>

              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-sand-500">
                <span>Tarif: <strong className="text-forest-500">{formatCurrency(e.hourlyRate)}</strong>/jam</span>
                <span>Konsultasi: {e._count.consultations}</span>
                <span>{e.city ?? "-"}{e.province ? `, ${e.province}` : ""}</span>
                <span>{e.isAvailable ? "Tersedia" : "Nonaktif"}</span>
                <span>Gabung {formatDate(e.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <Pagination basePath="/admin/pakar" page={page} totalPages={totalPages} />
    </div>
  );
}
