import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Navbar } from "@/components/shared/navbar";
import { BottomNav } from "@/components/shared/bottom-nav";
import { Sidebar } from "@/components/shared/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  // Always read isPremium from DB — JWT can be stale after webhook updates
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  const isPremium =
    dbUser?.isPremium === true &&
    (!dbUser.premiumExpiresAt || dbUser.premiumExpiresAt > new Date());

  const user = {
    ...session.user,
    isPremium,
    premiumExpiresAt: dbUser?.premiumExpiresAt ?? null,
  };

  return (
    <div className="min-h-screen bg-sand-50">
      {/* Top navbar — desktop */}
      <Navbar user={user} />

      <div className="flex">
        {/* Sidebar — desktop only */}
        <Sidebar user={user} />

        {/* Main content */}
        <main className="flex-1 lg:ml-64 min-h-[calc(100vh-3.5rem)] pb-20 lg:pb-6">
          <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6">
            {children}
          </div>
        </main>
      </div>

      {/* Bottom nav — mobile only */}
      <BottomNav role={session.user.role} />
    </div>
  );
}
