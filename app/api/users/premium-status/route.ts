import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      isPremium: true,
      premiumExpiresAt: true,
    },
  });

  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const isActivePremium =
    user.isPremium &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  const latestPayment = await prisma.payment.findFirst({
    where: { userId: session.user.id, type: "PREMIUM_SUBSCRIPTION" },
    orderBy: { createdAt: "desc" },
    select: {
      midtransOrderId: true,
      status: true,
      amount: true,
      createdAt: true,
      paidAt: true,
      metadata: true,
    },
  });

  return NextResponse.json({
    db: {
      isPremium: user.isPremium,
      premiumExpiresAt: user.premiumExpiresAt,
      isActivePremium,
    },
    latestPayment,
  });
}
