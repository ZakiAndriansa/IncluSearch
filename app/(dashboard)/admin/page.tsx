import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import {
  Users,
  BookOpen,
  Building2,
  MessageCircle,
  TrendingUp,
  Shield,
} from "lucide-react";
import type { Metadata } from "next";

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
        <h1 className="text-2xl font-serif font-bold text-forest-500">
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
              className="px-5 py-3 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-forest-500">
                  {user.name ?? "-"}
                </div>
                <div className="text-xs text-sand-400">{user.email}</div>
              </div>
              <div className="flex items-center gap-2 text-xs">
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
                <span className="text-sand-400">
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
