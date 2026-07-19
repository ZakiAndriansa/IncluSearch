"use client";

import { cn } from "@/lib/utils";
import { Navbar } from "@/components/shared/navbar";
import { Sidebar } from "@/components/shared/sidebar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { NavSettingsProvider, useNavSettings } from "@/components/shared/nav-settings";
import type { UserRole } from "@prisma/client";

type ShellUser = {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: UserRole;
  isPremium: boolean;
  premiumExpiresAt?: Date | null;
};

export function DashboardShell({
  user,
  role,
  children,
}: {
  user: ShellUser;
  role: UserRole;
  children: React.ReactNode;
}) {
  return (
    <NavSettingsProvider>
      <ShellInner user={user} role={role}>
        {children}
      </ShellInner>
    </NavSettingsProvider>
  );
}

function ShellInner({
  user,
  role,
  children,
}: {
  user: ShellUser;
  role: UserRole;
  children: React.ReactNode;
}) {
  const { collapsed } = useNavSettings();

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar user={user} />
      <div className="flex">
        <Sidebar user={user} />
        <main
          className={cn(
            "flex-1 min-h-[calc(100vh-3.5rem)] pb-20 lg:pb-6 transition-all duration-200",
            collapsed ? "lg:ml-16" : "lg:ml-64"
          )}
        >
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">{children}</div>
        </main>
      </div>
      <BottomNav role={role} />
    </div>
  );
}
