import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateExpertProfile } from "@/lib/expert";
import { ExpertProfileForm } from "@/components/pakar/expert-profile-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Profil & Jadwal Pakar" };

export default async function ExpertProfilePage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "EXPERT") redirect("/profil");

  const profile = await getOrCreateExpertProfile(session.user.id);
  const slots = await prisma.availabilitySlot.findMany({
    where: { expertId: profile.id },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
    select: { dayOfWeek: true, startTime: true, endTime: true },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Profil &amp; Jadwal
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Kelola informasi profil dan jadwal ketersediaan konsultasi Anda.
        </p>
      </div>

      <ExpertProfileForm
        profile={{
          bio: profile.bio,
          hourlyRate: profile.hourlyRate,
          yearsExperience: profile.yearsExperience,
          education: profile.education,
          city: profile.city,
          province: profile.province,
          locationType: profile.locationType,
          specializations: profile.specializations,
          isVerified: profile.isVerified,
        }}
        slots={slots}
      />
    </div>
  );
}
