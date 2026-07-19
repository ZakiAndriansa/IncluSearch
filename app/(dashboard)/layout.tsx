import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/shared/dashboard-shell";

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
    <DashboardShell user={user} role={session.user.role}>
      {children}
    </DashboardShell>
  );
}
