import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const expert = await prisma.expertProfile.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { name: true, image: true, email: true } },
      availabilitySlots: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      reviews: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!expert) {
    return NextResponse.json({ error: "Expert not found" }, { status: 404 });
  }

  return NextResponse.json({ expert });
}
