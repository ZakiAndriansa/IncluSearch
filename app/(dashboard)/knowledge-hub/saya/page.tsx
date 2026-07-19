import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Eye } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Artikel Saya" };

export default async function MyArticlesPage() {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "EXPERT" && session.user.role !== "ADMIN") redirect("/knowledge-hub");

  const articles = await prisma.knowledgeContent.findMany({
    where: { authorId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      category: true,
      viewCount: true,
      publishedAt: true,
      createdAt: true,
    },
    take: 100,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            Artikel Saya
          </h1>
          <p className="text-sand-500 text-sm mt-1">Kelola artikel yang Anda tulis.</p>
        </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
          <Link href="/knowledge-hub/tulis">
            <Plus className="w-4 h-4 mr-1.5" />
            Tulis
          </Link>
        </Button>
      </div>

      {articles.length === 0 ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center">
          <div className="text-4xl mb-3">✍️</div>
          <h3 className="font-semibold text-forest-500 mb-1">Belum ada artikel</h3>
          <p className="text-sand-500 text-sm mb-5">
            Mulai bagikan pengetahuan Anda untuk membantu para orang tua.
          </p>
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
            <Link href="/knowledge-hub/tulis">Tulis Artikel Pertama</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/knowledge-hub/${a.slug}`}
              className="block bg-white rounded-2xl border border-sand-200 hover:border-forest-300 transition-colors p-4"
            >
              <h3 className="font-semibold text-forest-500 text-sm">{a.title}</h3>
              <div className="flex items-center gap-3 text-xs text-sand-400 mt-1.5">
                <span className="inline-flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5" /> {a.viewCount}
                </span>
                <span>{a.publishedAt ? `Tayang ${formatDate(a.publishedAt)}` : "Draf"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
