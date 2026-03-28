import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Calendar, ArrowRight, Clock } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ConsultationRefresher } from "@/components/konsultasi/consultation-refresher";
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

  const isExpert = session.user.role === "EXPERT";

  // Expert: lihat konsultasi yang masuk ke mereka
  // Parent: lihat konsultasi yang mereka buat
  const consultations = isExpert
    ? await prisma.consultation.findMany({
        where: {
          expert: { userId: session.user.id },
          status: { not: "PENDING_PAYMENT" },
        },
        include: {
          parent: { select: { name: true, image: true } },
          expert: { include: { user: { select: { name: true, image: true } } } },
          payment: { select: { id: true, status: true } },
        },
        orderBy: { scheduledAt: "asc" },
      })
    : await prisma.consultation.findMany({
        where: { parentId: session.user.id },
        include: {
          expert: { include: { user: { select: { name: true, image: true } } } },
          parent: { select: { name: true, image: true } },
          payment: { select: { id: true, status: true } },
        },
        orderBy: { scheduledAt: "desc" },
      });

  return (
    <div className="space-y-6 animate-fade-in">
      <ConsultationRefresher />
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-forest-500">
            {isExpert ? "Jadwal Konsultasi" : "Konsultasi Saya"}
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            {isExpert
              ? "Daftar konsultasi yang dijadwalkan dengan Anda"
              : "Riwayat dan jadwal konsultasi Anda"}
          </p>
        </div>
        {!isExpert && (
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
            <Link href="/cari-pakar">
              <MessageCircle className="w-4 h-4 mr-2" />
              Konsultasi Baru
            </Link>
          </Button>
        )}
      </div>

      {consultations.length === 0 ? (
        <div className="rounded-2xl border border-sand-200 bg-white p-12 text-center">
          <div className="text-5xl mb-4">{isExpert ? "📅" : "💬"}</div>
          <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
            {isExpert ? "Belum ada jadwal konsultasi" : "Belum ada konsultasi"}
          </h3>
          <p className="text-sand-500 text-sm mb-6 max-w-sm mx-auto">
            {isExpert
              ? "Konsultasi dari orangtua akan muncul di sini setelah mereka melakukan pemesanan."
              : "Mulai konsultasi pertama Anda dengan pakar ortopedagogik terpercaya."}
          </p>
          {!isExpert && (
            <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
              <Link href="/cari-pakar">Cari Pakar Sekarang</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {consultations.map((c) => {
            const otherPerson = isExpert ? c.parent : c.expert.user;
            const effectiveStatus =
              c.status === "PENDING_PAYMENT" && c.payment?.status === "PAID"
                ? "SCHEDULED"
                : c.status;
            const status = STATUS_LABELS[effectiveStatus];
            const todayConsult = isToday(c.scheduledAt);
            const canOpenChat =
              c.chatRoomId &&
              (c.status === "SCHEDULED" || c.status === "IN_PROGRESS");

            return (
              <div
                key={c.id}
                className="bg-white rounded-2xl border border-sand-200 hover:border-teal-dark/30 hover:shadow-sm transition-all p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-11 h-11">
                      <AvatarFallback className="bg-forest-100 text-forest-500 font-semibold">
                        {getInitials(otherPerson?.name ?? "P")}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-forest-500 text-sm">
                        {otherPerson?.name}
                      </h3>
                      {isExpert && (
                        <p className="text-xs text-sand-400">Orangtua / Wali</p>
                      )}
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

                {/* Expert: tampil info menunggu chat atau tombol buka chat */}
                {isExpert && canOpenChat && (
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

                {isExpert && !canOpenChat && todayConsult && (
                  <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-2 text-xs text-teal-dark">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Konsultasi hari ini — menunggu konfirmasi dari orangtua.</span>
                  </div>
                )}

                {isExpert && !canOpenChat && !todayConsult && (
                  <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-2 text-xs text-sand-400">
                    <Clock className="w-3.5 h-3.5 shrink-0" />
                    <span>Ruang chat terbuka pada hari konsultasi.</span>
                  </div>
                )}

                {/* Parent: tombol aksi */}
                {!isExpert && canOpenChat && (
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

                {!isExpert && c.status === "PENDING_PAYMENT" && !c.chatRoomId && todayConsult && c.payment && (
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

                {!isExpert && c.status === "PENDING_PAYMENT" && !todayConsult && c.payment?.status === "PAID" && (
                  <div className="mt-3 pt-3 border-t border-sand-100 flex items-center gap-2 text-xs text-blue-600">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>Pembayaran terkonfirmasi. Ruang chat terbuka pada hari konsultasi.</span>
                  </div>
                )}

                {!isExpert && c.status === "PENDING_PAYMENT" && !todayConsult && c.payment?.status !== "PAID" && c.payment && (
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
