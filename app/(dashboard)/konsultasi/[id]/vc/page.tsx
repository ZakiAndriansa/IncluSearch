import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getChatAccess, getJitsiRoom } from "@/lib/consultation";
import { VideoCall } from "@/components/consultation/video-call";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Video Call" };

export default async function VideoCallPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      parentId: true,
      status: true,
      scheduledAt: true,
      durationMins: true,
      expert: { select: { userId: true } },
    },
  });
  if (!consultation) notFound();

  const isParticipant =
    consultation.parentId === session.user.id ||
    consultation.expert.userId === session.user.id;
  if (!isParticipant) notFound();

  const access = getChatAccess(
    consultation.status,
    consultation.scheduledAt,
    consultation.durationMins,
    consultation.status !== "PENDING_PAYMENT"
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      <Link
        href={`/konsultasi/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Konsultasi
      </Link>

      {access === "open" ? (
        <VideoCall
          roomName={getJitsiRoom(consultation.id)}
          displayName={session.user.name ?? "Pengguna"}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 p-10 text-center">
          <div className="text-4xl mb-3">🎥</div>
          <h3 className="font-semibold text-forest-500 mb-1">
            Video Call Belum Tersedia
          </h3>
          <p className="text-sand-500 text-sm">
            Video call hanya aktif selama jadwal konsultasi berlangsung.
          </p>
        </div>
      )}
    </div>
  );
}
