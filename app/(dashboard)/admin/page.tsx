import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate, getInitials } from "@/lib/utils";
import {
  Users,
  BookOpen,
  Building2,
  MessageCircle,
  TrendingUp,
  Shield,
  BadgeCheck,
  Wallet,
  CalendarDays,
  ClipboardList,
  PenLine,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { VerifyExpertButton } from "@/components/admin/verify-expert-button";
import type { Metadata } from "next";

const ADMIN_LINKS = [
  { href: "/admin/keuangan", label: "Keuangan", desc: "Laba & potongan pakar", icon: Wallet },
  { href: "/admin/kalender", label: "Kalender Booking", desc: "Semua sesi & status pakar", icon: CalendarDays },
  { href: "/admin/asesmen", label: "Database Asesmen", desc: "Asesmen awal & pakar", icon: ClipboardList },
  { href: "/admin/pakar", label: "Akun Pakar", desc: "Kelola & verifikasi", icon: Users },
  { href: "/knowledge-hub/tulis", label: "Tulis Artikel", desc: "Input Knowledge Hub", icon: PenLine },
];

export const metadata: Metadata = { title: "Panel Admin" };

export default async function AdminPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const [
    totalUsers,
    premiumUsers,
    totalExperts,
    totalConsultations,
    totalContent,
    totalCommunities,
    recentUsers,
    experts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { isPremium: true } }),
    prisma.expertProfile.count({ where: { isVerified: true } }),
    prisma.consultation.count(),
    prisma.knowledgeContent.count(),
    prisma.community.count({ where: { isActive: true } }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isPremium: true,
        createdAt: true,
      },
    }),
    prisma.expertProfile.findMany({
      orderBy: [{ isVerified: "asc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        isVerified: true,
        city: true,
        user: { select: { name: true, email: true } },
      },
    }),
  ]);

  const stats = [
    {
      label: "Total Pengguna",
      value: totalUsers,
      icon: Users,
      color: "text-forest-500",
      bg: "bg-forest-50",
    },
    {
      label: "Pengguna Premium",
      value: premiumUsers,
      icon: TrendingUp,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
    {
      label: "Pakar Terverifikasi",
      value: totalExperts,
      icon: Shield,
      color: "text-teal-dark",
      bg: "bg-teal-dark/5",
    },
    {
      label: "Total Konsultasi",
      value: totalConsultations,
      icon: MessageCircle,
      color: "text-olive-500",
      bg: "bg-olive-50",
    },
    {
      label: "Konten Knowledge Hub",
      value: totalContent,
      icon: BookOpen,
      color: "text-teal-dark",
      bg: "bg-teal-dark/5",
    },
    {
      label: "Komunitas Aktif",
      value: totalCommunities,
      icon: Building2,
      color: "text-forest-500",
      bg: "bg-forest-50",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Panel Admin
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Ringkasan platform IncluSearch
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-3"
          >
            <div
              className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center flex-shrink-0`}
            >
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value.toLocaleString("id-ID")}
              </div>
              <div className="text-xs text-sand-500 mt-0.5">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {ADMIN_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className="bg-white rounded-2xl border border-sand-200 hover:border-forest-300 transition-colors p-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center flex-shrink-0">
              <l.icon className="w-5 h-5 text-forest-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-forest-500">{l.label}</div>
              <div className="text-xs text-sand-400">{l.desc}</div>
            </div>
            <ChevronRight className="w-4 h-4 text-sand-300 flex-shrink-0" />
          </Link>
        ))}
      </div>

      {/* Expert verification */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100 flex items-center gap-2">
          <BadgeCheck className="w-4 h-4 text-teal-dark" />
          <h2 className="font-semibold text-forest-500">Verifikasi Pakar</h2>
        </div>
        {experts.length === 0 ? (
          <p className="px-5 py-6 text-sm text-sand-400">Belum ada profil pakar.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {experts.map((e) => (
              <div
                key={e.id}
                className="px-5 py-3 flex flex-wrap items-center justify-between gap-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-forest-100 flex items-center justify-center text-forest-500 text-sm font-semibold flex-shrink-0">
                    {getInitials(e.user.name ?? "P")}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-forest-500 truncate">
                      {e.user.name ?? "-"}
                      {e.city ? <span className="text-sand-400 font-normal"> · {e.city}</span> : null}
                    </div>
                    <div className="text-xs text-sand-400 truncate">{e.user.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
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
            ))}
          </div>
        )}
      </div>

      {/* Recent users */}
      <div className="bg-white rounded-2xl border border-sand-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-sand-100">
          <h2 className="font-semibold text-forest-500">
            Pengguna Terbaru
          </h2>
        </div>
        <div className="divide-y divide-sand-100">
          {recentUsers.map((user) => (
            <div
              key={user.id}
              className="px-5 py-3 flex flex-wrap items-start sm:items-center justify-between gap-2"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium text-forest-500 truncate">
                  {user.name ?? "-"}
                </div>
                <div className="text-xs text-sand-400 truncate">{user.email}</div>
              </div>
              <div className="flex items-center gap-2 text-xs flex-shrink-0">
                <span
                  className={`px-2 py-0.5 rounded-full border ${
                    user.role === "EXPERT"
                      ? "bg-teal-dark/5 text-teal-dark border-teal-dark/20"
                      : user.role === "ADMIN"
                      ? "bg-forest-50 text-forest-500 border-forest-100"
                      : "bg-sand-100 text-sand-600 border-sand-200"
                  }`}
                >
                  {user.role}
                </span>
                {user.isPremium && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 border border-amber-200">
                    Premium
                  </span>
                )}
                <span className="text-sand-400 hidden sm:inline">
                  {formatDate(user.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
