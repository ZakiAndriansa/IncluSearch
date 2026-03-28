"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageCircle,
  Users2,
  User,
  Crown,
  Shield,
  CalendarDays,
  BarChart3,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/konsultasi", label: "Konsultasi Saya", icon: MessageCircle },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
  { href: "/profil", label: "Profil Saya", icon: User },
];

const EXPERT_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/konsultasi", label: "Jadwal Konsultasi", icon: CalendarDays },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
  { href: "/profil", label: "Profil Pakar", icon: Star },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/admin", label: "Panel Admin", icon: Shield },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/profil", label: "Profil", icon: User },
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
    name?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[user.role] ?? PARENT_NAV;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-sand-200 bg-white hidden lg:flex flex-col z-30">
      {/* Role badge */}
      <div className="px-4 pt-4 pb-2">
        <div className={cn(
          "text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-md w-fit",
          user.role === "EXPERT" && "bg-teal-dark/10 text-teal-dark",
          user.role === "ADMIN" && "bg-red-50 text-red-500",
          user.role === "PARENT" && "bg-forest-50 text-forest-500",
        )}>
          {user.role === "PARENT" && "Orang Tua / Guru"}
          {user.role === "EXPERT" && "Pakar"}
          {user.role === "ADMIN" && "Administrator"}
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all tap-target",
              isActive(item.href, item.exact)
                ? "bg-forest-500 text-white shadow-sm"
                : "text-sand-700 hover:bg-sand-100 hover:text-forest-500"
            )}
          >
            <item.icon
              className={cn(
                "w-5 h-5 flex-shrink-0",
                isActive(item.href, item.exact) ? "text-white" : "text-sand-500"
              )}
            />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Footer CTA per role */}
      {user.role === "PARENT" && !user.isPremium && (
        <div className="p-4 border-t border-sand-200">
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">Upgrade Premium</span>
            </div>
            <p className="text-xs text-amber-600 mb-3 leading-relaxed">
              Akses pakar lebih banyak, konten eksklusif & konsultasi tanpa batas.
            </p>
            <Link
              href="/profil?tab=premium"
              className="block w-full text-center text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors"
            >
              Lihat Paket Premium
            </Link>
          </div>
        </div>
      )}

      {user.role === "EXPERT" && (
        <div className="p-4 border-t border-sand-200">
          <div className="rounded-xl bg-teal-dark/5 border border-teal-dark/20 p-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-teal-dark flex-shrink-0" />
            <Link
              href="/profil?tab=statistik"
              className="text-xs text-teal-dark font-medium hover:underline"
            >
              Lihat statistik konsultasi
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
