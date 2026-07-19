import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getExpertBalance } from "@/lib/finance";
import { z } from "zod";

const Schema = z.object({
  expertId: z.string(),
  method: z.string().max(60).optional().nullable(),
  note: z.string().max(300).optional().nullable(),
});

// POST — admin records that an expert's outstanding balance has been paid.
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const { expertId, method, note } = Schema.parse(await request.json());

    const expert = await prisma.expertProfile.findUnique({
      where: { id: expertId },
      select: { id: true },
    });
    if (!expert) return NextResponse.json({ error: "Pakar tidak ditemukan" }, { status: 404 });

    // Amount is computed server-side (outstanding balance) — not trusted from client.
    const balance = await getExpertBalance(expertId);
    if (balance.outstanding <= 0) {
      return NextResponse.json({ error: "Tidak ada saldo yang perlu dibayar" }, { status: 400 });
    }

    const payout = await prisma.payout.create({
      data: {
        expertId,
        amount: balance.outstanding,
        method: method ?? "Transfer Bank",
        note: note ?? null,
      },
      select: { id: true, amount: true },
    });

    console.warn(`[PAYOUT] ${session.user.email} paid ${payout.amount} to expert ${expertId}`);
    return NextResponse.json({ payout }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[PAYOUT POST]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
