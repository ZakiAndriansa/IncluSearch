import { NextResponse } from "next/server";
import { handleMidtransWebhook } from "@/lib/payments";
import { PaymentFinalError } from "@/lib/settlement";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log("[WEBHOOK] Received:", JSON.stringify({
      order_id: payload.order_id,
      transaction_status: payload.transaction_status,
      fraud_status: payload.fraud_status,
      payment_type: payload.payment_type,
    }));
    await handleMidtransWebhook(payload);
    console.log("[WEBHOOK] Processed OK:", payload.order_id);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[WEBHOOK] Error:", message);

    // Final errors (bad signature, unknown order, amount mismatch) → 400 so
    // Midtrans stops retrying. Everything else (DB down, timeout) is transient
    // → 500 so Midtrans retries and the settlement is not lost.
    const isFinal = err instanceof PaymentFinalError;
    return NextResponse.json(
      { error: message },
      { status: isFinal ? 400 : 500 }
    );
  }
}
