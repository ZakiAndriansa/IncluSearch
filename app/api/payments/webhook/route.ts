import { NextResponse } from "next/server";
import { handleMidtransWebhook } from "@/lib/payments";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    await handleMidtransWebhook(payload);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error("[PAYMENT WEBHOOK]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
