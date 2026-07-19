import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

/** Either the global client or an interactive-transaction client. */
type PrismaClientOrTx = typeof prisma | Prisma.TransactionClient;

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const FREE_QUOTA_WINDOW_DAYS = 20;
const WINDOW_MS = FREE_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000;

// How long an unpaid booking "holds" the quota. Matches the 24h Midtrans Snap
// expiry: while a booking is awaiting payment, the user can't start another one.
const PENDING_HOLD_MS = 24 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface QuotaStatus {
  allowed: boolean;
  isPremium: boolean;
  lastConsultationAt: Date | null;
  nextAvailableAt: Date | null;
  daysUntilReset: number | null;
  hoursUntilReset: number | null;
  message: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Core Logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a user is allowed to book a consultation.
 *
 * Rules:
 *  - Premium users: always allowed (unlimited)
 *  - Free users: 1 consultation per 20-day rolling window
 *    * Quota does NOT accumulate — max is always 1
 *    * Allowed if: lastConsultationAt is null OR (now - lastConsultationAt) >= 20 days
 */
export async function checkConsultationQuota(
  userId: string
): Promise<QuotaStatus> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  if (!user) throw new Error("User not found");

  // Check if premium is still active
  const isPremium =
    user.isPremium &&
    (user.premiumExpiresAt === null || user.premiumExpiresAt > new Date());

  if (isPremium) {
    return {
      allowed: true,
      isPremium: true,
      lastConsultationAt: null,
      nextAvailableAt: null,
      daysUntilReset: null,
      hoursUntilReset: null,
      message: "Premium: konsultasi tidak terbatas",
    };
  }

  const now = new Date();

  // Block a second booking while one is still awaiting payment — otherwise a
  // free user could open several tabs, create multiple PENDING_PAYMENT
  // consultations, and pay them all within one window.
  const pending = await prisma.consultation.findFirst({
    where: {
      parentId: userId,
      status: "PENDING_PAYMENT",
      createdAt: { gte: new Date(now.getTime() - PENDING_HOLD_MS) },
    },
    select: { id: true },
  });
  if (pending) {
    return {
      allowed: false,
      isPremium: false,
      lastConsultationAt: null,
      nextAvailableAt: null,
      daysUntilReset: null,
      hoursUntilReset: null,
      message:
        "Anda masih memiliki konsultasi yang menunggu pembayaran. Selesaikan atau batalkan dulu sebelum memesan lagi.",
    };
  }

  // Free user — check quota record
  const quota = await prisma.consultationQuota.findUnique({
    where: { userId },
  });

  // If no quota record, fall back to checking actual paid consultations
  let lastConsultationAt = quota?.lastConsultationAt ?? null;
  if (!lastConsultationAt) {
    const lastPaid = await prisma.consultation.findFirst({
      where: {
        parentId: userId,
        status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
        paidAt: { not: null },
      },
      orderBy: { scheduledAt: "desc" },
      select: { scheduledAt: true },
    });
    if (lastPaid) {
      lastConsultationAt = lastPaid.scheduledAt;
    }
  }

  // First consultation ever
  if (!lastConsultationAt) {
    return {
      allowed: true,
      isPremium: false,
      lastConsultationAt: null,
      nextAvailableAt: null,
      daysUntilReset: null,
      hoursUntilReset: null,
      message: "Anda dapat melakukan konsultasi pertama Anda",
    };
  }

  const elapsed = now.getTime() - lastConsultationAt.getTime();
  const remaining = WINDOW_MS - elapsed;

  if (elapsed >= WINDOW_MS) {
    // Window has passed — allowed
    return {
      allowed: true,
      isPremium: false,
      lastConsultationAt,
      nextAvailableAt: null,
      daysUntilReset: null,
      hoursUntilReset: null,
      message: "Kuota konsultasi tersedia",
    };
  }

  // Still within the 20-day window — not allowed
  const nextAvailableAt = new Date(lastConsultationAt.getTime() + WINDOW_MS);
  const daysUntilReset = Math.ceil(remaining / (24 * 60 * 60 * 1000));
  const hoursUntilReset = Math.ceil(remaining / (60 * 60 * 1000));

  return {
    allowed: false,
    isPremium: false,
    lastConsultationAt,
    nextAvailableAt,
    daysUntilReset,
    hoursUntilReset,
    message: `Kuota habis. Konsultasi berikutnya tersedia dalam ${daysUntilReset} hari`,
  };
}

/**
 * Record a consultation against a free user's quota.
 * Called at settlement time (when the payment is confirmed).
 *
 * The 20-day window is anchored at `at` (defaults to now = settlement time),
 * NOT at the future scheduled date — anchoring on a future date would make
 * `now - lastConsultationAt` negative and over-block the user.
 *
 * Accepts an optional transaction client so it can run atomically inside the
 * settlement transaction.
 */
export async function recordConsultation(
  userId: string,
  at: Date = new Date(),
  client: PrismaClientOrTx = prisma
): Promise<void> {
  const user = await client.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  if (!user) throw new Error("User not found");

  // Premium users don't need quota tracking
  const isPremium =
    user.isPremium &&
    (user.premiumExpiresAt === null || user.premiumExpiresAt > new Date());

  if (isPremium) return;

  const nextAvailableAt = new Date(at.getTime() + WINDOW_MS);

  await client.consultationQuota.upsert({
    where: { userId },
    create: {
      userId,
      lastConsultationAt: at,
      nextAvailableAt,
    },
    update: {
      lastConsultationAt: at,
      nextAvailableAt,
    },
  });
}

/**
 * Get a formatted countdown string for display in UI.
 */
export function formatQuotaCountdown(status: QuotaStatus): string {
  if (status.allowed) return "";
  if (!status.nextAvailableAt) return "";

  const now = new Date();
  const diff = status.nextAvailableAt.getTime() - now.getTime();

  const days = Math.floor(diff / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));

  if (days > 0) return `${days} hari ${hours} jam`;
  if (hours > 0) return `${hours} jam`;
  return "Kurang dari 1 jam";
}
