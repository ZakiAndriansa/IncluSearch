"use client";

import { useEffect } from "react";
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
  Star,
  ClipboardList,
  Wallet,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn, formatDate } from "@/lib/utils";
import { NAV_THEMES, NAV_THEME_LIST } from "@/lib/nav-themes";
import { useNavSettings } from "@/components/shared/nav-settings";
import type { UserRole } from "@prisma/client";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  children?: NavItem[];
}

const PARENT_NAV: NavItem[] = [
  { href: "/beranda", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/cari-pakar", label: "Cari Pakar", icon: Users },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/konsultasi", label: "Konsultasi Saya", icon: MessageCircle },
  { href: "/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
];

const EXPERT_NAV: NavItem[] = [
  { href: "/beranda", label: "Beranda", icon: LayoutDashboard, exact: true },
  { href: "/konsultasi", label: "Jadwal Konsultasi", icon: MessageCircle },
  { href: "/pakar/asesmen", label: "Asesmen Klien", icon: ClipboardList },
  { href: "/pakar/kalender", label: "Kalender & Gaji", icon: CalendarDays },
  { href: "/pakar/profil", label: "Profil & Jadwal", icon: Star },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
  { href: "/forum", label: "Forum Komunitas", icon: Users2 },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/beranda", label: "Beranda", icon: LayoutDashboard, exact: true },
  {
    href: "/admin",
    label: "Panel Admin",
    icon: Shield,
    exact: true,
    children: [
      { href: "/admin/pakar", label: "Pakar", icon: Users },
      { href: "/admin/orang-tua", label: "Orang Tua", icon: Users2 },
    ],
  },
  { href: "/admin/keuangan", label: "Keuangan", icon: Wallet },
  { href: "/admin/kalender", label: "Kalender", icon: CalendarDays },
  { href: "/admin/asesmen", label: "Asesmen", icon: ClipboardList },
  { href: "/admin/forum", label: "Forum", icon: Users2 },
  { href: "/knowledge-hub", label: "Knowledge Hub", icon: BookOpen },
];

const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  PARENT: PARENT_NAV,
  EXPERT: EXPERT_NAV,
  ADMIN: ADMIN_NAV,
};

const ROLE_LABEL: Record<UserRole, string> = {
  PARENT: "Orang Tua / Guru",
  EXPERT: "Pakar",
  ADMIN: "Administrator",
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
  const { theme, setTheme, collapsed, toggleCollapsed, mobileOpen, setMobileOpen } =
    useNavSettings();
  const th = NAV_THEMES[theme];
  const navItems = NAV_BY_ROLE[user.role] ?? PARENT_NAV;

  const isActive = (href: string, exact = false) =>
    exact ? pathname === href : pathname.startsWith(href);

  // Close the mobile drawer when the route changes.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Backdrop (mobile only) */}
      <div
        onClick={closeMobile}
        className={cn(
          "lg:hidden fixed inset-x-0 top-14 bottom-0 bg-black/40 z-50 transition-opacity duration-200",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      />

      <aside
        className={cn(
          "fixed left-0 top-14 bottom-0 z-50 flex flex-col border-r transition-all duration-200 w-64",
          collapsed ? "lg:w-16" : "lg:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
          th.panel
        )}
      >
        {/* Header: role badge + toggles */}
        <div className="flex items-center justify-between px-3 pt-4 pb-2">
          <div
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest px-2 py-1 rounded-md w-fit",
              th.accentBg,
              th.accentText,
              collapsed && "lg:hidden"
            )}
          >
            {ROLE_LABEL[user.role]}
          </div>
          <div className="flex items-center gap-1">
            {/* Mobile: close drawer */}
            <button
              onClick={closeMobile}
              aria-label="Tutup menu"
              className={cn("lg:hidden rounded-lg p-1.5 transition-colors hover:bg-white/10", th.navIcon)}
            >
              <X className="w-5 h-5" />
            </button>
            {/* Desktop: collapse rail */}
            <button
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Perbesar menu" : "Perkecil menu"}
              className={cn(
                "hidden lg:inline-flex rounded-lg p-1.5 transition-colors hover:bg-white/10",
                th.navIcon
              )}
            >
              {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <div key={item.href} className="space-y-1">
                <Link
                  href={item.href}
                  onClick={closeMobile}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all tap-target border-2 border-transparent",
                    collapsed && "lg:justify-center",
                    active ? th.active : cn(th.navText, th.navHover)
                  )}
                >
                  <item.icon
                    className={cn("w-5 h-5 flex-shrink-0", active ? th.activeIcon : th.navIcon)}
                  />
                  <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
                </Link>

                {/* Sub-menu (hidden on collapsed rail) */}
                {item.children && !collapsed && (
                  <div className={cn("ml-4 pl-3 border-l space-y-1", th.divider)}>
                    {item.children.map((child) => {
                      const cActive = isActive(child.href, child.exact);
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={closeMobile}
                          className={cn(
                            "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all border-2 border-transparent",
                            cActive ? th.active : cn(th.navText, th.navHover)
                          )}
                        >
                          <child.icon
                            className={cn("w-4 h-4 flex-shrink-0", cActive ? th.activeIcon : th.navIcon)}
                          />
                          {child.label}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Theme picker */}
        <div className={cn("py-3 border-t px-4", th.divider, collapsed && "lg:px-2")}>
          <div
            className={cn(
              "text-[10px] font-semibold uppercase tracking-widest mb-2",
              th.navText,
              collapsed && "lg:hidden"
            )}
          >
            Tema
          </div>
          <div className={cn("flex flex-wrap gap-1.5", collapsed && "lg:justify-center")}>
            {NAV_THEME_LIST.map((t) => (
              <button
                key={t.key}
                onClick={() => setTheme(t.key)}
                title={t.label}
                aria-label={`Tema ${t.label}`}
                className={cn(
                  "w-6 h-6 rounded-full border border-black/10 transition-transform",
                  t.swatch,
                  theme === t.key
                    ? "border-2 border-forest-600 ring-2 ring-white scale-110"
                    : "hover:scale-105"
                )}
              />
            ))}
          </div>
        </div>

        {/* Footer: parent premium (hidden on collapsed desktop, shown on mobile) */}
        {user.role === "PARENT" && (
          <div className={cn("p-4 border-t", th.divider, collapsed && "lg:hidden")}>
            {user.isPremium ? (
              <div className="rounded-xl bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700">Anggota Premium</span>
                </div>
                <p className="text-xs text-amber-600 leading-relaxed mb-2">
                  Anda menikmati akses penuh: konsultasi tanpa batas, konten eksklusif & hingga 3 asesmen aktif.
                </p>
                {user.premiumExpiresAt && (
                  <div className="flex items-center gap-1.5 pt-2 border-t border-amber-200">
                    <CalendarDays className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                    <span className="text-[11px] text-amber-600">
                      Aktif hingga{" "}
                      <span className="font-semibold">{formatDate(user.premiumExpiresAt)}</span>
                    </span>
                  </div>
                )}
              </div>
            ) : (
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
                  onClick={closeMobile}
                  className="block w-full text-center text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white py-2 rounded-lg transition-colors"
                >
                  Lihat Paket Premium
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Footer: expert statistik (collapses to an icon on desktop) */}
        {user.role === "EXPERT" && (
          <div className={cn("border-t p-4", th.divider, collapsed && "lg:px-2 lg:py-3")}>
            <Link
              href="/pakar/kalender"
              onClick={closeMobile}
              title="Lihat statistik konsultasi"
              className={cn(
                "rounded-xl border border-transparent p-3 flex items-center gap-2",
                th.accentBg,
                collapsed && "lg:justify-center lg:p-2"
              )}
            >
              <BarChart3 className={cn("w-4 h-4 flex-shrink-0", th.accentText)} />
              <span className={cn("text-xs font-medium hover:underline", th.accentText, collapsed && "lg:hidden")}>
                Lihat statistik konsultasi
              </span>
            </Link>
          </div>
        )}
      </aside>
    </>
  );
}
