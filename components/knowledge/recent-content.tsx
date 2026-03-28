import Link from "next/link";
import Image from "next/image";
import { BookOpen, Video, FileText, Lock } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_LABELS } from "@/lib/utils";

interface RecentContentProps {
  isPremium: boolean;
  limit?: number;
}

const TYPE_ICON = {
  ARTICLE: FileText,
  VIDEO: Video,
  MODULE: BookOpen,
};

const TYPE_LABEL = {
  ARTICLE: "Artikel",
  VIDEO: "Video",
  MODULE: "Modul",
};

export async function RecentContent({ isPremium, limit = 3 }: RecentContentProps) {
  const contents = await prisma.knowledgeContent.findMany({
    where: {
      publishedAt: { not: null },
      ...(isPremium ? {} : {}), // show all, lock premium ones in UI
    },
    orderBy: { publishedAt: "desc" },
    take: limit,
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      type: true,
      category: true,
      isPremium: true,
      thumbnailUrl: true,
      readTimeMins: true,
    },
  });

  if (contents.length === 0) {
    return (
      <div className="rounded-xl border border-sand-200 bg-white p-6 text-center">
        <p className="text-sand-500 text-sm">Belum ada konten tersedia.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {contents.map((content) => {
        const Icon = TYPE_ICON[content.type];
        const locked = content.isPremium && !isPremium;

        return (
          <Link
            key={content.id}
            href={locked ? "/profil?tab=premium" : `/knowledge-hub/${content.slug}`}
            className="flex items-start gap-3 p-3 rounded-xl border border-sand-200 bg-white hover:border-teal-dark/30 hover:shadow-sm transition-all group"
          >
            {/* Thumbnail */}
            <div className="w-14 h-14 rounded-lg bg-sand-100 flex-shrink-0 overflow-hidden relative">
              {content.thumbnailUrl ? (
                <Image
                  src={content.thumbnailUrl}
                  alt={content.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Icon className="w-6 h-6 text-sand-400" />
                </div>
              )}
              {locked && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <Lock className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant="secondary"
                  className="text-[10px] h-4 px-1.5 bg-sand-100 text-sand-600"
                >
                  {TYPE_LABEL[content.type]}
                </Badge>
                {content.isPremium && (
                  <Badge className="text-[10px] h-4 px-1.5 bg-amber-100 text-amber-600 border-amber-200">
                    Premium
                  </Badge>
                )}
              </div>
              <h4 className="text-sm font-medium text-forest-500 leading-tight line-clamp-2 group-hover:text-teal-dark transition-colors">
                {content.title}
              </h4>
              <p className="text-xs text-sand-400 mt-0.5">
                {CATEGORY_LABELS[content.category]}
                {content.readTimeMins && ` · ${content.readTimeMins} mnt`}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
