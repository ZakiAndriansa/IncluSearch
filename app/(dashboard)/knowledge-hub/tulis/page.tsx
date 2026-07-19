import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/knowledge/article-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Tulis Artikel" };

export default async function WriteArticlePage() {
  const session = await auth();
  if (!session) redirect("/login");
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.role !== "EXPERT") redirect("/knowledge-hub");

  const profile = isAdmin
    ? { isVerified: true }
    : await prisma.expertProfile.findUnique({
        where: { userId: session.user.id },
        select: { isVerified: true },
      });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link
        href="/knowledge-hub/saya"
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500"
      >
        <ArrowLeft className="w-4 h-4" />
        Artikel Saya
      </Link>

      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Tulis Artikel
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Bagikan pengetahuan Anda ke Knowledge Hub. Artikel langsung tayang.
        </p>
      </div>

      {profile?.isVerified ? (
        <ArticleForm />
      ) : (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Hanya pakar terverifikasi yang dapat menulis artikel. Lengkapi &amp;
          verifikasi profil Anda terlebih dahulu.
        </div>
      )}
    </div>
  );
}
