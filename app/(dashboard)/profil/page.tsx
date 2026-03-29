import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileTabs } from "@/components/shared/profile-tabs";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profil Saya" };

export default async function ProfilPage({
  searchParams,
}: {
  searchParams: { tab?: string; status?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [user, assessments, quota] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        bio: true,
        role: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
      },
    }),
    prisma.assessment.findMany({
      where: { userId: session.user.id },
      orderBy: [{ isActive: "desc" }, { createdAt: "desc" }],
    }),
    prisma.consultationQuota.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  if (!user) redirect("/login");

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif font-bold text-forest-500">
          Profil Saya
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Kelola akun, asesmen, dan langganan Anda
        </p>
      </div>

      <ProfileTabs
        user={user}
        assessments={assessments}
        quota={quota}
        activeTab={searchParams.tab ?? "profil"}
        paymentStatus={searchParams.status}
      />
    </div>
  );
}
