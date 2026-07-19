import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTransactionStatus } from "@/lib/payments";
import { settlePayment } from "@/lib/settlement";
import { getChatAccess } from "@/lib/consultation";
import { ChatRoom } from "@/components/consultation/chat-room";
import { ConsultationHeader } from "@/components/consultation/consultation-header";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ClipboardList, Video } from "lucide-react";
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
      // Idempotent + transactional; also runs from the webhook and /sync.
      await settlePayment(returnOrderId);
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

  // Chat room only opens during the scheduled date+time window — NOT at payment
  // time. This gate is the single authority (mirrored by the messages API).
  const isPaid = consultation.payment?.status === "PAID";
  const access = getChatAccess(
    consultation.status,
    consultation.scheduledAt,
    consultation.durationMins,
    isPaid
  );

  const scheduledLabel = new Date(consultation.scheduledAt).toLocaleString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  if (access === "not_paid") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">⏳</div>
          <h3 className="font-semibold text-forest-500 mb-2">
            Menunggu Konfirmasi Pembayaran
          </h3>
          <p className="text-sand-500 text-sm">
            Ruang chat akan tersedia setelah pembayaran dikonfirmasi.
          </p>
        </div>
      </div>
    );
  }

  if (access === "cancelled") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">🚫</div>
          <h3 className="font-semibold text-forest-500 mb-2">Konsultasi Dibatalkan</h3>
          <p className="text-sand-500 text-sm">
            Ruang chat tidak tersedia karena konsultasi ini dibatalkan.
          </p>
        </div>
      </div>
    );
  }

  if (access === "before") {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-3">📅</div>
          <h3 className="font-semibold text-forest-500 mb-2">Ruang Chat Belum Dibuka</h3>
          <p className="text-sand-500 text-sm">
            Pembayaran Anda sudah terkonfirmasi. Ruang chat akan terbuka otomatis
            sesuai jadwal:
          </p>
          <p className="text-forest-500 font-medium text-sm mt-2">{scheduledLabel} WIB</p>
          <Button asChild variant="outline" className="mt-5 border-sand-300">
            <Link href={`/konsultasi/${consultation.id}/asesmen-pribadi`}>
              <ClipboardList className="w-4 h-4 mr-2" />
              {isParent ? "Lihat Asesmen Pribadi" : "Isi Asesmen Pribadi"}
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // access === "open" | "after" — ensure a room exists (defensive lazy create
  // for older paid consultations that never got one).
  if (!consultation.chatRoom) {
    const chatRoom = await prisma.chatRoom.create({ data: {} });
    await prisma.consultation.update({
      where: { id: consultation.id },
      data: { chatRoomId: chatRoom.id },
    });
    redirect(`/konsultasi/${consultation.id}`);
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] lg:h-[calc(100vh-7.5rem)] flex flex-col max-w-3xl mx-auto">
      <ConsultationHeader consultation={consultation} currentUserId={session.user.id} />
      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={`/konsultasi/${consultation.id}/asesmen-pribadi`}
          className="flex-1 flex items-center gap-2 rounded-xl border border-forest-200 bg-forest-50/50 px-4 py-2.5 text-sm text-forest-600 hover:bg-forest-50 transition-colors"
        >
          <ClipboardList className="w-4 h-4" />
          {isParent ? "Lihat Asesmen Pribadi dari pakar" : "Isi / Perbarui Asesmen Pribadi anak"}
        </Link>
        {access === "open" && (
          <Link
            href={`/konsultasi/${consultation.id}/vc`}
            className="flex items-center justify-center gap-2 rounded-xl border border-teal-dark/30 bg-teal-dark/5 px-4 py-2.5 text-sm text-teal-dark hover:bg-teal-dark/10 transition-colors"
          >
            <Video className="w-4 h-4" />
            Mulai Video Call
          </Link>
        )}
      </div>
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
