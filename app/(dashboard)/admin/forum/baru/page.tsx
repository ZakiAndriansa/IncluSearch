import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { CommunityAdminForm } from "@/components/admin/community-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tambah Komunitas" };

export default async function AddCommunityPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/forum" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Kelola Forum
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Tambah Komunitas</h1>
      <CommunityAdminForm mode="create" />
    </div>
  );
}
