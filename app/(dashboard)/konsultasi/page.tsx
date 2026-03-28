import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Calendar, ArrowRight } from "lucide-react";
import { getInitials } from "@/lib/utils";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Konsultasi Saya" };

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  PENDING_PAYMENT: { label: "Menunggu Pembayaran", color: "bg-amber-100 text-amber-700 border-amber-200" },
  SCHEDULED: { label: "Terjadwal", color: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "Berlangsung", color: "bg-forest-50 text-forest-500 border-forest-100" },
  COMPLETED: { label: "Selesai", color: "bg-sand-100 text-sand-600 border-sand-200" },
  CANCELLED: { label: "Dibatalkan", color: "bg-red-100 text-red-600 border-red-200" },
  REFUNDED: { label: "Dikembalikan", color: "bg-sand-100 text-sand-500 border-sand-200" },
};

function isToday(date: Date) {
  const now = new Date();
  return (
    now.getFullYear() === date.getFullYear() &&
    now.getMonth() === date.getMonth() &&
    now.getDate() === date.getDate()
  );
}

export default async function KonsultasiPage() {
  const session = await auth();
  if (!session) return null;

  const consultations = await prisma.consultation.findMany({
    where: { parentId: session.user.id },
    include: {
      expert: {
        include: { user: { select: { name: true, image: true } } },
      },
      payment: { select: { id: true, status: true } },
    },
    orderBy: { scheduledAt: "desc" },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-500">
            Konsultasi Saya
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            Riwayat dan jadwal konsultasi Anda
          </p>
        </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
          <Link href="/cari-pakar">
            <MessageCircle className="w-4 h-4 mr-2" />
            Konsultasi Baru
          </Link>
        </Button>
      </div>

      {consultations.length === 0 ? (
        <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center">
          <div className="text-5xl mb-4">💬</div>
          <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
            Belum ada konsultasi
          </h3>
          <p className="text-sand-500 text-sm mb-6 max-w-sm mx-auto">
            Mulai konsultasi pertama Anda dengan pakar ortopedagogik terpercaya.
          </p>
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
            <Link href="/cari-pakar">Cari Pakar Sekarang</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const effectiveStatus =
              c.status === "PENDING_PAYMENT" && c.payment?.status === "PAID"
                ? "SCHEDULED"
                : c.status;
            const status = STATUS_LABELS[effectiveStatus];
            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-sand-200 hover:border-teal-dark/30 hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarImage src={c.expert.user.image ?? undefined} />
                      <AvatarFallback className="bg-forest-100 text-forest-500 font-semibold">
                        {getInitials(c.expert.user.name ?? "P")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-forest-500 text-sm">
                        {c.expert.user.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={`text-[10px] border ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-forest-500">
                      {formatCurrency(c.totalAmount)}
                    </div>
                    <div className="text-xs text-sand-400 mt-0.5">
                      {c.durationMins} menit
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-3 text-xs text-sand-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDateTime(c.scheduledAt)}</span>
                </div>

                {(c.status === "SCHEDULED" || c.status === "IN_PROGRESS" || c.chatRoomId) && (
                  <div className="mt-3 pt-3 border-t border-sand-100">
                    <Button
                      asChild
                      size="sm"
                      className="bg-forest-500 hover:bg-forest-600 text-white text-xs h-8"
                    >
                      <Link href={`/konsultasi/${c.id}`}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Buka Ruang Chat
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                )}

                {c.status === "PENDING_PAYMENT" && !c.chatRoomId && isToday(c.scheduledAt) && c.payment && (
                  <div className="mt-3 pt-3 border-t border-sand-100">
                    <Button
                      asChild
                      size="sm"
                      className="bg-teal-600 hover:bg-teal-700 text-white text-xs h-8"
                    >
                      <Link href={`/konsultasi/${c.id}`}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Masuk ke Konsultasi
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </Link>
                    </Button>
                  </div>
                )}

                {c.status === "PENDING_PAYMENT" && !isToday(c.scheduledAt) && c.payment?.status === "PAID" && (
                  <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-2 text-xs text-blue-600">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>
                      Pembayaran terkonfirmasi. Ruang chat terbuka pada hari konsultasi.
                    </span>
                  </div>
                )}

                {c.status === "PENDING_PAYMENT" && !isToday(c.scheduledAt) && c.payment?.status !== "PAID" && c.payment && (
                  <div className="mt-3 pt-3 border-t border-sand-100">
                    <Button
                      asChild
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                    >
                      <Link href={`/konsultasi/${c.id}/bayar`}>
                        Lanjutkan Pembayaran
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
