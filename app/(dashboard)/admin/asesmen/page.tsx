import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, CHALLENGE_TYPE_LABELS } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";
import { ClipboardList, FileText } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Database Asesmen" };

const PER_PAGE = 10;

export default async function AdminAssessmentsPage({
  searchParams,
}: {
  searchParams: { pa?: string; pp?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const pa = Math.max(1, parseInt(searchParams.pa ?? "1") || 1); // page: asesmen awal
  const pp = Math.max(1, parseInt(searchParams.pp ?? "1") || 1); // page: asesmen pribadi

  const [initial, initialTotal, personal, personalTotal] = await Promise.all([
    prisma.assessment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pa - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        childName: true,
        childAge: true,
        challengeType: true,
        isActive: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
      },
    }),
    prisma.assessment.count(),
    prisma.personalAssessment.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pp - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        status: true,
        createdAt: true,
        consultationId: true,
        expert: { select: { user: { select: { name: true } } } },
        consultation: { select: { parent: { select: { name: true } } } },
      },
    }),
    prisma.personalAssessment.count(),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Database Asesmen
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Arsip seluruh asesmen untuk keperluan pengawasan (read-only).
        </p>
      </div>

      {/* Asesmen awal */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100 flex items-center gap-2">
          <FileText className="w-4 h-4 text-forest-500" />
          <h2 className="font-semibold text-forest-500">Asesmen Awal (Orang Tua)</h2>
          <span className="text-xs text-sand-400">· {initialTotal}</span>
        </div>
        {initial.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sand-400">Belum ada asesmen.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {initial.map((a) => (
              <div key={a.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-forest-500 truncate">
                    {a.childName}, {a.childAge} th
                    {!a.isActive && (
                      <span className="ml-2 text-[10px] text-sand-400 font-normal">(arsip)</span>
                    )}
                  </div>
                  <div className="text-xs text-sand-400 truncate">
                    {a.user.name ?? a.user.email} · {CHALLENGE_TYPE_LABELS[a.challengeType] ?? a.challengeType}
                  </div>
                </div>
                <span className="text-xs text-sand-400">{formatDate(a.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Pagination
        basePath="/admin/asesmen"
        page={pa}
        totalPages={Math.ceil(initialTotal / PER_PAGE)}
        query={{ pp: String(pp) }}
      />

      {/* Asesmen pribadi / ahli */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100 flex items-center gap-2">
          <ClipboardList className="w-4 h-4 text-teal-dark" />
          <h2 className="font-semibold text-forest-500">Asesmen Pribadi (Pakar)</h2>
          <span className="text-xs text-sand-400">· {personalTotal}</span>
        </div>
        {personal.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sand-400">Belum ada asesmen pribadi.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {personal.map((p) => (
              <div key={p.id} className="px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-forest-500 truncate">
                    Pakar: {p.expert.user.name ?? "-"}
                  </div>
                  <div className="text-xs text-sand-400 truncate">
                    Orang tua: {p.consultation.parent.name ?? "-"}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full border ${
                      p.status === "SUBMITTED"
                        ? "bg-forest-50 text-forest-600 border-forest-200"
                        : "bg-amber-50 text-amber-600 border-amber-200"
                    }`}
                  >
                    {p.status === "SUBMITTED" ? "Terkirim" : "Draf"}
                  </span>
                  <span className="text-xs text-sand-400">{formatDate(p.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Pagination
        basePath="/admin/asesmen"
        page={pp}
        totalPages={Math.ceil(personalTotal / PER_PAGE)}
        query={{ pa: String(pa) }}
      />
    </div>
  );
}
