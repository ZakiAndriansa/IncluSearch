import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/shared/hero-section";
import { FeaturedExperts } from "@/components/experts/featured-experts";
import { QuickStats } from "@/components/shared/quick-stats";
import { RecentContent } from "@/components/knowledge/recent-content";
import { AssessmentCTA } from "@/components/assessment/assessment-cta";
import { QuotaStatusCard } from "@/components/consultation/quota-status-card";
import { ExpertCardSkeleton } from "@/components/experts/expert-card-skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { CalendarDays, Star, Users, MessageCircle, BookOpen, ArrowRight, Clock } from "lucide-react";
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
  const in7days = new Date(today);
  in7days.setDate(in7days.getDate() + 7);

  const [expertCount, contentCount, communityCount, userAssessment, upcomingConsultations] = await Promise.all([
    prisma.expertProfile.count({ where: { isVerified: true, isAvailable: true } }),
    prisma.knowledgeContent.count({ where: { publishedAt: { not: null } } }),
    prisma.community.count({ where: { isActive: true } }),
    prisma.assessment.findFirst({
      where: { userId, isActive: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.consultation.findMany({
      where: {
        parentId: userId,
        scheduledAt: { gte: today, lt: in7days },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMins: true,
        expert: { include: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8">
      <QuickStats expertCount={expertCount} contentCount={contentCount} communityCount={communityCount} />

      {/* Upcoming consultations */}
      {upcomingConsultations.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xl font-serif font-semibold text-forest-500">Konsultasi Mendatang</h2>
            <Link href="/konsultasi" className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors">
              Lihat semua →
            </Link>
          </div>
          <div className="space-y-2">
            {upcomingConsultations.map((c) => {
              const isToday = c.scheduledAt >= today && c.scheduledAt < new Date(today.getTime() + 86400000);
              return (
                <Link
                  key={c.id}
                  href={`/konsultasi/${c.id}`}
                  className="flex items-center gap-4 bg-white border border-sand-200 hover:border-teal-dark/30 hover:shadow-sm transition-all rounded-2xl p-4"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isToday ? "bg-forest-500" : "bg-forest-50"}`}>
                    <CalendarDays className={`w-5 h-5 ${isToday ? "text-white" : "text-forest-500"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-forest-500 text-sm">
                      {c.expert.user.name}
                    </div>
                    <div className="text-xs text-sand-400 mt-0.5">
                      {formatDateTime(c.scheduledAt)} · {c.durationMins} menit
                    </div>
                  </div>
                  {isToday && (
                    <span className="text-xs bg-forest-500 text-white px-2.5 py-1 rounded-full font-medium flex-shrink-0">
                      Hari ini
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-sand-300 flex-shrink-0" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <AssessmentCTA
          hasAssessment={!!userAssessment}
          assessmentId={userAssessment?.id}
          childName={userAssessment?.childName}
        />
        <QuotaStatusCard userId={userId} isPremium={isPremium} />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">Pakar Unggulan</h2>
          <Link href="/cari-pakar" className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors">
            Lihat semua →
          </Link>
        </div>
        <Suspense fallback={
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <ExpertCardSkeleton key={i} />)}
          </div>
        }>
          <FeaturedExperts isPremium={isPremium} assessmentId={userAssessment?.id} />
        </Suspense>
      </section>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-serif font-semibold text-forest-500">Konten Terbaru</h2>
          <Link href="/knowledge-hub" className="text-sm text-teal-dark hover:text-olive-500 font-medium transition-colors">
            Knowledge Hub →
          </Link>
        </div>
        <Suspense fallback={<div className="skeleton h-40 w-full" />}>
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
        <ParentDashboard userId={session.user.id} isPremium={session.user.isPremium} />
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
