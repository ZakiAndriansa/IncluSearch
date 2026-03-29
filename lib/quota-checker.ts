import { prisma } from "@/lib/prisma";
import type { User, ConsultationQuota } from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const FREE_QUOTA_WINDOW_DAYS = 20;
const WINDOW_MS = FREE_QUOTA_WINDOW_DAYS * 24 * 60 * 60 * 1000;

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

  // Free user — check quota record
  const quota = await prisma.consultationQuota.findUnique({
    where: { userId },
  });

  const now = new Date();

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
 * Record a completed consultation for a free user.
 * Called after a consultation is confirmed/paid.
 * Uses scheduledAt (the consultation date) as the anchor for the 20-day window.
 */
export async function recordConsultation(userId: string, scheduledAt?: Date): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isPremium: true, premiumExpiresAt: true },
  });

  if (!user) throw new Error("User not found");

  // Premium users don't need quota tracking
  const isPremium =
    user.isPremium &&
    (user.premiumExpiresAt === null || user.premiumExpiresAt > new Date());

  if (isPremium) return;

  const anchor = scheduledAt ?? new Date();
  const nextAvailableAt = new Date(anchor.getTime() + WINDOW_MS);

  await prisma.consultationQuota.upsert({
    where: { userId },
    create: {
      userId,
      lastConsultationAt: anchor,
      nextAvailableAt,
    },
    update: {
      lastConsultationAt: anchor,
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

/**
 * Check if user can create a new assessment.
 * No hard limit — user can create many, but only 1 is active at a time.
 * Creating a new one automatically deactivates the previous active one.
 */
export async function checkAssessmentLimit(userId: string): Promise<{
  allowed: boolean;
  currentCount: number;
  maxAllowed: number;
  message: string;
}> {
  const currentCount = await prisma.assessment.count({
    where: { userId },
  });

  return {
    allowed: true,
    currentCount,
    maxAllowed: Infinity,
    message: "",
  };
}
