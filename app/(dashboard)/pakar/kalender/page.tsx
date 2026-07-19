import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrCreateExpertProfile } from "@/lib/expert";
import { formatCurrency } from "@/lib/utils";
import { getExpertBalance, expertPayout, PLATFORM_COMMISSION_RATE } from "@/lib/finance";
import { ChevronLeft, ChevronRight, CalendarDays, Clock, Wallet, CheckCircle2, Hourglass } from "lucide-react";
import { CalendarDay } from "@/components/shared/calendar-day";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kalender & Gaji" };

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

export default async function ExpertCalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== "EXPERT") redirect("/");

  const profile = await getOrCreateExpertProfile(session.user.id);
  const { year, month } = parseMonth(searchParams.month);

  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const bookings = await prisma.consultation.findMany({
    where: {
      expertId: profile.id,
      scheduledAt: { gte: monthStart, lt: monthEnd },
      status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
    },
    select: {
      id: true,
      scheduledAt: true,
      durationMins: true,
      status: true,
      totalAmount: true,
      parent: { select: { name: true } },
    },
    orderBy: { scheduledAt: "asc" },
  });

  const completed = bookings.filter((b) => b.status === "COMPLETED");
  const upcoming = bookings.filter((b) => b.status !== "COMPLETED");
  const totalMinutes = completed.reduce((a, b) => a + b.durationMins, 0);
  const monthGross = completed.reduce((a, b) => a + b.totalAmount, 0);
  const monthNet = expertPayout(monthGross); // 87% after platform commission
  const totalHours = (totalMinutes / 60).toFixed(totalMinutes % 60 === 0 ? 0 : 1);

  // All-time payout balance (owed net / paid / outstanding)
  const balance = await getExpertBalance(profile.id);

  // Group bookings by day-of-month
  const byDay = new Map<number, typeof bookings>();
  for (const b of bookings) {
    const day = new Date(b.scheduledAt).getDate();
    const arr = byDay.get(day) ?? [];
    arr.push(b);
    byDay.set(day, arr);
  }

  const firstWeekday = monthStart.getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const prev = month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 };
  const next = month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 };
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
          Kalender &amp; Gaji
        </h1>
        <p className="text-sand-500 text-sm mt-1">
          Ringkasan pertemuan dan pendapatan Anda per bulan.
        </p>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <CalendarDays className="w-5 h-5 mb-2 text-forest-500" />
          <div className="text-xl font-bold text-forest-500">{completed.length}</div>
          <div className="text-xs text-sand-500 mt-0.5">Pertemuan selesai bulan ini</div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <Clock className="w-5 h-5 mb-2 text-teal-dark" />
          <div className="text-xl font-bold text-forest-500">{totalHours} jam</div>
          <div className="text-xs text-sand-500 mt-0.5">Total durasi konsultasi</div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <Wallet className="w-5 h-5 mb-2 text-amber-500" />
          <div className="text-xl font-bold text-forest-500">{formatCurrency(monthNet)}</div>
          <div className="text-xs text-sand-500 mt-0.5">
            Pendapatan bersih bulan ini (setelah komisi {Math.round(PLATFORM_COMMISSION_RATE * 100)}%)
          </div>
        </div>
      </div>

      {/* Payout balance (all time) */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <h2 className="font-serif font-semibold text-forest-500 mb-3">Saldo Pembayaran</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <div className="text-lg font-bold text-forest-500">{formatCurrency(balance.owed)}</div>
            <div className="text-xs text-sand-500 mt-0.5">Total hak Anda (net, keseluruhan)</div>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-lg font-bold text-forest-500">{formatCurrency(balance.paid)}</div>
              <div className="text-xs text-sand-500 mt-0.5">Sudah dibayar</div>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Hourglass className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <div className={`text-lg font-bold ${balance.outstanding > 0 ? "text-amber-600" : "text-forest-500"}`}>
                {formatCurrency(balance.outstanding)}
              </div>
              <div className="text-xs text-sand-500 mt-0.5">
                {balance.outstanding > 0 ? "Belum dibayar" : "Lunas 🎉"}
              </div>
            </div>
          </div>
        </div>
        <p className="text-[11px] text-sand-400 mt-3">
          Pembayaran diproses & dicatat manual oleh admin setelah transfer.
        </p>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-2xl border border-sand-200 p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={`/pakar/kalender?month=${monthParam(prev.year, prev.month)}`}
            className="p-2 rounded-lg hover:bg-sand-100 text-sand-500"
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <h2 className="font-serif font-semibold text-forest-500">
            {MONTHS_ID[month]} {year}
          </h2>
          <Link
            href={`/pakar/kalender?month=${monthParam(next.year, next.month)}`}
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
            const dayBookings = byDay.get(day) ?? [];
            const isToday = isCurrentMonth && today.getDate() === day;
            const sessions = dayBookings.map((b) => ({
              id: b.id,
              time: new Date(b.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
              title: b.parent.name ?? "Orang tua",
              subtitle: `${b.durationMins} menit · ${b.status === "COMPLETED" ? "Selesai" : "Terjadwal"}`,
            }));
            return (
              <CalendarDay
                key={day}
                day={day}
                isToday={isToday}
                sessions={sessions}
                dateLabel={`${day} ${MONTHS_ID[month]}`}
              />
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-4 text-[11px] text-sand-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-forest-500" /> Hari ini
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-teal-dark" /> Ada sesi — klik untuk detail
          </span>
        </div>
      </div>

      {/* Upcoming list */}
      <div className="bg-white rounded-2xl border border-sand-200 p-5">
        <h2 className="font-serif font-semibold text-forest-500 mb-3">
          Jadwal Bulan Ini
        </h2>
        {bookings.length === 0 ? (
          <p className="text-sand-400 text-sm">Tidak ada konsultasi pada bulan ini.</p>
        ) : (
          <div className="divide-y divide-sand-100">
            {bookings.map((b) => (
              <div key={b.id} className="flex items-center justify-between py-2.5">
                <div>
                  <div className="text-sm font-medium text-forest-500">
                    {b.parent.name ?? "Orang tua"}
                  </div>
                  <div className="text-xs text-sand-400">
                    {new Date(b.scheduledAt).toLocaleString("id-ID", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · {b.durationMins} menit
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-forest-500">
                    {formatCurrency(b.totalAmount)}
                  </div>
                  <div className="text-[11px] text-sand-400">
                    {b.status === "COMPLETED" ? "Selesai" : "Terjadwal"}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <p className="text-xs text-sand-400">
        Upcoming: {upcoming.length} sesi terjadwal belum selesai.
      </p>
    </div>
  );
}
