import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const Schema = z.object({ verified: z.boolean() });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { verified } = Schema.parse(await request.json());
    const updated = await prisma.expertProfile.update({
      where: { id: params.id },
      data: { isVerified: verified },
      select: { id: true, isVerified: true },
    });
    return NextResponse.json({ profile: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
