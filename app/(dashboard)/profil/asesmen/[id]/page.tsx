import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { matchExperts } from "@/lib/matching-algorithm";
import {
  CHALLENGE_TYPE_LABELS,
  formatDate,
  SPECIALIZATION_LABELS,
} from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExpertCard } from "@/components/experts/expert-card";
import { AssessmentEditForm } from "@/components/assessment/assessment-edit-form";
import {
  ArrowLeft,
  Baby,
  Brain,
  MapPin,
  BookOpen,
  Target,
  CalendarDays,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Detail Asesmen" };

const LEARNING_ENV_LABELS: Record<string, string> = {
  HOME: "Rumah",
  SCHOOL: "Sekolah",
  BOTH: "Rumah & Sekolah",
  THERAPY_CENTER: "Pusat Terapi",
};

const LOCATION_PREF_LABELS: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Tatap Muka",
  BOTH: "Keduanya",
};

export default async function AssessmentDetailPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { edit?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id, isActive: true },
  });

  if (!assessment) notFound();

  // Compute matched experts
  const expertProfiles = await prisma.expertProfile.findMany({
    where: { isVerified: true, isAvailable: true },
    include: {
      user: { select: { name: true, image: true, email: true } },
      availabilitySlots: { where: { isActive: true } },
    },
    orderBy: [{ rating: "desc" }, { totalReviews: "desc" }],
    take: 20,
  });

  const matches = matchExperts(assessment, expertProfiles, 4);
  const matchedExperts = matches.map((m) => ({
    ...(m.expert as (typeof expertProfiles)[0]),
    matchScore: m.score,
    matchReasons: m.reasons,
  }));

  const isEditing = searchParams.edit === "1";

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="text-sand-500 -ml-2">
        <Link href="/profil?tab=asesmen">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Asesmen
        </Link>
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-500">
            {assessment.childName}
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            Dibuat {formatDate(assessment.createdAt)}
            {assessment.updatedAt > assessment.createdAt && (
              <> · Diperbarui {formatDate(assessment.updatedAt)}</>
            )}
          </p>
        </div>
        {!isEditing && (
          <Button asChild size="sm" variant="outline" className="border-sand-300 flex-shrink-0">
            <Link href={`/profil/asesmen/${assessment.id}?edit=1`}>
              <Pencil className="w-3.5 h-3.5 mr-1.5" />
              Edit
            </Link>
          </Button>
        )}
      </div>

      {/* Edit form */}
      {isEditing ? (
        <AssessmentEditForm assessment={assessment} />
      ) : (
        <>
          {/* Detail cards */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-sand-200 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                <Baby className="w-4 h-4 text-forest-500" />
              </div>
              <div>
                <div className="text-xs text-sand-400 mb-0.5">Usia Anak</div>
                <div className="font-semibold text-forest-500">{assessment.childAge} tahun</div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-sand-200 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-teal-dark/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-4 h-4 text-teal-dark" />
              </div>
              <div>
                <div className="text-xs text-sand-400 mb-0.5">Jenis Tantangan</div>
                <div className="font-semibold text-forest-500">
                  {CHALLENGE_TYPE_LABELS[assessment.challengeType] ?? assessment.challengeType}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-sand-200 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-olive-50 flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-olive-500" />
              </div>
              <div>
                <div className="text-xs text-sand-400 mb-0.5">Lingkungan Belajar</div>
                <div className="font-semibold text-forest-500">
                  {LEARNING_ENV_LABELS[assessment.learningEnv] ?? assessment.learningEnv}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-sand-200 p-4 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-amber-500" />
              </div>
              <div>
                <div className="text-xs text-sand-400 mb-0.5">Preferensi Konsultasi</div>
                <div className="font-semibold text-forest-500">
                  {LOCATION_PREF_LABELS[assessment.locationPref] ?? assessment.locationPref}
                </div>
              </div>
            </div>
          </div>

          {/* Challenge details */}
          {assessment.challengeDetails && (
            <div className="bg-white rounded-xl border border-sand-200 p-4">
              <div className="text-xs text-sand-400 mb-1.5">Deskripsi Tantangan</div>
              <p className="text-sm text-forest-500 leading-relaxed">{assessment.challengeDetails}</p>
            </div>
          )}

          {/* Goals */}
          {assessment.goals.length > 0 && (
            <div className="bg-white rounded-xl border border-sand-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-4 h-4 text-forest-500" />
                <span className="text-sm font-semibold text-forest-500">Tujuan Konsultasi</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {assessment.goals.map((g) => (
                  <Badge key={g} className="bg-forest-50 text-forest-500 border-forest-100 text-xs">
                    {g}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Matched experts */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-serif font-semibold text-forest-500">
                Pakar yang Cocok
              </h2>
              <Link
                href="/cari-pakar"
                className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors"
              >
                Lihat semua →
              </Link>
            </div>

            {matchedExperts.length === 0 ? (
              <div className="rounded-xl border border-sand-200 bg-white p-8 text-center text-sand-400 text-sm">
                Belum ada pakar tersedia saat ini.
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {matchedExperts.map((expert) => (
                  <ExpertCard key={expert.id} expert={expert} isPremium={true} />
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
