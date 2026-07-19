import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ParentAdminForm } from "@/components/admin/parent-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Orang Tua" };

export default async function EditParentPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const parent = await prisma.user.findUnique({
    where: { id: params.id },
    select: { role: true, name: true, phone: true, isPremium: true, image: true },
  });
  if (!parent || parent.role !== "PARENT") notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/orang-tua" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Database Orang Tua
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Edit Orang Tua</h1>
      <ParentAdminForm
        mode="edit"
        parentId={params.id}
        initial={{
          name: parent.name ?? "",
          phone: parent.phone,
          isPremium: parent.isPremium,
          image: parent.image,
        }}
      />
    </div>
  );
}
