"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageCircle,
  Users2,
  Crown,
  Shield,
  CalendarDays,
  BarChart3,
  Bot,
  Sparkles,
  ClipboardList,
  PenLine,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
}

const PARENT_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/cari-pakar", label: "Cari Pakar", icon: Users },
  { href: "/ai-assistant", label: "Pendamping AI", icon: Sparkles },
  { href: "/jurnal", label: "Jurnal Harian", icon: PenLine },
  { href: "/action-plan", label: "Action Plan", icon: ClipboardList },
  { href: "/konsultasi", label: "Konsultasi Saya", icon: MessageCircle },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
];

const EXPERT_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/konsultasi", label: "Jadwal Konsultasi", icon: CalendarDays },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/admin", label: "Panel Admin", icon: Shield },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  PARENT: PARENT_NAV,
  EXPERT: EXPERT_NAV,
  ADMIN: ADMIN_NAV,
};

interface SidebarProps {
  user: {
    role: UserRole;
    isPremium: boolean;
    premiumExpiresAt?: Date | null;
    name?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[user.role] ?? PARENT_NAV;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-14 bottom-0 w-64 border-r border-sand-200/80 bg-white hidden lg:flex flex-col z-30">
      {/* Role badge */}
      <div className="px-5 pt-5 pb-2">
        <div className={cn(
          "text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md w-fit",
          user.role === "EXPERT" && "bg-teal-dark/8 text-teal-dark",
          user.role === "ADMIN" && "bg-red-50 text-red-500",
          user.role === "PARENT" && "bg-forest-50 text-forest-500",
        )}>
          {user.role === "PARENT" && "Orang Tua / Guru"}
          {user.role === "EXPERT" && "Pakar"}
          {user.role === "ADMIN" && "Administrator"}
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all",
                active
                  ? "bg-forest-500 text-white shadow-sm shadow-forest-500/20"
                  : "text-sand-700 hover:bg-sand-50 hover:text-forest-600"
              )}
            >
              <item.icon
                className={cn(
                  "w-[18px] h-[18px] flex-shrink-0",
                  active ? "text-white" : "text-sand-400"
                )}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer CTA per role */}
      {user.role === "PARENT" && (
        <div className="p-4 border-t border-sand-100">
          {user.isPremium ? (
            <div className="rounded-xl bg-amber-50/80 border border-amber-200/60 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-700">Anggota Premium</span>
              </div>
              <p className="text-[11px] text-amber-600/80 leading-relaxed">
                Akses penuh ke semua fitur premium.
              </p>
              {user.premiumExpiresAt && (
                <div className="flex items-center gap-1.5 pt-2 mt-2 border-t border-amber-200/40">
                  <span className="text-[10px] text-amber-600/70">
                    Aktif hingga <span className="font-semibold">{formatDate(user.premiumExpiresAt)}</span>
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-gradient-to-br from-forest-50 to-teal-dark/5 border border-forest-200/40 p-3.5">
              <div className="flex items-center gap-2 mb-1.5">
                <Crown className="w-4 h-4 text-forest-400" />
                <span className="text-xs font-semibold text-forest-600">Upgrade Premium</span>
              </div>
              <p className="text-[11px] text-forest-500/70 mb-3 leading-relaxed">
                Konsultasi unlimited, AI tanpa batas, export PDF & insight lengkap.
              </p>
              <Link
                href="/profil?tab=premium"
                className="block w-full text-center text-xs font-semibold bg-forest-500 hover:bg-forest-600 text-white py-2 rounded-lg transition-colors"
              >
                Lihat Paket
              </Link>
            </div>
          )}
        </div>
      )}

      {user.role === "EXPERT" && (
        <div className="p-4 border-t border-sand-100">
          <Link
            href="/profil?tab=statistik"
            className="flex items-center gap-2.5 rounded-xl bg-sand-50 border border-sand-200/60 p-3 text-xs text-sand-600 font-medium hover:bg-sand-100 transition-colors"
          >
            <BarChart3 className="w-4 h-4 text-sand-400" />
            Lihat statistik konsultasi
          </Link>
        </div>
      )}
    </aside>
  );
}
