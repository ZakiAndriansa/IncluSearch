import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/payments";
import { settlePayment } from "@/lib/settlement";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  // Ownership check — the caller may only sync their own payment.
  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
    select: { userId: true, status: true },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (payment.status === "PAID") {
    return NextResponse.json({ status: "already_paid" });
  }

  const midtransStatus = await getTransactionStatus(orderId);
  if (!midtransStatus) {
    return NextResponse.json({ status: "pending" });
  }

  const isSettled =
    midtransStatus.transaction_status === "settlement" ||
    (midtransStatus.transaction_status === "capture" &&
      midtransStatus.fraud_status === "accept");

  if (!isSettled) {
    return NextResponse.json({ status: midtransStatus.transaction_status });
  }

  // Idempotent + transactional; safe even if the webhook settles concurrently.
  const result = await settlePayment(orderId);
  return NextResponse.json({ status: result === "already_paid" ? "already_paid" : "paid" });
}
