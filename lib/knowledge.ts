import type { ComponentType } from "react";
import {
  FileText,
  Video,
  BookOpen,
  Link as LinkIcon,
  Image as ImageIcon,
} from "lucide-react";
import type { ContentType } from "@prisma/client";

type IconType = ComponentType<{ className?: string }>;

export const CONTENT_TYPE_LABEL: Record<ContentType, string> = {
  ARTICLE: "Artikel",
  VIDEO: "Video",
  MODULE: "Modul",
  LINK: "Tautan",
  PHOTO: "Foto",
};

export const CONTENT_TYPE_ICON: Record<ContentType, IconType> = {
  ARTICLE: FileText,
  VIDEO: Video,
  MODULE: BookOpen,
  LINK: LinkIcon,
  PHOTO: ImageIcon,
};

export const CONTENT_TYPE_COLOR: Record<ContentType, string> = {
  ARTICLE: "text-forest-500 bg-forest-50 border-forest-100",
  VIDEO: "text-teal-dark bg-teal-dark/5 border-teal-dark/20",
  MODULE: "text-olive-500 bg-olive-50 border-olive-100",
  LINK: "text-blue-600 bg-blue-50 border-blue-100",
  PHOTO: "text-amber-600 bg-amber-50 border-amber-100",
};
