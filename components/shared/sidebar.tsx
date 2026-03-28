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
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { UserRole } from "@prisma/client";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Beranda",
    icon: LayoutDashboard,
    exact: true,
  },
  { href: "/cari-pakar", label: "Cari Pakar", icon: Users },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/konsultasi", label: "Konsultasi", icon: MessageCircle },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
  { href: "/profil", label: "Profil Saya", icon: User },
];

interface SidebarProps {
  user: {
    role: UserRole;
    isPremium: boolean;
    name?: string | null;
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 border-r border-sand-200 bg-white hidden lg:flex flex-col z-30">
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
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
                isActive(item.href, item.exact)
                  ? "text-white"
                  : "text-sand-500"
              )}
            />
            {item.label}
          </Link>
        ))}

        {user.role === "ADMIN" && (
          <Link
            href="/admin"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all mt-2",
              isActive("/admin")
                ? "bg-forest-500 text-white"
                : "text-sand-700 hover:bg-sand-100 hover:text-forest-500"
            )}
          >
            <Shield className="w-5 h-5 flex-shrink-0 text-sand-500" />
            Panel Admin
          </Link>
        )}
      </nav>

      {/* Premium upgrade CTA for free users */}
      {!user.isPremium && (
        <div className="p-4 border-t border-sand-200">
          <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">
                Upgrade Premium
              </span>
            </div>
            <p className="text-xs text-amber-600 mb-3 leading-relaxed">
              Akses pakar lebih banyak, konten video eksklusif & konsultasi
              tanpa batas.
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
    </aside>
  );
}
