import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ExpertAdminForm } from "@/components/admin/expert-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Pakar" };

export default async function EditExpertPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const profile = await prisma.expertProfile.findUnique({
    where: { id: params.id },
    select: {
      bio: true,
      hourlyRate: true,
      yearsExperience: true,
      education: true,
      city: true,
      province: true,
      locationType: true,
      specializations: true,
      profilePhotoUrl: true,
      isVerified: true,
      user: { select: { name: true } },
    },
  });
  if (!profile) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/pakar" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Database Akun Pakar
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Edit Pakar</h1>
      <ExpertAdminForm
        mode="edit"
        expertId={params.id}
        initial={{
          name: profile.user.name ?? "",
          bio: profile.bio,
          hourlyRate: profile.hourlyRate,
          yearsExperience: profile.yearsExperience,
          education: profile.education,
          city: profile.city,
          province: profile.province,
          locationType: profile.locationType,
          specializations: profile.specializations,
          profilePhotoUrl: profile.profilePhotoUrl,
          isVerified: profile.isVerified,
        }}
      />
    </div>
  );
}
