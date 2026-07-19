// Single source of truth for WHEN a consultation chat room is accessible.
// The room must only open during the scheduled date+time window — not at
// payment time. Every surface (room page, messages API, list) uses this.

export interface ConsultationWindow {
  start: Date;
  end: Date;
  isBefore: boolean; // scheduled time hasn't arrived yet
  isOpen: boolean; // within [start, end]
  isAfter: boolean; // window has passed
}

export function getConsultationWindow(
  scheduledAt: Date | string,
  durationMins: number,
  now: Date = new Date()
): ConsultationWindow {
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);
  const t = now.getTime();
  return {
    start,
    end,
    isBefore: t < start.getTime(),
    isOpen: t >= start.getTime() && t <= end.getTime(),
    isAfter: t > end.getTime(),
  };
}

// Deterministic, hard-to-guess Jitsi room per consultation (cuid in the name).
export function getJitsiRoom(consultationId: string): string {
  return `inclusearch-${consultationId}`;
}

export type ChatAccess =
  | "not_paid" // still awaiting payment
  | "cancelled" // cancelled / refunded
  | "before" // paid, but scheduled time not reached — room stays closed
  | "open" // within the window — can view + send
  | "after"; // window passed — history only, cannot send

/**
 * Resolve chat access from a consultation's status + schedule.
 * `status` is the ConsultationStatus; `paid` reflects the linked payment.
 */
export function getChatAccess(
  status: string,
  scheduledAt: Date | string,
  durationMins: number,
  paid: boolean,
  now: Date = new Date()
): ChatAccess {
  if (status === "CANCELLED" || status === "REFUNDED") return "cancelled";
  if (status === "PENDING_PAYMENT" || !paid) return "not_paid";

  const win = getConsultationWindow(scheduledAt, durationMins, now);
  if (win.isBefore) return "before";
  if (win.isOpen) return "open";
  return "after";
}
