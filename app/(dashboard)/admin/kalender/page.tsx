import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ChevronLeft, ChevronRight, CalendarDays, LayoutList } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kalender Booking" };

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

export default async function AdminCalendarPage({
  searchParams,
}: {
  searchParams: { month?: string; view?: string };
}) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const view = searchParams.view === "timetable" ? "timetable" : "calendar";
  const { year, month } = parseMonth(searchParams.month);
  const monthStart = new Date(year, month, 1);
  const monthEnd = new Date(year, month + 1, 1);

  const [consults, experts] = await Promise.all([
    prisma.consultation.findMany({
      where: {
        scheduledAt: { gte: monthStart, lt: monthEnd },
        status: { in: ["SCHEDULED", "IN_PROGRESS", "COMPLETED"] },
      },
      select: {
        id: true,
        scheduledAt: true,
        durationMins: true,
        status: true,
        parent: { select: { name: true } },
        expertId: true,
        expert: { select: { user: { select: { name: true } } } },
      },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.expertProfile.findMany({
      where: { isVerified: true },
      select: { id: true, user: { select: { name: true } } },
    }),
  ]);

  const activeIds = new Set(consults.map((c) => c.expertId));
  const activeExperts = experts.filter((e) => activeIds.has(e.id));
  const inactiveExperts = experts.filter((e) => !activeIds.has(e.id));

  // Group by day
  const byDay = new Map<number, typeof consults>();
  for (const c of consults) {
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
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const qs = (v: string, m: string) => `/admin/kalender?view=${v}&month=${m}`;
  const curMonth = monthParam(year, month);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">
            Kalender Booking
          </h1>
          <p className="text-sand-500 text-sm mt-1">
            Semua konsultasi lintas pakar · {consults.length} sesi bulan ini.
          </p>
        </div>
        {/* View toggle */}
        <div className="flex rounded-lg border border-sand-200 overflow-hidden text-sm">
          <Link
            href={qs("calendar", curMonth)}
            className={`px-3 py-1.5 flex items-center gap-1.5 ${
              view === "calendar" ? "bg-forest-500 text-white" : "text-sand-600 hover:bg-sand-100"
            }`}
          >
            <CalendarDays className="w-4 h-4" /> Kalender
          </Link>
          <Link
            href={qs("timetable", curMonth)}
            className={`px-3 py-1.5 flex items-center gap-1.5 ${
              view === "timetable" ? "bg-forest-500 text-white" : "text-sand-600 hover:bg-sand-100"
            }`}
          >
            <LayoutList className="w-4 h-4" /> Timetable
          </Link>
        </div>
      </div>

      {/* Expert status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <div className="text-sm font-semibold text-forest-500 mb-2">
            Pakar Aktif Bulan Ini · {activeExperts.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {activeExperts.length === 0 ? (
              <span className="text-xs text-sand-400">Tidak ada.</span>
            ) : (
              activeExperts.map((e) => (
                <span key={e.id} className="text-[11px] px-2 py-0.5 rounded-full bg-forest-50 text-forest-600 border border-forest-200">
                  {e.user.name}
                </span>
              ))
            )}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-sand-200 p-4">
          <div className="text-sm font-semibold text-forest-500 mb-2">
            Pakar Non-aktif · {inactiveExperts.length}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {inactiveExperts.length === 0 ? (
              <span className="text-xs text-sand-400">Semua pakar aktif.</span>
            ) : (
              inactiveExperts.map((e) => (
                <span key={e.id} className="text-[11px] px-2 py-0.5 rounded-full bg-sand-100 text-sand-500 border border-sand-200">
                  {e.user.name}
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Month nav */}
      <div className="flex items-center justify-between">
        <Link href={qs(view, monthParam(prev.year, prev.month))} className="p-2 rounded-lg hover:bg-sand-100 text-sand-500" aria-label="Bulan sebelumnya">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h2 className="font-serif font-semibold text-forest-500">
          {MONTHS_ID[month]} {year}
        </h2>
        <Link href={qs(view, monthParam(next.year, next.month))} className="p-2 rounded-lg hover:bg-sand-100 text-sand-500" aria-label="Bulan berikutnya">
          <ChevronRight className="w-5 h-5" />
        </Link>
      </div>

      {view === "calendar" ? (
        <div className="bg-white rounded-2xl border border-sand-200 p-4 sm:p-5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {DOW_SHORT.map((d) => (
              <div key={d} className="text-[11px] font-medium text-sand-400 py-1">{d}</div>
            ))}
            {cells.map((day, i) => {
              if (day === null) return <div key={`e-${i}`} />;
              const dayConsults = byDay.get(day) ?? [];
              const isToday = isCurrentMonth && today.getDate() === day;
              return (
                <div
                  key={day}
                  className={`min-h-[64px] rounded-lg border p-1.5 text-left ${
                    isToday ? "border-forest-500 border-2" : "border-sand-200"
                  }`}
                >
                  {isToday ? (
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-forest-500 text-white border-2 border-forest-500 text-xs font-bold">
                      {day}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-sand-600">{day}</span>
                  )}
                  {dayConsults.length > 0 && (
                    <div className="mt-1 text-[10px] font-semibold rounded px-1 py-0.5 bg-teal-dark text-white truncate">
                      {dayConsults.length} sesi
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 p-5">
          {consults.length === 0 ? (
            <p className="text-sand-400 text-sm">Tidak ada sesi pada bulan ini.</p>
          ) : (
            <div className="space-y-4">
              {Array.from(byDay.entries())
                .sort((a, b) => a[0] - b[0])
                .map(([day, list]) => (
                  <div key={day}>
                    <div className="text-xs font-semibold text-sand-500 mb-1.5">
                      {day} {MONTHS_ID[month]}
                    </div>
                    <div className="divide-y divide-sand-100 border border-sand-100 rounded-xl">
                      {list.map((c) => (
                        <div key={c.id} className="px-3 py-2 grid grid-cols-[auto_1fr_auto] gap-3 items-center text-sm">
                          <span className="text-forest-500 font-medium w-12">
                            {new Date(c.scheduledAt).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          <span className="min-w-0 truncate text-sand-600">
                            <strong className="text-forest-500">{c.expert.user.name}</strong>
                            {" · "}{c.parent.name ?? "Orang tua"}
                          </span>
                          <span className="text-[11px] text-sand-400">{c.durationMins}m</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
