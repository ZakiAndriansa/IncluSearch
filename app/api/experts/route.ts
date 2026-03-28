import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const spec = searchParams.get("spec");
  const location = searchParams.get("location");
  const q = searchParams.get("q");
  const sortBy = searchParams.get("sortBy") ?? "rating";
  const page = parseInt(searchParams.get("page") ?? "1");
  const perPage = parseInt(searchParams.get("perPage") ?? "9");

  const where = {
    isVerified: true,
    isAvailable: true,
    ...(spec ? { specializations: { has: spec as any } } : {}),
    ...(location && location !== "all" ? { locationType: location as any } : {}),
    ...(q ? { user: { name: { contains: q, mode: "insensitive" as const } } } : {}),
  };

  const [experts, total] = await Promise.all([
    prisma.expertProfile.findMany({
      where,
      include: {
        user: { select: { name: true, image: true, email: true } },
        availabilitySlots: { where: { isActive: true } },
      },
      orderBy:
        sortBy === "price-asc"
          ? { hourlyRate: "asc" }
          : sortBy === "price-desc"
          ? { hourlyRate: "desc" }
          : [{ rating: "desc" }, { totalReviews: "desc" }],
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.expertProfile.count({ where }),
  ]);

  return NextResponse.json({ experts, total, page, perPage });
}
