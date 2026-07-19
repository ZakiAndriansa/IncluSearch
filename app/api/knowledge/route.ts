import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { z } from "zod";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(48, Math.max(1, parseInt(searchParams.get("perPage") ?? "12") || 12));

  const where = {
    publishedAt: { not: null as null },
    ...(category ? { category: category as any } : {}),
    ...(type ? { type: type as any } : {}),
    ...(q ? { title: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [contents, total] = await Promise.all([
    prisma.knowledgeContent.findMany({
      where,
      orderBy: { publishedAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
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
        viewCount: true,
        publishedAt: true,
      },
    }),
    prisma.knowledgeContent.count({ where }),
  ]);

  return NextResponse.json({ contents, total, page, perPage });
}

const ContentSchema = z
  .object({
    title: z.string().min(4).max(160),
    excerpt: z.string().max(400).optional().nullable(),
    content: z.string().optional().nullable(),
    type: z.enum(["ARTICLE", "VIDEO", "MODULE", "LINK", "PHOTO"]),
    category: z.enum([
      "LEARNING_DIFFICULTIES",
      "BEHAVIORAL_SUPPORT",
      "COMMUNICATION_DISORDERS",
      "SENSORY_PROCESSING",
      "PARENTING_TIPS",
      "EXPERT_GUIDES",
      "CASE_STUDIES",
    ]),
    isPremium: z.boolean().optional().default(false),
    thumbnailUrl: z.string().max(2000).optional().nullable(),
    videoUrl: z.string().max(2000).optional().nullable(),
    externalUrl: z.string().url().optional().nullable(),
    fileUrl: z.string().max(2000).optional().nullable(),
    readTimeMins: z.number().int().min(1).max(600).optional().nullable(),
  })
  // Each type requires its own primary field.
  .superRefine((d, ctx) => {
    const need = (ok: boolean, path: string, msg: string) => {
      if (!ok) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message: msg });
    };
    if (d.type === "ARTICLE" || d.type === "MODULE") need(!!d.content && d.content.length >= 20, "content", "Isi artikel minimal 20 karakter");
    if (d.type === "LINK") need(!!d.externalUrl, "externalUrl", "Tautan wajib diisi");
    if (d.type === "VIDEO") need(!!d.videoUrl, "videoUrl", "File video wajib diunggah");
    if (d.type === "PHOTO") need(!!d.fileUrl, "fileUrl", "File foto wajib diunggah");
  });

// POST — a verified expert authors content that publishes immediately.
export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const isAdmin = session.user.role === "ADMIN";
  if (!isAdmin && session.user.role !== "EXPERT") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Admins can always author; experts must be verified.
  if (!isAdmin) {
    const profile = await prisma.expertProfile.findUnique({
      where: { userId: session.user.id },
      select: { isVerified: true },
    });
    if (!profile?.isVerified) {
      return NextResponse.json(
        { error: "Hanya pakar terverifikasi yang dapat menulis artikel" },
        { status: 403 }
      );
    }
  }

  try {
    const body = await request.json();
    const data = ContentSchema.parse(body);

    // Unique slug: base + short random suffix.
    const suffix = crypto.randomUUID().slice(0, 6);
    const slug = `${slugify(data.title).slice(0, 80) || "artikel"}-${suffix}`;

    const content = await prisma.knowledgeContent.create({
      data: {
        ...data,
        slug,
        authorId: session.user.id,
        publishedAt: new Date(), // publish immediately (no moderation)
      },
      select: { id: true, slug: true },
    });

    return NextResponse.json({ content }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[KNOWLEDGE POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
