"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, getInitials, SPECIALIZATION_LABELS } from "@/lib/utils";
import { CalendarDays, Clock, Star, AlertCircle, Crown, ArrowLeft } from "lucide-react";

const DAY_LABELS = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAY_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

const DURATION_OPTIONS = [
  { mins: 30, label: "30 menit" },
  { mins: 60, label: "1 jam" },
  { mins: 90, label: "1,5 jam" },
];

interface AvailabilitySlot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface Expert {
  id: string;
  hourlyRate: number;
  rating: number;
  totalReviews: number;
  specializations: string[];
  profilePhotoUrl: string | null;
  availabilitySlots: AvailabilitySlot[];
  user: { name: string | null; image: string | null };
}

interface BookingFormProps {
  expert: Expert;
  quotaAllowed: boolean;
  quotaMessage: string;
  nextAvailableAt: string | null;
  isPremium: boolean;
  clientKey: string;
}

function getNext7Days(slots: AvailabilitySlot[]) {
  const availableDays = new Set(slots.map((s) => s.dayOfWeek));
  const days: { date: Date; label: string; available: boolean }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (!availableDays.has(d.getDay())) continue;

    // Skip today if no time slots remain
    if (i === 0) {
      const todaySlots = getTimeSlotsForDay(slots, d.getDay(), true);
      if (todaySlots.length === 0) continue;
    }

    days.push({
      date: d,
      label: i === 0
        ? `Hari ini, ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`
        : `${DAY_SHORT[d.getDay()]}, ${d.getDate()} ${d.toLocaleDateString("id-ID", { month: "short" })}`,
      available: true,
    });

    if (days.length >= 7) break;
  }
  return days;
}

function getTimeSlotsForDay(slots: AvailabilitySlot[], dayOfWeek: number, isToday: boolean): string[] {
  const slot = slots.find((s) => s.dayOfWeek === dayOfWeek);
  if (!slot) return [];

  const times: string[] = [];
  const [startH, startM] = slot.startTime.split(":").map(Number);
  const [endH, endM] = slot.endTime.split(":").map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  const nowTotal = isToday
    ? new Date().getHours() * 60 + new Date().getMinutes()
    : 0;

  for (let t = startTotal; t + 30 <= endTotal; t += 60) {
    if (isToday && t + 30 <= nowTotal) continue;
    const h = Math.floor(t / 60).toString().padStart(2, "0");
    const m = (t % 60).toString().padStart(2, "0");
    times.push(`${h}:${m}`);
  }
  return times;
}

export function BookingForm({
  expert,
  quotaAllowed,
  quotaMessage,
  nextAvailableAt,
  isPremium,
  clientKey,
}: BookingFormProps) {
  const router = useRouter();
  const availableDays = getNext7Days(expert.availabilitySlots);

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [duration, setDuration] = useState(60);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isSelectedToday = selectedDate
    ? selectedDate.toDateString() === new Date().toDateString()
    : false;

  const timeSlots = selectedDate
    ? getTimeSlotsForDay(expert.availabilitySlots, selectedDate.getDay(), isSelectedToday)
    : [];

  const totalAmount = Math.round((expert.hourlyRate * duration) / 60);

  async function handleBook() {
    if (!selectedDate || !selectedTime) return;
    setLoading(true);
    setError(null);

    try {
      const [h, m] = selectedTime.split(":").map(Number);
      const scheduledAt = new Date(selectedDate);
      scheduledAt.setHours(h, m, 0, 0);

      const res = await fetch("/api/consultations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId: expert.id,
          scheduledAt: scheduledAt.toISOString(),
          durationMins: duration,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Terjadi kesalahan");
        return;
      }

      // Open Midtrans Snap
      const snap = (window as any).snap;
      if (snap) {
        snap.pay(data.paymentToken, {
          onSuccess: () => router.push(`/konsultasi/${data.consultationId}?status=success`),
          onPending: () => router.push(`/konsultasi/${data.consultationId}?status=pending`),
          onError: () => setError("Pembayaran gagal. Silakan coba lagi."),
          onClose: () => setLoading(false),
        });
      } else {
        // Fallback: redirect to Midtrans hosted page
        window.location.href = data.paymentUrl;
      }
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Midtrans Snap script */}
      <script
        src={
          process.env.NODE_ENV === "production"
            ? "https://app.midtrans.com/snap/snap.js"
            : "https://app.sandbox.midtrans.com/snap/snap.js"
        }
        data-client-key={clientKey}
        async
      />

      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Back */}
        <Link
          href={`/cari-pakar/${expert.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke profil pakar
        </Link>

        <h1 className="text-xl font-serif font-bold text-forest-500">
          Booking Konsultasi
        </h1>

        {/* Expert summary */}
        <div className="bg-white rounded-2xl border border-sand-200 p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14 ring-2 ring-sand-200 flex-shrink-0">
            <AvatarImage
              src={expert.profilePhotoUrl ?? expert.user.image ?? undefined}
              alt={expert.user.name ?? ""}
            />
            <AvatarFallback className="bg-forest-100 text-forest-500 text-lg font-bold">
              {getInitials(expert.user.name ?? "E")}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-forest-500 truncate">{expert.user.name}</p>
            <div className="flex items-center gap-1 mt-0.5">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-xs font-medium text-forest-500">{expert.rating.toFixed(1)}</span>
              <span className="text-xs text-sand-400">({expert.totalReviews})</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {expert.specializations.slice(0, 2).map((spec) => (
                <Badge key={spec} variant="secondary" className="text-[10px] bg-sand-100 text-sand-600 border-sand-200">
                  {SPECIALIZATION_LABELS[spec] ?? spec}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-sand-400">Tarif</p>
            <p className="text-sm font-bold text-forest-500">{formatCurrency(expert.hourlyRate)}<span className="text-xs font-normal text-sand-400">/jam</span></p>
          </div>
        </div>

        {/* Quota warning */}
        {!quotaAllowed && (
          <div className="rounded-xl border border-sand-300 bg-white p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-sand-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-sand-700">Kuota Habis</p>
              <p className="text-xs text-sand-500 mt-0.5">{quotaMessage}</p>
              {!isPremium && (
                <Link
                  href="/profil?tab=premium"
                  className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
                >
                  <Crown className="w-3 h-3" />
                  Upgrade Premium untuk konsultasi tak terbatas
                </Link>
              )}
            </div>
          </div>
        )}

        {/* Date picker */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-teal-dark" />
            <h2 className="font-semibold text-forest-500">Pilih Tanggal</h2>
          </div>
          {availableDays.length === 0 ? (
            <p className="text-sm text-sand-500">Pakar belum mengatur jadwal tersedia.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {availableDays.map(({ date, label }) => {
                const isSelected = selectedDate?.toDateString() === date.toDateString();
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`text-xs px-3 py-2 rounded-lg border transition-colors ${
                      isSelected
                        ? "bg-forest-500 text-white border-forest-500"
                        : "bg-sand-50 text-sand-700 border-sand-200 hover:border-teal-dark/40 hover:bg-sand-100"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Time picker */}
        {selectedDate && (
          <div className="bg-white rounded-2xl border border-sand-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-5 h-5 text-teal-dark" />
              <h2 className="font-semibold text-forest-500">Pilih Waktu</h2>
              <span className="text-xs text-sand-400">
                {DAY_LABELS[selectedDate.getDay()]},{" "}
                {selectedDate.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>
            {timeSlots.length === 0 ? (
              <p className="text-sm text-sand-500">
                Tidak ada slot tersedia untuk hari ini. Silakan pilih tanggal lain.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {timeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`text-xs px-4 py-2 rounded-lg border transition-colors ${
                        isSelected
                          ? "bg-forest-500 text-white border-forest-500"
                          : "bg-sand-50 text-sand-700 border-sand-200 hover:border-teal-dark/40 hover:bg-sand-100"
                      }`}
                    >
                      {time}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Duration */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h2 className="font-semibold text-forest-500 mb-3">Durasi Sesi</h2>
          <div className="flex gap-2">
            {DURATION_OPTIONS.map((opt) => (
              <button
                key={opt.mins}
                onClick={() => setDuration(opt.mins)}
                className={`flex-1 text-sm py-2.5 rounded-lg border transition-colors ${
                  duration === opt.mins
                    ? "bg-forest-500 text-white border-forest-500"
                    : "bg-sand-50 text-sand-700 border-sand-200 hover:border-teal-dark/40 hover:bg-sand-100"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Order summary + CTA */}
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          <h2 className="font-semibold text-forest-500 mb-4">Ringkasan</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-sand-600">
              <span>Pakar</span>
              <span className="font-medium text-forest-500">{expert.user.name}</span>
            </div>
            <div className="flex justify-between text-sand-600">
              <span>Tanggal</span>
              <span className="font-medium text-forest-500">
                {selectedDate
                  ? selectedDate.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between text-sand-600">
              <span>Waktu</span>
              <span className="font-medium text-forest-500">{selectedTime ?? "—"}</span>
            </div>
            <div className="flex justify-between text-sand-600">
              <span>Durasi</span>
              <span className="font-medium text-forest-500">
                {DURATION_OPTIONS.find((d) => d.mins === duration)?.label}
              </span>
            </div>
            <div className="border-t border-sand-100 pt-2 mt-2 flex justify-between">
              <span className="font-semibold text-forest-500">Total</span>
              <span className="font-bold text-forest-500 text-base">
                {formatCurrency(totalAmount)}
              </span>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
            </div>
          )}

          <Button
            onClick={handleBook}
            disabled={!selectedDate || !selectedTime || !quotaAllowed || loading}
            className="w-full mt-4 bg-forest-500 hover:bg-forest-600 text-white h-11 text-sm font-semibold"
          >
            {loading ? "Memproses..." : "Lanjutkan ke Pembayaran"}
          </Button>

          {!quotaAllowed && (
            <p className="text-center text-xs text-sand-400 mt-2">
              Selesaikan kuota konsultasi untuk melanjutkan
            </p>
          )}
        </div>
      </div>
    </>
  );
}
