import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const ReviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional().nullable(),
});

// POST /api/experts/[id]/reviews — a parent who completed a consultation with
// this expert leaves (or updates) a review. Recomputes the expert's aggregate
// rating + review count.
export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { rating, comment } = ReviewSchema.parse(await request.json());

    // Eligibility: at least one COMPLETED consultation with this expert.
    const completed = await prisma.consultation.findFirst({
      where: {
        expertId: params.id,
        parentId: session.user.id,
        status: "COMPLETED",
      },
      select: { id: true },
    });
    if (!completed) {
      return NextResponse.json(
        { error: "Anda hanya dapat memberi ulasan setelah menyelesaikan konsultasi dengan pakar ini." },
        { status: 403 }
      );
    }

    await prisma.$transaction(async (tx) => {
      await tx.expertReview.upsert({
        where: {
          expertId_reviewerId: { expertId: params.id, reviewerId: session.user.id },
        },
        create: { expertId: params.id, reviewerId: session.user.id, rating, comment: comment ?? null },
        update: { rating, comment: comment ?? null },
      });

      const agg = await tx.expertReview.aggregate({
        where: { expertId: params.id },
        _avg: { rating: true },
        _count: true,
      });

      await tx.expertProfile.update({
        where: { id: params.id },
        data: {
          rating: agg._avg.rating ?? 0,
          totalReviews: agg._count,
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[EXPERT REVIEW POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
