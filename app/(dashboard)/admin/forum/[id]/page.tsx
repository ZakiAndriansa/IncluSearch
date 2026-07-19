import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CommunityAdminForm } from "@/components/admin/community-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Komunitas" };

export default async function EditCommunityPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const c = await prisma.community.findUnique({
    where: { id: params.id },
    select: {
      name: true,
      description: true,
      orgType: true,
      focusAreas: true,
      region: true,
      province: true,
      contactEmail: true,
      contactPhone: true,
      website: true,
      logoUrl: true,
      memberCount: true,
      isVerified: true,
      isActive: true,
    },
  });
  if (!c) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/forum" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Kelola Forum
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Edit Komunitas</h1>
      <CommunityAdminForm
        mode="edit"
        communityId={params.id}
        initial={{
          name: c.name,
          description: c.description,
          orgType: c.orgType,
          focusAreas: c.focusAreas,
          region: c.region,
          province: c.province,
          contactEmail: c.contactEmail,
          contactPhone: c.contactPhone,
          website: c.website,
          logoUrl: c.logoUrl,
          memberCount: c.memberCount,
          isVerified: c.isVerified,
          isActive: c.isActive,
        }}
      />
    </div>
  );
}
