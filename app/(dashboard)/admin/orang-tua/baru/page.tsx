import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { ParentAdminForm } from "@/components/admin/parent-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tambah Orang Tua" };

export default async function AddParentPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/orang-tua" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Database Orang Tua
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Tambah Orang Tua</h1>
      <ParentAdminForm mode="create" />
    </div>
  );
}
