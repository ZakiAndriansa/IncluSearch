import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Admin-only endpoint to manually activate premium for a user.
 * Used when Midtrans webhook cannot reach local dev server.
 *
 * POST /api/admin/activate-premium
 * Body: { email: string, months?: number }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, months = 1 } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const expiresAt = new Date();
  expiresAt.setMonth(expiresAt.getMonth() + months);

  const user = await prisma.user.update({
    where: { email },
    data: { isPremium: true, premiumExpiresAt: expiresAt },
    select: { id: true, email: true, isPremium: true, premiumExpiresAt: true },
  });

  // Mark the latest pending premium payment as PAID if any
  const pending = await prisma.payment.findFirst({
    where: { userId: user.id, type: "PREMIUM_SUBSCRIPTION", status: "PENDING" },
    orderBy: { createdAt: "desc" },
  });

  if (pending) {
    await prisma.payment.update({
      where: { id: pending.id },
      data: { status: "PAID", paidAt: new Date() },
    });
  }

  return NextResponse.json({ success: true, user });
}
