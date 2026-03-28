import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const type = searchParams.get("type");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "12");

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
