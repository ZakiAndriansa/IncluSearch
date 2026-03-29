import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { FeaturedExperts } from "@/components/experts/featured-experts";
import { RecentContent } from "@/components/knowledge/recent-content";
import { ExpertCardSkeleton } from "@/components/experts/expert-card-skeleton";
import { checkConsultationQuota } from "@/lib/quota-checker";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CalendarDays, Star, Users, MessageCircle,
  ArrowRight, Clock, ClipboardList, CheckCircle2,
  Crown, AlertCircle,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

// ─────────────────────────────────────────────
// PARENT DASHBOARD
// ─────────────────────────────────────────────
async function ParentDashboard({ userId, isPremium }: { userId: string; isPremium: boolean }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today.getTime() + 86400000);

  const [userAssessment, nextConsultation, quota] = await Promise.all([
    prisma.assessment.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.findFirst({
      where: {
        parentId: userId,
        scheduledAt: { gte: today },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMins: true,
        status: true,
        expert: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    checkConsultationQuota(userId),
  ]);

  const isToday = nextConsultation
    ? nextConsultation.scheduledAt >= today && nextConsultation.scheduledAt < tomorrow
    : false;

  return (
    <div className="space-y-6">

      {/* ── Compact status strip ── */}
      <div className="flex flex-wrap gap-2">

        {/* Assessment status */}
        {userAssessment ? (
          <Link
            href="/profil?tab=asesmen"
            className="flex items-center gap-1.5 text-xs bg-forest-50 border border-forest-100 text-forest-600 rounded-full px-3 py-1.5 hover:bg-forest-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
            Asesmen: <span className="font-semibold">{userAssessment.childName}</span>
          </Link>
        ) : (
          <Link
            href="/profil?tab=asesmen"
            className="flex items-center gap-1.5 text-xs bg-teal-dark/5 border border-teal-dark/20 text-teal-dark rounded-full px-3 py-1.5 hover:bg-teal-dark/10 transition-colors"
          >
            <ClipboardList className="w-3.5 h-3.5" />
            Buat asesmen untuk rekomendasi pakar
          </Link>
        )}

        {/* Quota / premium status */}
        {isPremium ? (
          <span className="flex items-center gap-1.5 text-xs bg-amber-50 border border-amber-200 text-amber-600 rounded-full px-3 py-1.5 font-medium">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            Bebas konsultasi
          </span>
        ) : quota.allowed ? (
          <Link
            href="/cari-pakar"
            className="flex items-center gap-1.5 text-xs bg-forest-50 border border-forest-100 text-forest-600 rounded-full px-3 py-1.5 hover:bg-forest-100 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-forest-500" />
            Bisa konsultasi 1 kali
          </Link>
        ) : (
          <Link
            href="/profil?tab=premium"
            className="flex items-center gap-1.5 text-xs bg-sand-100 border border-sand-200 text-sand-600 rounded-full px-3 py-1.5 hover:bg-sand-200 transition-colors"
          >
            <AlertCircle className="w-3.5 h-3.5" />
            Bisa konsultasi dalam {quota.daysUntilReset ?? "?"} hari
          </Link>
        )}

        {/* Next consultation */}
        {nextConsultation && (
          <Link
            href={`/konsultasi/${nextConsultation.id}`}
            className="flex items-center gap-1.5 text-xs bg-blue-50 border border-blue-100 text-blue-700 rounded-full px-3 py-1.5 hover:bg-blue-100 transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            {isToday ? "Hari ini" : formatDateTime(nextConsultation.scheduledAt).split(",")[0]}
            {" · "}{nextConsultation.expert.user.name}
          </Link>
        )}
      </div>

      {/* ── Expert section (main focus) ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-serif font-semibold text-forest-500">
              {userAssessment
                ? `Pakar untuk ${userAssessment.childName}`
                : "Pakar Tersedia"}
            </h2>
            {userAssessment && (
              <p className="text-xs text-sand-400 mt-0.5">
                Diurutkan berdasarkan kecocokan · hanya yang di atas 50%
              </p>
            )}
          </div>
          <Link
            href="/cari-pakar"
            className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors flex-shrink-0"
          >
            Lihat semua →
          </Link>
        </div>
        <Suspense fallback={
          <div className="grid sm:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
          </div>
        }>
          <FeaturedExperts assessmentId={userAssessment?.id} />
        </Suspense>
      </section>

      {/* ── Recent content (compact) ── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-forest-500">Konten Terbaru</h2>
          <Link href="/knowledge-hub" className="text-xs text-teal-dark hover:text-olive-500 font-medium transition-colors">
            Lihat semua →
          </Link>
        </div>
        <Suspense fallback={<div className="h-24 rounded-xl bg-sand-100 animate-pulse" />}>
          <RecentContent isPremium={isPremium} limit={3} />
        </Suspense>
      </section>

    </div>
  );
}

// ─────────────────────────────────────────────
// EXPERT DASHBOARD
// ─────────────────────────────────────────────
async function ExpertDashboard({ userId }: { userId: string }) {
  const expertProfile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, rating: true, totalReviews: true, hourlyRate: true, isAvailable: true },
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [todayConsultations, upcomingConsultations, totalConsultations] = await Promise.all([
    prisma.consultation.findMany({
      where: {
        expertId: expertProfile?.id,
        scheduledAt: { gte: today, lt: tomorrow },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      include: { parent: { select: { name: true, image: true } } },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.consultation.findMany({
      where: {
        expertId: expertProfile?.id,
        scheduledAt: { gte: tomorrow },
        status: "SCHEDULED",
      },
      include: { parent: { select: { name: true, image: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.consultation.count({
      where: { expertId: expertProfile?.id, status: "COMPLETED" },
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Rating", value: expertProfile?.rating?.toFixed(1) ?? "-", icon: Star, color: "text-amber-500" },
          { label: "Ulasan", value: expertProfile?.totalReviews ?? 0, icon: Users, color: "text-blue-500" },
          { label: "Konsultasi Selesai", value: totalConsultations, icon: MessageCircle, color: "text-forest-500" },
          { label: "Tarif / Jam", value: formatCurrency(expertProfile?.hourlyRate ?? 0), icon: CalendarDays, color: "text-teal-dark" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-sand-200 p-4">
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
            <div className="text-xl font-bold text-forest-500">{stat.value}</div>
            <div className="text-xs text-sand-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Today's consultations */}
      <section>
        <h2 className="text-xl font-serif font-semibold text-forest-500 mb-4">
          Konsultasi Hari Ini
          {todayConsultations.length > 0 && (
            <span className="ml-2 text-sm font-normal text-teal-dark">
              {todayConsultations.length} jadwal
            </span>
          )}
        </h2>
        {todayConsultations.length === 0 ? (
          <div className="bg-white rounded-2xl border border-sand-200 p-8 text-center text-sand-400 text-sm">
            Tidak ada konsultasi hari ini.
          </div>
        ) : (
          <div className="space-y-3">
            {todayConsultations.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-forest-100 flex items-center justify-center text-forest-500 font-bold text-sm">
                    {c.parent.name?.charAt(0) ?? "P"}
                  </div>
                  <div>
                    <div className="font-semibold text-forest-500 text-sm">{c.parent.name}</div>
                    <div className="flex items-center gap-1 text-xs text-sand-400 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {formatDateTime(c.scheduledAt)} · {c.durationMins} menit
                    </div>
                  </div>
                </div>
                {c.chatRoomId && (
                  <Button asChild size="sm" className="bg-forest-500 hover:bg-forest-600 text-white text-xs h-8">
                    <Link href={`/konsultasi/${c.id}`}>
                      Buka Chat <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming */}
      {upcomingConsultations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-serif font-semibold text-forest-500">Jadwal Mendatang</h2>
            <Link href="/konsultasi" className="text-sm text-teal-dark hover:text-olive-500 font-medium">
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingConsultations.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-sand-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <CalendarDays className="w-4 h-4 text-sand-400 flex-shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-forest-500">{c.parent.name}</span>
                    <span className="text-xs text-sand-400 ml-2">{formatDateTime(c.scheduledAt)} · {c.durationMins} mnt</span>
                  </div>
                </div>
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Terjadwal</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Knowledge hub */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">Konten Terbaru</h2>
          <Link href="/knowledge-hub" className="text-sm text-teal-dark hover:text-olive-500 font-medium">
            Knowledge Hub →
          </Link>
        </div>
        <Suspense fallback={<div className="skeleton h-40 w-full" />}>
          <RecentContent isPremium limit={3} />
        </Suspense>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// ADMIN DASHBOARD
// ─────────────────────────────────────────────
async function AdminDashboard() {
  const [userCount, expertCount, consultationCount, pendingExperts, recentConsultations] = await Promise.all([
    prisma.user.count(),
    prisma.expertProfile.count({ where: { isVerified: true } }),
    prisma.consultation.count({ where: { status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] } } }),
    prisma.expertProfile.count({ where: { isVerified: false } }),
    prisma.consultation.findMany({
      where: { status: { in: ["SCHEDULED", "IN_PROGRESS"] } },
      include: {
        parent: { select: { name: true } },
        expert: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
  ]);

  return (
    <div className="space-y-8">
      {/* System stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Pengguna", value: userCount, icon: Users, color: "text-forest-500" },
          { label: "Pakar Terverifikasi", value: expertCount, icon: Star, color: "text-teal-dark" },
          { label: "Total Konsultasi", value: consultationCount, icon: MessageCircle, color: "text-blue-500" },
          { label: "Menunggu Verifikasi", value: pendingExperts, icon: CalendarDays, color: "text-amber-500" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-sand-200 p-4">
            <stat.icon className={`w-5 h-5 mb-2 ${stat.color}`} />
            <div className="text-2xl font-bold text-forest-500">{stat.value}</div>
            <div className="text-xs text-sand-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/admin" className="bg-white rounded-2xl border border-sand-200 hover:border-forest-500/30 hover:shadow-sm transition-all p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-forest-50 flex items-center justify-center">
            <Users className="w-5 h-5 text-forest-500" />
          </div>
          <div>
            <div className="font-semibold text-forest-500">Manajemen Pengguna</div>
            <div className="text-xs text-sand-500">Kelola akun dan role pengguna</div>
          </div>
          <ArrowRight className="w-4 h-4 text-sand-300 ml-auto" />
        </Link>
        <Link href="/admin?tab=experts" className="bg-white rounded-2xl border border-sand-200 hover:border-forest-500/30 hover:shadow-sm transition-all p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-teal-dark/10 flex items-center justify-center">
            <Star className="w-5 h-5 text-teal-dark" />
          </div>
          <div>
            <div className="font-semibold text-forest-500">Verifikasi Pakar</div>
            <div className="text-xs text-sand-500">{pendingExperts} pakar menunggu verifikasi</div>
          </div>
          <ArrowRight className="w-4 h-4 text-sand-300 ml-auto" />
        </Link>
      </div>

      {recentConsultations.length > 0 && (
        <section>
          <h2 className="text-xl font-serif font-semibold text-forest-500 mb-4">Konsultasi Aktif</h2>
          <div className="space-y-2">
            {recentConsultations.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-sand-200 px-4 py-3 flex items-center justify-between gap-3">
                <div className="text-sm">
                  <span className="font-medium text-forest-500">{c.parent.name}</span>
                  <span className="text-sand-400 mx-2">→</span>
                  <span className="text-sand-600">{c.expert.user.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-sand-400">{formatDateTime(c.scheduledAt)}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === "IN_PROGRESS" ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"}`}>
                    {c.status === "IN_PROGRESS" ? "Berlangsung" : "Terjadwal"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">Knowledge Hub</h2>
          <Link href="/knowledge-hub" className="text-sm text-teal-dark hover:text-olive-500 font-medium">
            Kelola konten →
          </Link>
        </div>
        <Suspense fallback={<div className="skeleton h-40 w-full" />}>
          <RecentContent isPremium limit={3} />
        </Suspense>
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────
export default async function DashboardPage() {
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

  const greeting =
    session.user.role === "EXPERT"
      ? `Selamat datang, ${session.user.name?.split(" ")[0] ?? "Pakar"}`
      : session.user.role === "ADMIN"
      ? "Panel Administrator"
      : `Halo, ${session.user.name?.split(" ")[0] ?? ""}`;

  const subtitle =
    session.user.role === "EXPERT"
      ? "Berikut jadwal dan aktivitas konsultasi Anda hari ini."
      : session.user.role === "ADMIN"
      ? "Ringkasan aktivitas platform IncluSearch."
      : "Temukan pakar dan dukungan terbaik untuk anak Anda.";

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif font-bold text-forest-500">{greeting}</h1>
        <p className="text-sand-500 text-sm mt-1">{subtitle}</p>
      </div>

      {session.user.role === "PARENT" && (
        <ParentDashboard userId={session.user.id} isPremium={isPremium} />
      )}
      {session.user.role === "EXPERT" && (
        <ExpertDashboard userId={session.user.id} />
      )}
      {session.user.role === "ADMIN" && (
        <AdminDashboard />
      )}
    </div>
  );
}
