import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { slugify } from "@/lib/utils";
import { communitySchema } from "@/lib/schemas";
import { z } from "zod";

// POST /api/admin/communities — admin creates a forum/community entry.
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = communitySchema.parse(await request.json());
    const suffix = crypto.randomUUID().slice(0, 6);
    const slug = `${slugify(data.name).slice(0, 80) || "komunitas"}-${suffix}`;

    const community = await prisma.community.create({
      data: { ...data, slug },
      select: { id: true },
    });

    return NextResponse.json({ community }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[ADMIN COMMUNITY CREATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
