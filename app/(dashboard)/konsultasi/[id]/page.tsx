import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/payments";
import { ChatRoom } from "@/components/consultation/chat-room";
import { ConsultationHeader } from "@/components/consultation/consultation-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, CalendarDays, Clock } from "lucide-react";
import { CHALLENGE_TYPE_LABELS } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Ruang Konsultasi" };

export default async function ConsultationRoomPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { status?: string; order_id?: string };
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

  // Sync payment from Midtrans if user just returned from payment page
  const returnOrderId = searchParams.order_id ?? consultation.payment?.midtransOrderId;
  if (consultation.payment?.status !== "PAID" && returnOrderId) {
    const midtransStatus = await getTransactionStatus(returnOrderId);
    const isSettled =
      midtransStatus?.transaction_status === "settlement" ||
      (midtransStatus?.transaction_status === "capture" &&
        midtransStatus?.fraud_status === "accept");

    if (isSettled) {
      const updatedConsultation = await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "SCHEDULED", paidAt: new Date() },
        select: { scheduledAt: true },
      });
      await prisma.payment.update({
        where: { midtransOrderId: returnOrderId },
        data: { status: "PAID", paidAt: new Date() },
      });
      if (!consultation.chatRoom) {
        const chatRoom = await prisma.chatRoom.create({ data: {} });
        await prisma.consultation.update({
          where: { id: consultation.id },
          data: { chatRoomId: chatRoom.id },
        });
      }
      const { recordConsultation } = await import("@/lib/quota-checker");
      await recordConsultation(consultation.parentId, updatedConsultation.scheduledAt);
      // Re-fetch updated consultation
      redirect(`/konsultasi/${params.id}`);
    }
  }

  // Auto-complete consultation if scheduled end time has passed
  if (
    consultation.status === "SCHEDULED" ||
    consultation.status === "IN_PROGRESS"
  ) {
    const endTime = new Date(
      new Date(consultation.scheduledAt).getTime() + consultation.durationMins * 60 * 1000
    );
    if (new Date() > endTime) {
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { status: "COMPLETED" },
      });
      redirect(`/konsultasi/${params.id}`);
    }
  }

  // Auto-activate chat room if: today is consultation day, payment confirmed, no chatRoom yet
  if (!consultation.chatRoom) {
    const isPaid = consultation.payment?.status === "PAID";
    const scheduledDate = new Date(consultation.scheduledAt);
    const today = new Date();
    const isToday =
      today.getFullYear() === scheduledDate.getFullYear() &&
      today.getMonth() === scheduledDate.getMonth() &&
      today.getDate() === scheduledDate.getDate();

    if (isPaid && isToday) {
      const chatRoom = await prisma.chatRoom.create({ data: {} });
      await prisma.consultation.update({
        where: { id: consultation.id },
        data: { chatRoomId: chatRoom.id },
      });
      redirect(`/konsultasi/${consultation.id}`);
    }

    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-sand-50 border border-sand-200 flex items-center justify-center mx-auto mb-3">
            {isPaid ? <CalendarDays className="w-7 h-7 text-forest-400" /> : <Clock className="w-7 h-7 text-amber-400" />}
          </div>
          <h3 className="font-semibold text-forest-500 mb-2">
            {isPaid ? "Ruang Chat Belum Tersedia" : "Menunggu Konfirmasi Pembayaran"}
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
    <div className="h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-7.5rem)] flex flex-col max-w-3xl mx-auto">
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
        imageOverrides={{
          [consultation.expert.user.id]: consultation.expert.profilePhotoUrl ?? consultation.expert.user.image,
          [consultation.parent.id]: consultation.parent.image,
        }}
      />
    </div>
  );
}
