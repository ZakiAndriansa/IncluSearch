"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageCircle,
  Users2,
  CalendarDays,
  Star,
  Shield,
  Wallet,
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
  { href: "/cari-pakar", label: "Pakar", icon: Users },
  { href: "/konsultasi", label: "Konsultasi", icon: MessageCircle },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/knowledge-hub", label: "Ilmu", icon: BookOpen },
];

const EXPERT_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/konsultasi", label: "Konsul", icon: MessageCircle },
  { href: "/pakar/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/pakar/profil", label: "Profil", icon: Star },
  { href: "/knowledge-hub", label: "Ilmu", icon: BookOpen },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/admin", label: "Admin", icon: Shield, exact: true },
  { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/admin/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/knowledge-hub", label: "Ilmu", icon: BookOpen },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  PARENT: PARENT_NAV,
  EXPERT: EXPERT_NAV,
  ADMIN: ADMIN_NAV,
};

interface BottomNavProps {
  role: UserRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = NAV_BY_ROLE[role] ?? PARENT_NAV;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-sand-200 bg-white/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all tap-target min-w-[56px]",
                active ? "text-forest-500" : "text-sand-400 hover:text-sand-600"
              )}
            >
              <item.icon
                className={cn("w-5 h-5 transition-transform", active && "scale-110")}
              />
              <span
                className={cn(
                  "text-[10px] font-medium leading-none",
                  active ? "text-forest-500" : "text-sand-400"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-forest-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
