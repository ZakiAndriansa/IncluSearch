import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkConsultationQuota } from "@/lib/quota-checker";
import {
  createConsultationTransaction,
  MIDTRANS_CLIENT_KEY,
} from "@/lib/payments";
import { generateOrderId } from "@/lib/utils";
import { z } from "zod";

const CreateConsultationSchema = z.object({
  expertId: z.string(),
  scheduledAt: z.string().datetime(),
  durationMins: z.number().int().min(30).max(120).default(60),
});

/** Thrown inside the create transaction when an unpaid booking already exists. */
class PendingBookingError extends Error {}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await request.json();
    const data = CreateConsultationSchema.parse(body);

    // Booking must be for a future slot.
    if (new Date(data.scheduledAt).getTime() <= Date.now()) {
      return NextResponse.json(
        { error: "Waktu konsultasi harus di masa depan" },
        { status: 400 }
      );
    }

    // Check quota for free users
    const quota = await checkConsultationQuota(session.user.id);
    if (!quota.allowed) {
      return NextResponse.json(
        { error: quota.message, nextAvailableAt: quota.nextAvailableAt },
        { status: 403 }
      );
    }

    // Get expert pricing
    const expert = await prisma.expertProfile.findUnique({
      where: { id: data.expertId, isAvailable: true },
      include: { user: { select: { name: true } } },
    });

    if (!expert) {
      return NextResponse.json({ error: "Expert not found" }, { status: 404 });
    }

    const totalAmount = Math.round((expert.hourlyRate * data.durationMins) / 60);
    const orderId = generateOrderId("CON");

    // Create consultation + payment in transaction
    const { consultation, payment } = await prisma.$transaction(async (tx) => {
      // Defensive re-check inside the transaction to narrow the booking race.
      const outstanding = await tx.consultation.findFirst({
        where: {
          parentId: session.user.id,
          status: "PENDING_PAYMENT",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        select: { id: true },
      });
      if (outstanding) {
        throw new PendingBookingError();
      }

      const consultation = await tx.consultation.create({
        data: {
          parentId: session.user.id,
          expertId: data.expertId,
          scheduledAt: new Date(data.scheduledAt),
          durationMins: data.durationMins,
          totalAmount,
          status: "PENDING_PAYMENT",
        },
      });

      const payment = await tx.payment.create({
        data: {
          userId: session.user.id,
          consultationId: consultation.id,
          type: "CONSULTATION",
          amount: totalAmount,
          midtransOrderId: orderId,
        },
      });

      return { consultation, payment };
    });

    // Create Midtrans payment token
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    const snapResult = await createConsultationTransaction({
      orderId,
      amount: totalAmount,
      customerName: user?.name ?? "Pengguna",
      customerEmail: user?.email ?? "",
      customerPhone: user?.phone ?? undefined,
      consultationId: consultation.id,
      expertName: expert.user.name ?? "Pakar",
      scheduledAt: new Date(data.scheduledAt),
    });

    // Save token to payment record
    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        midtransToken: snapResult.token,
        midtransUrl: snapResult.redirect_url,
      },
    });

    return NextResponse.json({
      consultationId: consultation.id,
      paymentToken: snapResult.token,
      paymentUrl: snapResult.redirect_url,
      clientKey: MIDTRANS_CLIENT_KEY,
    }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof PendingBookingError) {
      return NextResponse.json(
        { error: "Anda masih memiliki konsultasi yang menunggu pembayaran." },
        { status: 409 }
      );
    }
    console.error("[CONSULTATION CREATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1") || 1);
  const perPage = Math.min(50, Math.max(1, parseInt(searchParams.get("perPage") ?? "20") || 20));

  const [consultations, total] = await Promise.all([
    prisma.consultation.findMany({
      where: { parentId: session.user.id },
      include: {
        expert: {
          include: { user: { select: { name: true, image: true } } },
        },
      },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.consultation.count({ where: { parentId: session.user.id } }),
  ]);

  return NextResponse.json({
    consultations,
    pagination: { page, perPage, total, totalPages: Math.ceil(total / perPage) },
  });
}
