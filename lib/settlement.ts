// Single, idempotent, transactional entry point for confirming a payment.
//
// Three call sites used to duplicate this logic (Midtrans webhook, the /sync
// route, and the consultation page). They could all run for the same payment,
// and the webhook version was not idempotent — a retried settlement created a
// second chat room and re-recorded quota. This module centralises it so every
// path is safe to run any number of times.

import { prisma } from "@/lib/prisma";
import { monthsForPlan } from "@/lib/plans";
import { recordConsultation } from "@/lib/quota-checker";

/**
 * A "final" error that should NOT be retried by the payment gateway
 * (bad signature, unknown order, amount mismatch). Distinguished from
 * transient errors (DB down) so the webhook can return 4xx vs 5xx correctly.
 */
export class PaymentFinalError extends Error {}

export interface SettleOptions {
  /** If provided, verified byte-for-byte against the stored amount before settling. */
  grossAmount?: string | number;
}

export type SettleResult = "settled" | "already_paid";

/**
 * Mark a payment as PAID and apply its side effects (schedule consultation +
 * open chat room, or extend premium). Safe to call repeatedly.
 */
export async function settlePayment(
  orderId: string,
  opts: SettleOptions = {}
): Promise<SettleResult> {
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
    select: {
      id: true,
      userId: true,
      amount: true,
      type: true,
      status: true,
      consultationId: true,
      metadata: true,
    },
  });

  if (!payment) throw new PaymentFinalError("Payment not found");

  // Verify the gateway-reported amount matches what we intended to charge.
  if (opts.grossAmount !== undefined) {
    const gross = Math.round(Number(opts.grossAmount));
    if (!Number.isFinite(gross) || gross !== payment.amount) {
      throw new PaymentFinalError(
        `Gross amount mismatch: expected ${payment.amount}, got ${opts.grossAmount}`
      );
    }
  }

  if (payment.status === "PAID") return "already_paid";

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    // Idempotency guard INSIDE the transaction: only proceed if we are the one
    // that flips the status to PAID. Concurrent settlements get count === 0.
    const claimed = await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "PAID", paidAt: now },
    });
    if (claimed.count === 0) return;

    if (payment.type === "CONSULTATION" && payment.consultationId) {
      const consultation = await tx.consultation.update({
        where: { id: payment.consultationId },
        data: { status: "SCHEDULED", paidAt: now },
        select: { chatRoomId: true },
      });

      // Only create a chat room if one doesn't exist yet — prevents orphaned rooms.
      if (!consultation.chatRoomId) {
        const chatRoom = await tx.chatRoom.create({ data: {} });
        await tx.consultation.update({
          where: { id: payment.consultationId },
          data: { chatRoomId: chatRoom.id },
        });
      }

      await recordConsultation(payment.userId, now, tx);
    }

    if (payment.type === "PREMIUM_SUBSCRIPTION") {
      const planId = (payment.metadata as { planId?: string } | null)?.planId;
      const months = monthsForPlan(planId);

      // Extend from the current expiry if still active, otherwise from now —
      // so renewing early never discards remaining premium time.
      const user = await tx.user.findUnique({
        where: { id: payment.userId },
        select: { premiumExpiresAt: true },
      });
      const base =
        user?.premiumExpiresAt && user.premiumExpiresAt > now
          ? new Date(user.premiumExpiresAt)
          : new Date(now);
      base.setMonth(base.getMonth() + months);

      await tx.user.update({
        where: { id: payment.userId },
        data: { isPremium: true, premiumExpiresAt: base },
      });
    }
  });

  return "settled";
}

/**
 * Mark a payment as cancelled (expire/deny/cancel from the gateway).
 * Never cancels a payment that is already PAID, and only cancels the linked
 * consultation while it is still awaiting payment.
 */
export async function cancelPayment(orderId: string): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
    select: { id: true, status: true, consultationId: true },
  });

  if (!payment) throw new PaymentFinalError("Payment not found");
  if (payment.status === "PAID") return; // a settled payment must not be cancelled

  await prisma.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { id: payment.id, status: { not: "PAID" } },
      data: { status: "CANCELLED" },
    });

    if (payment.consultationId) {
      await tx.consultation.updateMany({
        where: { id: payment.consultationId, status: "PENDING_PAYMENT" },
        data: { status: "CANCELLED" },
      });
    }
  });
}
