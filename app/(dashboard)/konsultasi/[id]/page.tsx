import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/payments";
import { ChatRoom } from "@/components/consultation/chat-room";
import { ConsultationHeader } from "@/components/consultation/consultation-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList } from "lucide-react";
import { CHALLENGE_TYPE_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ruang Konsultasi" };

export default async function ConsultationRoomPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const consultation = await prisma.consultation.findFirst({
    where: {
      id: params.id,
      OR: [
        { parentId: session.user.id },
        { expert: { userId: session.user.id } },
      ],
    },
    include: {
      parent: { select: { id: true, name: true, image: true } },
      expert: {
        include: { user: { select: { id: true, name: true, image: true } } },
      },
      payment: { select: { midtransOrderId: true, status: true } },
      chatRoom: {
        include: {
          messages: {
            include: {
              sender: { select: { id: true, name: true, image: true } },
            },
            orderBy: { sentAt: "asc" },
            take: 50,
          },
        },
      },
    },
  });

  if (!consultation) notFound();

  // Fetch asesmen aktif orang tua
  const parentAssessment = await prisma.assessment.findFirst({
    where: { userId: consultation.parentId, isActive: true },
    select: {
      childName: true,
      childAge: true,
      challengeType: true,
      challengeDetails: true,
      learningEnv: true,
      goals: true,
      locationPref: true,
    },
  });

  // Parents must have at least one active assessment to access chat
  const isParent = consultation.parentId === session.user.id;
  if (isParent) {
    const hasAssessment = await prisma.assessment.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: { id: true },
    });
    if (!hasAssessment) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-3 max-w-sm">
            <div className="text-4xl">📋</div>
            <h3 className="font-semibold text-forest-500">
              Lengkapi Asesmen Terlebih Dahulu
            </h3>
            <p className="text-sand-500 text-sm">
              Anda perlu mengisi asesmen anak sebelum dapat mengakses ruang
              konsultasi.
            </p>
            <Button
              asChild
              className="bg-forest-500 hover:bg-forest-600 text-white"
            >
              <Link href="/profil?tab=asesmen">Isi Asesmen Sekarang</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  // Auto-activate chat room if: today is consultation day, no chatRoom yet,
  // and payment is confirmed (either locally or via Midtrans status check)
  if (!consultation.chatRoom) {
    const today = new Date();
    const scheduledDate = new Date(consultation.scheduledAt);
    const isToday =
      today.getFullYear() === scheduledDate.getFullYear() &&
      today.getMonth() === scheduledDate.getMonth() &&
      today.getDate() === scheduledDate.getDate();

    let paymentConfirmed = consultation.payment?.status === "PAID";

    if (!paymentConfirmed && consultation.payment?.midtransOrderId) {
      const midtransStatus = await getTransactionStatus(
        consultation.payment.midtransOrderId
      );
      paymentConfirmed =
        midtransStatus?.transaction_status === "settlement" ||
        (midtransStatus?.transaction_status === "capture" &&
          midtransStatus?.fraud_status === "accept");

      if (paymentConfirmed) {
        await prisma.payment.update({
          where: { midtransOrderId: consultation.payment.midtransOrderId },
          data: { status: "PAID", paidAt: new Date() },
        });
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: { status: "SCHEDULED", paidAt: new Date() },
        });
      }
    }

    if (isToday && paymentConfirmed) {
      const chatRoom = await prisma.chatRoom.create({ data: {} });
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { chatRoomId: chatRoom.id, status: "SCHEDULED", paidAt: new Date() },
      });
      // Re-fetch with chatRoom
      redirect(`/konsultasi/${consultation.id}`);
    }

    const isPaid = consultation.payment?.status === "PAID" || paymentConfirmed;
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="text-4xl mb-3">{isPaid ? "📅" : "⏳"}</div>
          <h3 className="font-semibold text-forest-500 mb-2">
            {isPaid
              ? "Ruang Chat Belum Tersedia"
              : "Menunggu Konfirmasi Pembayaran"}
          </h3>
          <p className="text-sand-500 text-sm">
            {isPaid
              ? `Ruang chat akan terbuka pada hari konsultasi (${scheduledDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}).`
              : "Ruang chat akan tersedia setelah pembayaran dikonfirmasi."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col max-w-3xl mx-auto">
      <ConsultationHeader consultation={consultation} currentUserId={session.user.id} />
      {!isParent && parentAssessment && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3 text-sm">
          <ClipboardList className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0">
            <div className="font-semibold text-amber-700">
              Asesmen: {parentAssessment.childName}, {parentAssessment.childAge} tahun
            </div>
            <div className="text-amber-600 text-xs">
              {CHALLENGE_TYPE_LABELS[parentAssessment.challengeType] ?? parentAssessment.challengeType}
              {parentAssessment.goals.length > 0 && ` · Tujuan: ${parentAssessment.goals.slice(0, 3).join(", ")}`}
            </div>
            {parentAssessment.challengeDetails && (
              <div className="text-amber-600 text-xs line-clamp-2">{parentAssessment.challengeDetails}</div>
            )}
          </div>
        </div>
      )}
      <ChatRoom
        roomId={consultation.chatRoom.id}
        initialMessages={consultation.chatRoom.messages}
        currentUser={{
          id: session.user.id,
          name: session.user.name ?? "Pengguna",
          image: session.user.image ?? null,
        }}
        consultationStatus={consultation.status}
      />
    </div>
  );
}
