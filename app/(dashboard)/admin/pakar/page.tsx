import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, formatDate, getInitials, SPECIALIZATION_LABELS } from "@/lib/utils";
import { VerifyExpertButton } from "@/components/admin/verify-expert-button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Database Akun Pakar" };

export default async function AdminExpertsPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const experts = await prisma.expertProfile.findMany({
    orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
    take: 200,
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
  });

  const verified = experts.filter((e) => e.isVerified).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Database Akun Pakar
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          {experts.length} akun pakar · {verified} terverifikasi. Halaman ini hanya untuk admin.
        </p>
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
                  <VerifyExpertButton expertId={e.id} isVerified={e.isVerified} />
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
    </div>
  );
}
