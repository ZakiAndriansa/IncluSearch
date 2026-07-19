// Single source of truth for premium subscription plans.
// Used by the payment API (server) and the pricing UI (client) so the
// displayed price can never drift from the charged price.

export interface PremiumPlan {
  id: string;
  name: string;
  price: number; // in IDR
  months: number;
}

export const PREMIUM_PLANS: Record<string, PremiumPlan> = {
  monthly: { id: "monthly", name: "Premium Bulanan", price: 99000, months: 1 },
  quarterly: { id: "quarterly", name: "Premium 3 Bulan", price: 249000, months: 3 },
};

export const PREMIUM_PLAN_LIST: PremiumPlan[] = Object.values(PREMIUM_PLANS);

export function getPlan(id?: string | null): PremiumPlan | null {
  if (!id) return null;
  return PREMIUM_PLANS[id] ?? null;
}

/** Number of months a plan grants; defaults to 1 for unknown ids. */
export function monthsForPlan(id?: string | null): number {
  return getPlan(id)?.months ?? 1;
}
