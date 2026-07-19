import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateExpertProfile } from "@/lib/expert";
import { CHALLENGE_TYPE_LABELS } from "@/lib/utils";
import { ClipboardList, ArrowRight } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Asesmen Klien" };

export default async function ExpertAssessmentsPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "EXPERT") redirect("/");

  const profile = await getOrCreateExpertProfile(session.user.id);

  // Paid consultations booked with this expert.
  const consults = await prisma.consultation.findMany({
    where: {
      expertId: profile.id,
      status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      parentId: true,
      scheduledAt: true,
      parent: { select: { name: true } },
      personalAssessment: { select: { status: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  // Keep the latest consultation per parent.
  const latestByParent = new Map<string, (typeof consults)[number]>();
  for (const c of consults) {
    if (!latestByParent.has(c.parentId)) latestByParent.set(c.parentId, c);
  }
  const rows = Array.from(latestByParent.values());

  // Fetch each parent's active initial assessment.
  const parentIds = rows.map((r) => r.parentId);
  const assessments = await prisma.assessment.findMany({
    where: { userId: { in: parentIds }, isActive: true },
    select: {
      userId: true,
      childName: true,
      childAge: true,
      challengeType: true,
      challengeDetails: true,
      goals: true,
      documentUrl: true,
      documentName: true,
    },
  });
  const assessmentByParent = new Map(assessments.map((a) => [a.userId, a]));

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Asesmen Klien
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Asesmen awal dari orang tua yang berkonsultasi dengan Anda.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-semibold text-forest-500 mb-1">Belum ada klien</h3>
          <p className="text-sand-500 text-sm">
            Asesmen akan muncul di sini setelah ada orang tua yang memesan konsultasi.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((c) => {
            const a = assessmentByParent.get(c.parentId);
            return (
              <div
                key={c.parentId}
                className="bg-white rounded-2xl border border-sand-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-forest-500 text-sm">
                      {c.parent.name ?? "Orang tua"}
                    </div>
                    {a ? (
                      <div className="text-xs text-sand-500 mt-1 space-y-0.5">
                        <div>
                          Anak: <span className="text-forest-500">{a.childName}</span>, {a.childAge} tahun
                        </div>
                        <div>
                          {CHALLENGE_TYPE_LABELS[a.challengeType] ?? a.challengeType}
                          {a.goals.length > 0 && ` · Tujuan: ${a.goals.slice(0, 3).join(", ")}`}
                        </div>
                        {a.challengeDetails && (
                          <div className="text-sand-400 line-clamp-2">{a.challengeDetails}</div>
                        )}
                        {a.documentUrl && (
                          <a
                            href={a.documentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-teal-dark hover:underline"
                          >
                            📄 {a.documentName ?? "Dokumen PDF"}
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-sand-400 mt-1">
                        Orang tua belum mengisi asesmen awal.
                      </div>
                    )}
                  </div>
                  {c.personalAssessment?.status === "SUBMITTED" && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 border border-forest-200 flex-shrink-0">
                      Asesmen terkirim
                    </span>
                  )}
                </div>

                <Link
                  href={`/konsultasi/${c.id}/asesmen-pribadi`}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-teal-dark hover:underline"
                >
                  <ClipboardList className="w-3.5 h-3.5" />
                  {c.personalAssessment ? "Buka Asesmen Pribadi" : "Isi Asesmen Pribadi"}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
