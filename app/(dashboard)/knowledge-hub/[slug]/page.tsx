import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, CATEGORY_LABELS } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Eye, Crown, FileText, Video, BookOpen } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const content = await prisma.knowledgeContent.findUnique({
    where: { slug: params.slug },
    select: { title: true, excerpt: true },
  });
  if (!content) return { title: "Konten tidak ditemukan" };
  return {
    title: content.title,
    description: content.excerpt ?? undefined,
  };
}

const TYPE_LABEL = { ARTICLE: "Artikel", VIDEO: "Video", MODULE: "Modul" };
const TYPE_ICON = { ARTICLE: FileText, VIDEO: Video, MODULE: BookOpen };
const TYPE_COLOR = {
  ARTICLE: "text-forest-500 bg-forest-50 border-forest-100",
  VIDEO: "text-teal-dark bg-teal-dark/5 border-teal-dark/20",
  MODULE: "text-olive-500 bg-olive-50 border-olive-100",
};

export default async function KnowledgeContentPage({
  params,
}: {
  params: { slug: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const content = await prisma.knowledgeContent.findUnique({
    where: { slug: params.slug },
  });

  if (!content || !content.publishedAt) notFound();

  // Premium gate
  if (content.isPremium && !session.user.isPremium) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button asChild variant="ghost" size="sm" className="mb-6 text-sand-500 -ml-2">
          <Link href="/knowledge-hub">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Kembali
          </Link>
        </Button>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mx-auto">
            <Crown className="w-7 h-7 text-amber-500" />
          </div>
          <h2 className="font-serif font-bold text-xl text-forest-500">{content.title}</h2>
          <p className="text-sand-500 text-sm">
            Konten ini hanya tersedia untuk pengguna Premium.
          </p>
          <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
            <Link href="/profil?tab=premium">Upgrade ke Premium</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Increment view count (fire and forget)
  prisma.knowledgeContent
    .update({ where: { id: content.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => {});

  const Icon = TYPE_ICON[content.type];

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <Button asChild variant="ghost" size="sm" className="text-sand-500 -ml-2">
        <Link href="/knowledge-hub">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Kembali ke Knowledge Hub
        </Link>
      </Button>

      {/* Thumbnail */}
      {content.thumbnailUrl && (
        <div className="relative h-56 rounded-2xl overflow-hidden bg-sand-100">
          <Image
            src={content.thumbnailUrl}
            alt={content.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
            priority
          />
        </div>
      )}

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] border ${TYPE_COLOR[content.type]}`}>
            <Icon className="w-3 h-3 mr-1" />
            {TYPE_LABEL[content.type]}
          </Badge>
          <Badge variant="secondary" className="text-[10px] bg-sand-100 text-sand-600">
            {CATEGORY_LABELS[content.category] ?? content.category}
          </Badge>
          {content.isPremium && (
            <Badge className="text-[10px] bg-amber-500 text-white border-transparent">
              Premium
            </Badge>
          )}
        </div>

        <h1 className="font-serif font-bold text-2xl text-forest-500 leading-snug">
          {content.title}
        </h1>

        {content.excerpt && (
          <p className="text-sand-500 text-sm leading-relaxed">{content.excerpt}</p>
        )}

        <div className="flex items-center gap-4 text-xs text-sand-400 pt-1">
          {content.readTimeMins && (
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {content.readTimeMins} menit baca
            </span>
          )}
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {content.viewCount.toLocaleString("id-ID")} dilihat
          </span>
          {content.publishedAt && (
            <span>{formatDate(content.publishedAt)}</span>
          )}
        </div>
      </div>

      <hr className="border-sand-200" />

      {/* Video embed */}
      {content.type === "VIDEO" && content.videoUrl && (
        <div className="rounded-2xl overflow-hidden bg-black aspect-video">
          <iframe
            src={content.videoUrl}
            className="w-full h-full"
            allowFullScreen
            title={content.title}
          />
        </div>
      )}

      {/* Article / Module content */}
      {content.content ? (
        <div
          className="prose prose-sm max-w-none prose-headings:text-forest-500 prose-headings:font-serif prose-a:text-teal-dark prose-strong:text-forest-500"
          dangerouslySetInnerHTML={{ __html: content.content }}
        />
      ) : content.type !== "VIDEO" ? (
        <div className="rounded-2xl border border-sand-200 bg-sand-50 p-8 text-center text-sand-400 text-sm">
          Konten sedang dalam persiapan.
        </div>
      ) : null}
    </div>
  );
}
