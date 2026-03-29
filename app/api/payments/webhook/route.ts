import { NextResponse } from "next/server";
import { handleMidtransWebhook } from "@/lib/payments";

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
    console.error("[WEBHOOK] Error:", err instanceof Error ? err.message : err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
