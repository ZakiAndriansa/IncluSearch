// Platform economics.
// Parents pay the expert's full rate per consultation; the platform keeps a
// commission and pays the rest out to the expert. Premium subscriptions are
// 100% platform revenue (no payout).

import { prisma } from "@/lib/prisma";

export const PLATFORM_COMMISSION_RATE = 0.13; // 13% platform commission
export const EXPERT_PAYOUT_RATE = 1 - PLATFORM_COMMISSION_RATE; // 87% to expert

/** Amount owed to the expert for a consultation of `amount` (parent-paid). */
export function expertPayout(amount: number): number {
  return Math.round(amount * EXPERT_PAYOUT_RATE);
}

/** Platform commission earned from a consultation of `amount`. */
export function platformCommission(amount: number): number {
  return amount - expertPayout(amount);
}

/**
 * Compute an expert's payout balance:
 *  - owed: 87% of their PAID consultation revenue (all time)
 *  - paid: sum of recorded payouts
 *  - outstanding: owed - paid (never below 0)
 */
export async function getExpertBalance(expertId: string): Promise<{
  gross: number;
  owed: number;
  paid: number;
  outstanding: number;
}> {
  const [payments, payoutAgg] = await Promise.all([
    prisma.payment.findMany({
      where: { type: "CONSULTATION", status: "PAID", consultation: { expertId } },
      select: { amount: true },
    }),
    prisma.payout.aggregate({ where: { expertId }, _sum: { amount: true } }),
  ]);

  const gross = payments.reduce((s, p) => s + p.amount, 0);
  const owed = expertPayout(gross);
  const paid = payoutAgg._sum.amount ?? 0;
  const outstanding = Math.max(0, owed - paid);
  return { gross, owed, paid, outstanding };
}
