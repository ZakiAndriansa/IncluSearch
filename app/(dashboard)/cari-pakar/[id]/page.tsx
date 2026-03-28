import { notFound } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MatchBadge } from "@/components/experts/match-badge";
import {
  formatCurrency,
  getInitials,
  SPECIALIZATION_LABELS,
} from "@/lib/utils";
import {
  Star,
  MapPin,
  Clock,
  GraduationCap,
  Award,
  CalendarDays,
  ArrowLeft,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import type { Metadata } from "next";

const DAY_LABELS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export async function generateMetadata({
  params,
}: {
  params: { id: string };
}): Promise<Metadata> {
  const expert = await prisma.expertProfile.findUnique({
    where: { id: params.id },
    include: { user: { select: { name: true } } },
  });
  return {
    title: expert ? `${expert.user.name} — Pakar` : "Profil Pakar",
  };
}

export default async function ExpertProfilePage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) return null;

  const [expert, activeAssessment] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { id: params.id, isVerified: true },
      include: {
        user: { select: { name: true, image: true, email: true } },
        availabilitySlots: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
        reviews: { orderBy: { createdAt: "desc" }, take: 5 },
      },
    }),
    prisma.assessment.findFirst({
      where: { userId: session.user.id, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!expert) notFound();

  // Match score for premium users
  let matchScore: number | undefined;
  let matchReasons: string[] = [];
  if (session.user.isPremium && activeAssessment) {
    const ms = await prisma.matchScore.findUnique({
      where: { assessmentId_expertId: { assessmentId: activeAssessment.id, expertId: expert.id } },
    });
    if (ms) {
      matchScore = ms.score;
      matchReasons = ms.reasons;
    }
  }

  const locationLabel =
    expert.locationType === "ONLINE"
      ? "Online"
      : expert.locationType === "OFFLINE"
      ? expert.city ?? "Offline"
      : `Online & ${expert.city ?? "Offline"}`;

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Link
        href="/cari-pakar"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Cari Pakar
      </Link>

      {/* Hero card */}
      <div className="bg-white rounded-2xl border border-sand-200 p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex-shrink-0">
            <Avatar className="w-20 h-20 ring-2 ring-sand-200">
              <AvatarImage
                src={expert.profilePhotoUrl ?? expert.user.image ?? undefined}
                alt={expert.user.name ?? ""}
              />
              <AvatarFallback className="bg-forest-100 text-forest-500 text-2xl font-bold">
                {getInitials(expert.user.name ?? "E")}
              </AvatarFallback>
            </Avatar>
            {expert.isVerified && (
              <div className="absolute -bottom-0.5 -right-0.5 w-6 h-6 rounded-full bg-teal-dark border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">✓</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <h1 className="text-xl font-serif font-bold text-forest-500">
                  {expert.user.name}
                </h1>
                <p className="text-sm text-sand-500 mt-0.5">
                  {expert.yearsExperience} tahun pengalaman &middot; {locationLabel}
                </p>
              </div>
              {session.user.isPremium && matchScore !== undefined && (
                <MatchBadge score={matchScore} />
              )}
            </div>

            <div className="flex items-center gap-1.5 mt-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-sm font-semibold text-forest-500">
                {expert.rating.toFixed(1)}
              </span>
              <span className="text-xs text-sand-400">
                ({expert.totalReviews} ulasan)
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 mt-3">
              {expert.specializations.map((spec) => (
                <Badge
                  key={spec}
                  variant="secondary"
                  className="text-xs bg-sand-100 text-sand-700 border-sand-200"
                >
                  {SPECIALIZATION_LABELS[spec] ?? spec}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Price + CTA */}
        <div className="mt-5 pt-4 border-t border-sand-100 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs text-sand-500">Tarif per sesi</p>
            <p className="text-lg font-bold text-forest-500">
              {formatCurrency(expert.hourlyRate)}
              <span className="text-sm font-normal text-sand-400">/jam</span>
            </p>
          </div>
          {session.user.role === "PARENT" && !activeAssessment ? (
            <div className="flex flex-col items-end gap-1">
              <Button
                asChild
                className="bg-amber-500 hover:bg-amber-600 text-white gap-2"
              >
                <Link href="/profil?tab=asesmen">
                  <ClipboardList className="w-4 h-4" />
                  Isi Asesmen Dulu
                </Link>
              </Button>
              <p className="text-xs text-sand-400">Diperlukan sebelum konsultasi</p>
            </div>
          ) : (
            <Button
              asChild
              className="bg-forest-500 hover:bg-forest-600 text-white gap-2"
            >
              <Link href={`/cari-pakar/${expert.id}/booking`}>
                <MessageCircle className="w-4 h-4" />
                Mulai Konsultasi
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* Match reasons (premium) */}
      {session.user.isPremium && matchReasons.length > 0 && (
        <div className="bg-teal-dark/5 border border-teal-dark/20 rounded-2xl p-4">
          <p className="text-sm font-semibold text-teal-dark mb-2">
            Mengapa cocok dengan kebutuhan Anda
          </p>
          <ul className="space-y-1">
            {matchReasons.map((r, i) => (
              <li key={i} className="text-sm text-sand-600 flex gap-2">
                <span className="text-teal-dark mt-0.5">✓</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bio */}
      {expert.bio && (
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h2 className="font-semibold text-forest-500 mb-2">Tentang Pakar</h2>
          <p className="text-sm text-sand-600 leading-relaxed whitespace-pre-line">
            {expert.bio}
          </p>
        </div>
      )}

      {/* Education & Certifications */}
      {(expert.education || expert.certifications.length > 0) && (
        <div className="bg-white rounded-2xl border border-sand-200 p-5 space-y-4">
          {expert.education && (
            <div className="flex gap-3">
              <GraduationCap className="w-5 h-5 text-teal-dark mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-forest-500">Pendidikan</p>
                <p className="text-sm text-sand-600 mt-0.5">{expert.education}</p>
              </div>
            </div>
          )}
          {expert.certifications.length > 0 && (
            <div className="flex gap-3">
              <Award className="w-5 h-5 text-teal-dark mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-forest-500">Sertifikasi</p>
                <ul className="mt-1 space-y-0.5">
                  {expert.certifications.map((cert, i) => (
                    <li key={i} className="text-sm text-sand-600">
                      {cert}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Availability */}
      {expert.availabilitySlots.length > 0 && (
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-teal-dark" />
            <h2 className="font-semibold text-forest-500">Jadwal Tersedia</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {expert.availabilitySlots.map((slot) => (
              <div
                key={slot.id}
                className="text-xs bg-sand-50 border border-sand-200 rounded-lg px-3 py-1.5 text-sand-600"
              >
                <span className="font-medium text-forest-500">
                  {DAY_LABELS[slot.dayOfWeek]}
                </span>{" "}
                {slot.startTime}–{slot.endTime}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      {expert.reviews.length > 0 && (
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            <h2 className="font-semibold text-forest-500">
              Ulasan ({expert.totalReviews})
            </h2>
          </div>
          <div className="space-y-4">
            {expert.reviews.map((review) => (
              <div
                key={review.id}
                className="border-b border-sand-100 last:border-0 pb-4 last:pb-0"
              >
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < review.rating
                          ? "text-amber-400 fill-amber-400"
                          : "text-sand-200"
                      }`}
                    />
                  ))}
                  <span className="text-xs text-sand-400 ml-1">
                    {new Date(review.createdAt).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                    })}
                  </span>
                </div>
                {review.comment && (
                  <p className="text-sm text-sand-600">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
