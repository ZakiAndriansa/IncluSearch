import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const province = searchParams.get("province");
  const type = searchParams.get("type");
  const focus = searchParams.get("focus");
  const q = searchParams.get("q");
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "12");

  const where = {
    isActive: true,
    ...(province ? { province } : {}),
    ...(type ? { orgType: type as any } : {}),
    ...(focus ? { focusAreas: { has: focus as any } } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [communities, total] = await Promise.all([
    prisma.community.findMany({
      where,
      orderBy: [{ isVerified: "desc" }, { memberCount: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.community.count({ where }),
  ]);

  return NextResponse.json({ communities, total, page, perPage });
}
