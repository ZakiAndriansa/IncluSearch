import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { checkConsultationQuota } from "@/lib/quota-checker";
import { ChevronLeft, ChevronRight, CalendarCheck, Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kalender Konsultasi" };

const MONTHS_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];
const DOW_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function parseMonth(m?: string): { year: number; month: number } {
  const now = new Date();
  if (m && /^\d{4}-\d{2}$/.test(m)) {
    const [y, mo] = m.split("-").map(Number);
    if (mo >= 1 && mo <= 12) return { year: y, month: mo - 1 };
  }
  return { year: now.getFullYear(), month: now.getMonth() };
}

function monthParam(year: number, month: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}`;
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export default async function ParentCalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role === "EXPERT") redirect("/pakar/kalender");

  const { year, month } = parseMonth(searchParams.month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [quota, consultations] = await Promise.all([
    checkConsultationQuota(session.user.id),
    prisma.consultation.findMany({
      where: {
        parentId: session.user.id,
        scheduledAt: { gte: monthStart, lt: monthEnd },
        status: { in: ["PENDING_PAYMENT", "SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        status: true,
        expert: { select: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
  ]);

  const nextAvailable = quota.allowed ? null : quota.nextAvailableAt;

  // Group consultations by day
  const byDay = new Map<number, typeof consultations>();
  for (const c of consultations) {
    const day = new Date(c.scheduledAt).getDate();
    const arr = byDay.get(day) ?? [];
    arr.push(c);
    byDay.set(day, arr);
  }

  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const today = new Date();

  // A day is "locked" (can't book) if it's before the quota reset date.
  function isLocked(day: number) {
    if (!nextAvailable) return false;
    const d = new Date(year, month, day, 23, 59, 59);
    return d < new Date(nextAvailable);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            Kalender Konsultasi
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            Jadwal konsultasi Anda dan ketersediaan kuota.
          </p>
        </div>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white flex-shrink-0">
          <Link href="/cari-pakar">
            <Plus className="w-4 h-4 mr-1.5" />
            Konsultasi
          </Link>
        </Button>
      </div>

      {/* Quota banner */}
      {quota.isPremium ? (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3 flex items-center gap-2 text-sm text-amber-700">
          <CalendarCheck className="w-4 h-4" />
          Premium — konsultasi tanpa batas.
        </div>
      ) : quota.allowed ? (
        <div className="rounded-2xl bg-forest-50 border border-forest-200 px-4 py-3 flex items-center gap-2 text-sm text-forest-600">
          <CalendarCheck className="w-4 h-4" />
          Kuota konsultasi tersedia — Anda bisa memesan sekarang.
        </div>
      ) : (
        <div className="rounded-2xl bg-sand-100 border border-sand-200 px-4 py-3 flex items-center gap-2 text-sm text-sand-600">
          <Lock className="w-4 h-4" />
          Kuota habis. Konsultasi berikutnya tersedia mulai{" "}
          <strong className="text-forest-500">
            {nextAvailable ? formatDate(nextAvailable) : "-"}
          </strong>
          .
        </div>
      )}

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/kalender?month=${monthParam(prev.year, prev.month)}`}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-500"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-serif font-semibold text-forest-500">
            {MONTHS_ID[month]} {year}
          </h2>
          <Link
            href={`/kalender?month=${monthParam(next.year, next.month)}`}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-500"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </Link>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center">
          {DOW_SHORT.map((d) => (
            <div key={d} className="text-[11px] font-medium text-sand-400 py-1">
              {d}
            </div>
          ))}
          {cells.map((day, i) => {
            if (day === null) return <div key={`e-${i}`} />;
            const dayDate = new Date(year, month, day);
            const dayBookings = byDay.get(day) ?? [];
            const isTodayCell = sameDay(today, dayDate);
            const locked = isLocked(day) && dayBookings.length === 0;
            return (
              <div
                key={day}
                className={`min-h-[60px] rounded-lg border p-1.5 text-left ${
                  isTodayCell
                    ? "border-forest-500 border-2"
                    : locked
                    ? "border-sand-200 bg-sand-100/70"
                    : "border-sand-200"
                }`}
              >
                {isTodayCell ? (
                  <span
                    // Style lama (disimpan, tidak dihapus sesuai permintaan):
                    // className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-forest-500 text-white text-xs font-bold"
                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-forest-500 text-white border-2 border-forest-500 text-xs font-bold"
                  >
                    {day}
                  </span>
                ) : (
                  <span className={`text-xs font-medium ${locked ? "text-sand-400" : "text-sand-600"}`}>
                    {day}
                  </span>
                )}
                {dayBookings.length > 0 && (
                  <div className="mt-1 text-[10px] font-semibold rounded px-1 py-0.5 bg-teal-dark text-white truncate">
                    Konsultasi
                  </div>
                )}
                {locked && dayBookings.length === 0 && (
                  <Lock className="w-3 h-3 text-sand-400 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] text-sand-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-white border-2 border-forest-500" />
            Hari ini
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-dark" /> Ada konsultasi
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-sand-400" /> Terkunci (kuota 20 hari)
          </span>
        </div>
      </div>

      {/* Bookings list */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <h2 className="font-serif font-semibold text-forest-500 mb-3">Jadwal Bulan Ini</h2>
        {consultations.length === 0 ? (
          <p className="text-sand-400 text-sm">Tidak ada konsultasi pada bulan ini.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {consultations.map((c) => (
              <Link
                key={c.id}
                href={`/konsultasi/${c.id}`}
                className="flex items-center justify-between py-2.5 hover:bg-sand-50 -mx-2 px-2 rounded-lg"
              >
                <div>
                  <div className="text-sm font-medium text-forest-500">
                    {c.expert.user.name ?? "Pakar"}
                  </div>
                  <div className="text-xs text-sand-400">
                    {new Date(c.scheduledAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
                <span className="text-[11px] text-sand-400">{c.status}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
