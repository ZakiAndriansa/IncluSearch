import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { ExpertAdminForm } from "@/components/admin/expert-admin-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tambah Pakar" };

export default async function AddExpertPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link href="/admin/pakar" className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500">
        <ArrowLeft className="w-4 h-4" /> Database Akun Pakar
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Tambah Pakar</h1>
      <ExpertAdminForm mode="create" />
    </div>
  );
}
