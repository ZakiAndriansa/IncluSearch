import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/payments";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await request.json();
  if (!orderId) return NextResponse.json({ error: "orderId required" }, { status: 400 });

  const payment = await prisma.payment.findUnique({
    where: { midtransOrderId: orderId },
  });

  if (!payment || payment.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Already processed
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

  // Process settlement
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "PAID", paidAt: new Date() },
    });

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

    if (payment.type === "CONSULTATION" && payment.consultationId) {
      const consultation = await tx.consultation.update({
        where: { id: payment.consultationId },
        data: { status: "SCHEDULED", paidAt: new Date() },
        select: { scheduledAt: true },
      });

      const chatRoom = await tx.chatRoom.create({ data: {} });
      await tx.consultation.update({
        where: { id: payment.consultationId },
        data: { chatRoomId: chatRoom.id },
      });

      const { recordConsultation } = await import("@/lib/quota-checker");
      await recordConsultation(payment.userId, consultation.scheduledAt);
    }
  });

  return NextResponse.json({ status: "paid" });
}
