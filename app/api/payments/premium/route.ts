import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createPremiumTransaction, MIDTRANS_CLIENT_KEY } from "@/lib/payments";
import { generateOrderId } from "@/lib/utils";
import { getPlan } from "@/lib/plans";

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { planId } = await request.json();
    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    }

    const orderId = generateOrderId("PREM");
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true },
    });

    const snapResult = await createPremiumTransaction({
      orderId,
      amount: plan.price,
      customerName: user?.name ?? "Pengguna",
      customerEmail: user?.email ?? "",
      planName: plan.name,
    });

    await prisma.payment.create({
      data: {
        userId: session.user.id,
        type: "PREMIUM_SUBSCRIPTION",
        amount: plan.price,
        midtransOrderId: orderId,
        midtransToken: snapResult.token,
        midtransUrl: snapResult.redirect_url,
        metadata: { planId, planName: plan.name },
      },
    });

    return NextResponse.json({
      paymentToken: snapResult.token,
      redirectUrl: snapResult.redirect_url,
      clientKey: MIDTRANS_CLIENT_KEY,
    });
  } catch (err) {
    console.error("[PREMIUM PAYMENT]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
