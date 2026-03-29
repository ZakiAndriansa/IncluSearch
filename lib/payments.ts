// Midtrans payment integration
// Docs: https://api-docs.midtrans.com/

import { prisma } from "@/lib/prisma";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY!;
const MIDTRANS_CLIENT_KEY = process.env.MIDTRANS_CLIENT_KEY!;
const IS_SANDBOX = process.env.MIDTRANS_IS_SANDBOX === "true" || MIDTRANS_SERVER_KEY?.startsWith("SB-");
const APP_URL = process.env.NEXTAUTH_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const SNAP_BASE_URL = IS_SANDBOX
  ? "https://app.sandbox.midtrans.com/snap/v1"
  : "https://app.midtrans.com/snap/v1";

const AUTH_HEADER = `Basic ${Buffer.from(MIDTRANS_SERVER_KEY + ":").toString("base64")}`;

export interface SnapTransactionResult {
  token: string;
  redirect_url: string;
}

export interface ConsultationPaymentParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  consultationId: string;
  expertName: string;
  scheduledAt: Date;
}

export interface PremiumPaymentParams {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  planName: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Snap transaction (consultation payment)
// ─────────────────────────────────────────────────────────────────────────────

export async function createConsultationTransaction(
  params: ConsultationPaymentParams
): Promise<SnapTransactionResult> {
  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
      phone: params.customerPhone ?? "",
    },
    item_details: [
      {
        id: `consult-${params.consultationId}`,
        price: params.amount,
        quantity: 1,
        name: `Konsultasi dengan ${params.expertName}`,
      },
    ],
    callbacks: {
      finish: `${APP_URL}/konsultasi/${params.consultationId}?status=success`,
      error: `${APP_URL}/konsultasi/${params.consultationId}?status=error`,
      pending: `${APP_URL}/konsultasi/${params.consultationId}?status=pending`,
    },
    notification_url: `${APP_URL}/api/payments/webhook`,
    expiry: {
      unit: "hour",
      duration: 24,
    },
  };

  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: AUTH_HEADER,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Midtrans error: ${error}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Create Snap transaction (premium subscription)
// ─────────────────────────────────────────────────────────────────────────────

export async function createPremiumTransaction(
  params: PremiumPaymentParams
): Promise<SnapTransactionResult> {
  const body = {
    transaction_details: {
      order_id: params.orderId,
      gross_amount: params.amount,
    },
    customer_details: {
      first_name: params.customerName,
      email: params.customerEmail,
    },
    item_details: [
      {
        id: "premium-subscription",
        price: params.amount,
        quantity: 1,
        name: params.planName,
      },
    ],
    callbacks: {
      finish: `${APP_URL}/profil?tab=premium&status=success`,
      error: `${APP_URL}/profil?tab=premium&status=error`,
    },
    notification_url: `${APP_URL}/api/payments/webhook`,
    expiry: {
      unit: "hour",
      duration: 2,
    },
  };

  const response = await fetch(`${SNAP_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: AUTH_HEADER,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Midtrans error: ${error}`);
  }

  return response.json();
}

// ─────────────────────────────────────────────────────────────────────────────
// Verify Midtrans webhook signature
// ─────────────────────────────────────────────────────────────────────────────

export async function verifyWebhookSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string
): Promise<boolean> {
  const { createHash } = await import("crypto");
  const expected = createHash("sha512")
    .update(`${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`)
    .digest("hex");
  return expected === signatureKey;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handle Midtrans webhook
// ─────────────────────────────────────────────────────────────────────────────

export async function handleMidtransWebhook(payload: {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount: string;
  status_code: string;
  signature_key: string;
  payment_type: string;
}) {
  const isValid = await verifyWebhookSignature(
    payload.order_id,
    payload.status_code,
    payload.gross_amount,
    payload.signature_key
  );

  if (!isValid) throw new Error("Invalid webhook signature");

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: payload.order_id },
    include: { consultation: true, user: true },
  });

  if (!payment) throw new Error("Payment not found");

  const isSettled =
    payload.transaction_status === "settlement" ||
    (payload.transaction_status === "capture" &&
      payload.fraud_status === "accept");

  if (isSettled) {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", paidAt: new Date() },
      });

      if (payment.type === "CONSULTATION" && payment.consultationId) {
        const consultation = await tx.consultation.update({
          where: { id: payment.consultationId },
          data: { status: "SCHEDULED", paidAt: new Date() },
          select: { scheduledAt: true },
        });

        // Create chat room for the consultation
        const chatRoom = await tx.chatRoom.create({ data: {} });
        await tx.consultation.update({
          where: { id: payment.consultationId },
          data: { chatRoomId: chatRoom.id },
        });

        // Record quota usage — anchor 20-day window from scheduled date
        const { recordConsultation } = await import("@/lib/quota-checker");
        await recordConsultation(payment.userId, consultation.scheduledAt);
      }

      if (payment.type === "PREMIUM_SUBSCRIPTION") {
        const planId = (payment.metadata as { planId?: string } | null)?.planId;
        const monthsToAdd = planId === "quarterly" ? 3 : 1;

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + monthsToAdd);

        await tx.user.update({
          where: { id: payment.userId },
          data: { isPremium: true, premiumExpiresAt: expiresAt },
        });
      }
    });
  } else if (
    payload.transaction_status === "cancel" ||
    payload.transaction_status === "expire" ||
    payload.transaction_status === "deny"
  ) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "CANCELLED" },
    });

    if (payment.consultationId) {
      await prisma.consultation.update({
        where: { id: payment.consultationId },
        data: { status: "CANCELLED" },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Check transaction status from Midtrans
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_BASE_URL = IS_SANDBOX
  ? "https://api.sandbox.midtrans.com/v2"
  : "https://api.midtrans.com/v2";

export async function getTransactionStatus(orderId: string): Promise<{
  transaction_status: string;
  fraud_status?: string;
} | null> {
  try {
    const response = await fetch(`${STATUS_BASE_URL}/${orderId}/status`, {
      headers: {
        Accept: "application/json",
        Authorization: AUTH_HEADER,
      },
    });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export { MIDTRANS_CLIENT_KEY };
