import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const UpdateSchema = z.object({
  title: z.string().min(4).max(160).optional(),
  excerpt: z.string().max(400).optional().nullable(),
  content: z.string().min(20).optional(),
  category: z
    .enum([
      "LEARNING_DIFFICULTIES",
      "BEHAVIORAL_SUPPORT",
      "COMMUNICATION_DISORDERS",
      "SENSORY_PROCESSING",
      "PARENTING_TIPS",
      "EXPERT_GUIDES",
      "CASE_STUDIES",
    ])
    .optional(),
  isPremium: z.boolean().optional(),
  thumbnailUrl: z.string().max(2000).optional().nullable(),
  readTimeMins: z.number().int().min(1).max(600).optional().nullable(),
});

async function assertOwner(id: string, userId: string, role: string) {
  const content = await prisma.knowledgeContent.findUnique({
    where: { id },
    select: { authorId: true },
  });
  if (!content) return { ok: false as const, status: 404, error: "Not found" };
  if (content.authorId !== userId && role !== "ADMIN") {
    return { ok: false as const, status: 403, error: "Forbidden" };
  }
  return { ok: true as const };
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await assertOwner(params.id, session.user.id, session.user.role);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  try {
    const data = UpdateSchema.parse(await request.json());
    const updated = await prisma.knowledgeContent.update({
      where: { id: params.id },
      data,
      select: { id: true, slug: true },
    });
    return NextResponse.json({ content: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const guard = await assertOwner(params.id, session.user.id, session.user.role);
  if (!guard.ok) return NextResponse.json({ error: guard.error }, { status: guard.status });

  await prisma.knowledgeContent.delete({ where: { id: params.id } });
  return NextResponse.json({ success: true });
}
