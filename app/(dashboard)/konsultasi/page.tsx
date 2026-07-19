import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Calendar, ArrowRight, Clock, ClipboardList } from "lucide-react";
import { getInitials } from "@/lib/utils";
import { ConsultationRefresher } from "@/components/konsultasi/consultation-refresher";
import { getChatAccess } from "@/lib/consultation";
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
        take: 50, // bound the payload; add cursor pagination if lists grow past this
      })
    : await prisma.consultation.findMany({
        where: { parentId: session.user.id },
        include: {
          expert: { include: { user: { select: { name: true, image: true } } } },
          parent: { select: { name: true, image: true } },
          payment: { select: { id: true, status: true } },
        },
        orderBy: { scheduledAt: "desc" },
        take: 50,
      });

  return (
    <div className="space-y-6 animate-fade-in">
      <ConsultationRefresher />
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            {isExpert ? "Jadwal Konsultasi" : "Konsultasi Saya"}
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            {isExpert
              ? "Daftar konsultasi yang dijadwalkan dengan Anda"
              : "Riwayat dan jadwal konsultasi Anda"}
          </p>
        </div>
        {!isExpert && (
          <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
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
            const paid = c.payment?.status === "PAID";
            // Chat access is gated by the scheduled window, not payment time.
            const access = getChatAccess(effectiveStatus, c.scheduledAt, c.durationMins, paid);
            const scheduledLabel = c.scheduledAt.toLocaleString("id-ID", {
              weekday: "long",
              day: "numeric",
              month: "long",
              hour: "2-digit",
              minute: "2-digit",
            });

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

                {/* Chat access — gated by the scheduled window (lib/consultation) */}
                <div className="mt-3 pt-3 border-t border-sand-100">
                  {access === "open" && (
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
                  )}

                  {access === "before" && (
                    <div className="flex items-center gap-2 text-xs text-teal-dark">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Ruang chat terbuka sesuai jadwal: {scheduledLabel} WIB</span>
                    </div>
                  )}

                  {access === "after" && (
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="text-xs h-8 border-sand-300"
                    >
                      <Link href={`/konsultasi/${c.id}`}>
                        <MessageCircle className="w-3.5 h-3.5 mr-1.5" />
                        Lihat Riwayat Chat
                      </Link>
                    </Button>
                  )}

                  {access === "not_paid" && !isExpert && c.payment && (
                    <Button
                      asChild
                      size="sm"
                      className="bg-amber-500 hover:bg-amber-600 text-white text-xs h-8"
                    >
                      <Link href={`/konsultasi/${c.id}/bayar`}>Lanjutkan Pembayaran</Link>
                    </Button>
                  )}

                  {access === "not_paid" && isExpert && (
                    <div className="flex items-center gap-2 text-xs text-sand-400">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>Menunggu pembayaran dari orangtua.</span>
                    </div>
                  )}

                  {access === "cancelled" && (
                    <div className="flex items-center gap-2 text-xs text-sand-400">
                      <span>Konsultasi dibatalkan.</span>
                    </div>
                  )}

                  {/* Personal assessment — always reachable once paid, regardless
                      of the chat window. */}
                  {(access === "before" || access === "open" || access === "after") && (
                    <Link
                      href={`/konsultasi/${c.id}/asesmen-pribadi`}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs text-teal-dark hover:underline"
                    >
                      <ClipboardList className="w-3.5 h-3.5" />
                      {isExpert ? "Isi Asesmen Pribadi" : "Lihat Asesmen Pribadi"}
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
