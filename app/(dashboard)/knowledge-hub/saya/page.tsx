import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Eye, Pencil } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { Pagination } from "@/components/shared/pagination";
import { DeleteContentButton } from "@/components/knowledge/delete-content-button";
import { CONTENT_TYPE_LABEL } from "@/lib/knowledge";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kelola Knowledge Hub" };

const PER_PAGE = 10;

export default async function MyArticlesPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "EXPERT" && session.user.role !== "ADMIN") redirect("/knowledge-hub");

  const isAdmin = session.user.role === "ADMIN";
  const page = Math.max(1, parseInt(searchParams.page ?? "1") || 1);

  // Admin manages ALL content; experts only their own.
  const where = isAdmin ? {} : { authorId: session.user.id };

  const [articles, total] = await Promise.all([
    prisma.knowledgeContent.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        title: true,
        slug: true,
        type: true,
        viewCount: true,
        publishedAt: true,
        author: { select: { name: true } },
      },
    }),
    prisma.knowledgeContent.count({ where }),
  ]);

  const totalPages = Math.ceil(total / PER_PAGE);

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            {isAdmin ? "Kelola Knowledge Hub" : "Artikel Saya"}
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            {isAdmin ? `${total} konten — bisa diedit & dihapus.` : "Kelola artikel yang Anda tulis."}
          </p>
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
          <h3 className="font-semibold text-forest-500 mb-1">Belum ada konten</h3>
          <Button asChild className="mt-4 bg-forest-500 hover:bg-forest-600 text-white">
            <Link href="/knowledge-hub/tulis">Tulis Konten Pertama</Link>
          </Button>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {articles.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-sand-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <Link href={`/knowledge-hub/${a.slug}`} className="min-w-0 group">
                    <h3 className="font-semibold text-forest-500 text-sm group-hover:underline truncate">
                      {a.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-sand-400 mt-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-sand-100 text-sand-600">
                        {CONTENT_TYPE_LABEL[a.type]}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> {a.viewCount}
                      </span>
                      <span>{a.publishedAt ? `Tayang ${formatDate(a.publishedAt)}` : "Draf"}</span>
                      {isAdmin && a.author?.name && (
                        <span className="text-sand-400">oleh {a.author.name}</span>
                      )}
                    </div>
                  </Link>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link
                      href={`/knowledge-hub/${a.slug}/edit`}
                      className="inline-flex items-center gap-1 text-xs font-medium rounded-lg px-2.5 py-1 border border-sand-300 text-sand-600 hover:bg-sand-50"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Edit
                    </Link>
                    <DeleteContentButton id={a.id} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination basePath="/knowledge-hub/saya" page={page} totalPages={totalPages} />
        </>
      )}
    </div>
  );
}
