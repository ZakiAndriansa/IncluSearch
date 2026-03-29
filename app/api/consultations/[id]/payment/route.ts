import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createConsultationTransaction, MIDTRANS_CLIENT_KEY } from "@/lib/payments";
import { generateOrderId } from "@/lib/utils";

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const consultation = await prisma.consultation.findFirst({
    where: { id: params.id, parentId: session.user.id, status: "PENDING_PAYMENT" },
    include: {
      expert: { include: { user: { select: { name: true } } } },
      payment: true,
    },
  });

  if (!consultation) {
    return NextResponse.json({ error: "Konsultasi tidak ditemukan" }, { status: 404 });
  }

  let token = consultation.payment?.midtransToken ?? null;
  let url = consultation.payment?.midtransUrl ?? null;

  // Regenerate Midtrans token if missing (e.g. previous booking attempt failed)
  if (!token) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, phone: true },
    });

    const orderId = consultation.payment?.midtransOrderId ?? generateOrderId("CON");

    try {
      const snapResult = await createConsultationTransaction({
        orderId,
        amount: consultation.totalAmount,
        customerName: user?.name ?? "Pengguna",
        customerEmail: user?.email ?? "",
        customerPhone: user?.phone ?? undefined,
        consultationId: consultation.id,
        expertName: consultation.expert.user.name ?? "Pakar",
        scheduledAt: consultation.scheduledAt,
      });

      token = snapResult.token;
      url = snapResult.redirect_url;

      // Upsert payment with the new token
      if (consultation.payment) {
        await prisma.payment.update({
          where: { id: consultation.payment.id },
          data: { midtransToken: token, midtransUrl: url, midtransOrderId: orderId },
        });
      } else {
        await prisma.payment.create({
          data: {
            userId: session.user.id,
            consultationId: consultation.id,
            type: "CONSULTATION",
            amount: consultation.totalAmount,
            midtransOrderId: orderId,
            midtransToken: token,
            midtransUrl: url,
          },
        });
      }
    } catch (err) {
      console.error("[PAYMENT REGENERATE]", err);
      return NextResponse.json({ error: "Gagal memuat token pembayaran" }, { status: 500 });
    }
  }

  const orderId = consultation.payment?.midtransOrderId;

  return NextResponse.json({
    token,
    url,
    orderId,
    clientKey: MIDTRANS_CLIENT_KEY,
    expertName: consultation.expert.user.name ?? "Pakar",
    amount: consultation.totalAmount,
    scheduledAt: new Intl.DateTimeFormat("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(consultation.scheduledAt)),
  });
}
