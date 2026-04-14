"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageCircle,
  CalendarDays,
  Shield,
  Bot,
  Sparkles,
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
  { href: "/ai-assistant", label: "Pendamping", icon: Sparkles },
  { href: "/cari-pakar", label: "Pakar", icon: Users },
  { href: "/konsultasi", label: "Konsultasi", icon: MessageCircle },
  { href: "/knowledge-hub", label: "Ilmu", icon: BookOpen },
];

const EXPERT_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/konsultasi", label: "Jadwal", icon: CalendarDays },
  { href: "/knowledge-hub", label: "Ilmu", icon: BookOpen },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/admin", label: "Admin", icon: Shield },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-sand-200/60 bg-white/98 backdrop-blur-lg pb-safe">
      <div className="flex items-center justify-around px-1 pt-1.5 pb-0.5">
        {navItems.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all min-w-[52px]",
                active ? "text-forest-500" : "text-sand-400"
              )}
            >
              <item.icon
                className={cn("w-5 h-5 transition-all", active && "text-forest-500")}
                strokeWidth={active ? 2.2 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] leading-none mt-0.5",
                  active ? "text-forest-500 font-semibold" : "text-sand-400 font-medium"
                )}
              >
                {item.label}
              </span>
              {active && (
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-forest-500" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
