import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * Admin-only endpoint to manually activate premium for a user.
 * This is a DEV workaround for when the Midtrans webhook cannot reach a local
 * server — it grants premium WITHOUT a payment, so it is disabled in production
 * unless explicitly opted in via ALLOW_ADMIN_PREMIUM_OVERRIDE=true.
 *
 * POST /api/admin/activate-premium
 * Body: { email: string, months?: number }
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (
    process.env.NODE_ENV === "production" &&
    process.env.ALLOW_ADMIN_PREMIUM_OVERRIDE !== "true"
  ) {
    return NextResponse.json(
      { error: "Disabled in production" },
      { status: 403 }
    );
  }

  const { email, months = 1 } = await request.json();
  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }
  if (!Number.isInteger(months) || months < 1 || months > 24) {
    return NextResponse.json({ error: "months must be an integer between 1 and 24" }, { status: 400 });
  }

  try {
    // Extend from the existing expiry if still active, otherwise from now —
    // consistent with the real settlement path.
    const existing = await prisma.user.findUnique({
      where: { email },
      select: { id: true, premiumExpiresAt: true },
    });
    if (!existing) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const now = new Date();
    const base =
      existing.premiumExpiresAt && existing.premiumExpiresAt > now
        ? new Date(existing.premiumExpiresAt)
        : new Date(now);
    base.setMonth(base.getMonth() + months);

    const user = await prisma.user.update({
      where: { email },
      data: { isPremium: true, premiumExpiresAt: base },
      select: { id: true, email: true, isPremium: true, premiumExpiresAt: true },
    });

    // Mark the latest pending premium payment as PAID if any
    const pending = await prisma.payment.findFirst({
      where: { userId: user.id, type: "PREMIUM_SUBSCRIPTION", status: "PENDING" },
      orderBy: { createdAt: "desc" },
      select: { id: true },
    });

    if (pending) {
      await prisma.payment.update({
        where: { id: pending.id },
        data: { status: "PAID", paidAt: new Date() },
      });
    }

    console.warn(`[ADMIN] ${session.user.email} manually activated premium for ${email} (+${months}mo)`);
    return NextResponse.json({ success: true, user });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("[ADMIN activate-premium]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
