"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  FileText,
  Video,
  BookOpen,
  Lock,
  Eye,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORY_LABELS, formatDate } from "@/lib/utils";

interface ContentItem {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  type: "ARTICLE" | "VIDEO" | "MODULE";
  category: string;
  isPremium: boolean;
  thumbnailUrl: string | null;
  readTimeMins: number | null;
  viewCount: number;
  publishedAt: Date | null;
}

interface ContentGridProps {
  contents: ContentItem[];
  total: number;
  page: number;
  perPage: number;
  isPremium: boolean;
}

const TYPE_ICON = {
  ARTICLE: FileText,
  VIDEO: Video,
  MODULE: BookOpen,
};

const TYPE_LABEL = { ARTICLE: "Artikel", VIDEO: "Video", MODULE: "Modul" };
const TYPE_COLOR = {
  ARTICLE: "text-forest-500 bg-forest-50 border-forest-100",
  VIDEO: "text-teal-dark bg-teal-dark/5 border-teal-dark/20",
  MODULE: "text-olive-500 bg-olive-50 border-olive-100",
};

export function ContentGrid({ contents, total, page, perPage, isPremium }: ContentGridProps) {
  const router = useRouter();
  const totalPages = Math.ceil(total / perPage);

  if (contents.length === 0) {
    return (
      <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center">
        <div className="text-4xl mb-3">📚</div>
        <h3 className="font-semibold text-forest-500 mb-2">
          Tidak ada konten ditemukan
        </h3>
        <p className="text-sand-500 text-sm">
          Coba ubah filter atau kata kunci pencarian Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {contents.map((content) => {
          const Icon = TYPE_ICON[content.type];
          const locked = content.isPremium && !isPremium;
          const href = locked
            ? "/profil?tab=premium"
            : `/knowledge-hub/${content.slug}`;

          return (
            <Link
              key={content.id}
              href={href}
              className="group flex flex-col bg-white rounded-2xl border border-sand-200 hover:border-teal-dark/30 hover:shadow-md transition-all overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative h-40 bg-sand-100">
                {content.thumbnailUrl ? (
                  <Image
                    src={content.thumbnailUrl}
                    alt={content.title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-10 h-10 text-sand-300" />
                  </div>
                )}
                {locked && (
                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
                    <Lock className="w-6 h-6 text-white" />
                    <span className="text-white text-xs font-medium bg-black/30 px-2 py-0.5 rounded-full">
                      Konten Premium
                    </span>
                  </div>
                )}
                {/* Type badge overlay */}
                <div className="absolute top-3 left-3">
                  <Badge
                    className={`text-[10px] border ${TYPE_COLOR[content.type]}`}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {TYPE_LABEL[content.type]}
                  </Badge>
                </div>
                {content.isPremium && (
                  <div className="absolute top-3 right-3">
                    <Badge className="text-[10px] bg-amber-500 text-white border-transparent">
                      Premium
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 flex flex-col flex-1">
                <Badge
                  variant="secondary"
                  className="w-fit text-[10px] bg-sand-100 text-sand-600 mb-2"
                >
                  {CATEGORY_LABELS[content.category] ?? content.category}
                </Badge>

                <h3 className="font-semibold text-forest-500 text-sm leading-snug mb-2 group-hover:text-teal-dark transition-colors line-clamp-2 flex-1">
                  {content.title}
                </h3>

                {content.excerpt && (
                  <p className="text-xs text-sand-500 line-clamp-2 mb-3">
                    {content.excerpt}
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-sand-400 pt-2 border-t border-sand-100 mt-auto">
                  <div className="flex items-center gap-3">
                    {content.readTimeMins && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {content.readTimeMins} mnt
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {content.viewCount.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-sand-300 group-hover:text-teal-dark transition-colors group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page - 1));
              router.push(`/knowledge-hub?${params.toString()}`);
            }}
            className="border-sand-300"
          >
            Sebelumnya
          </Button>
          <span className="text-sm text-sand-500 px-4">
            {page} / {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => {
              const params = new URLSearchParams(window.location.search);
              params.set("page", String(page + 1));
              router.push(`/knowledge-hub?${params.toString()}`);
            }}
            className="border-sand-300"
          >
            Berikutnya
          </Button>
        </div>
      )}
    </div>
  );
}
