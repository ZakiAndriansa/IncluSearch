"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  Users2,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

const BOTTOM_NAV_ITEMS = [
  { href: "/", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/cari-pakar", label: "Cari Pakar", icon: Users },
  { href: "/knowledge-hub", label: "Pengetahuan", icon: BookOpen },
  { href: "/forum", label: "Forum", icon: Users2 },
  { href: "/profil", label: "Profil", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-sand-200 bg-white/95 backdrop-blur-md pb-safe">
      <div className="flex items-center justify-around px-2 pt-2 pb-1">
        {BOTTOM_NAV_ITEMS.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all tap-target min-w-[56px]",
                active
                  ? "text-forest-500"
                  : "text-sand-400 hover:text-sand-600"
              )}
            >
              <item.icon
                className={cn(
                  "w-5 h-5 transition-transform",
                  active && "scale-110"
                )}
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
