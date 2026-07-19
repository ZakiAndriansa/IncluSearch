import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/knowledge/article-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Edit Konten" };

export default async function EditKnowledgePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) redirect("/login");

  const content = await prisma.knowledgeContent.findUnique({
    where: { slug: params.slug },
    select: {
      id: true,
      title: true,
      category: true,
      type: true,
      excerpt: true,
      content: true,
      externalUrl: true,
      videoUrl: true,
      fileUrl: true,
      thumbnailUrl: true,
      readTimeMins: true,
      isPremium: true,
      authorId: true,
    },
  });
  if (!content) notFound();

  // Only the author or an admin may edit.
  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && content.authorId !== session.user.id) notFound();

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link
        href={`/knowledge-hub/${params.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>
      <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Edit Konten</h1>
      <ArticleForm
        mode="edit"
        contentId={content.id}
        initial={{
          title: content.title,
          category: content.category,
          type: content.type,
          excerpt: content.excerpt,
          content: content.content,
          externalUrl: content.externalUrl,
          videoUrl: content.videoUrl,
          fileUrl: content.fileUrl,
          thumbnailUrl: content.thumbnailUrl,
          readTimeMins: content.readTimeMins,
          isPremium: content.isPremium,
        }}
      />
    </div>
  );
}
