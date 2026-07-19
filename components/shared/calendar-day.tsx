"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Lock } from "lucide-react";

export interface CalendarSession {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
}

interface CalendarDayProps {
  day: number;
  isToday: boolean;
  sessions: CalendarSession[];
  locked?: boolean;
  dateLabel: string;
}

// A single calendar cell. Cells with sessions are clickable (popup with the
// day's sessions) and turn dark green on hover (matching the "today" marker).
export function CalendarDay({ day, isToday, sessions, locked = false, dateLabel }: CalendarDayProps) {
  const [open, setOpen] = useState(false);
  const hasSessions = sessions.length > 0;

  const base = cn(
    "min-h-[64px] rounded-lg border p-1.5 text-left w-full transition-colors",
    isToday
      ? "border-forest-500 border-2"
      : locked
      ? "border-sand-200 bg-sand-100/70"
      : "border-sand-200"
  );

  const inner = (
    <>
      {isToday ? (
        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-forest-500 text-white text-xs font-bold group-hover:bg-white group-hover:text-forest-600">
          {day}
        </span>
      ) : (
        <span
          className={cn(
            "text-xs font-medium",
            locked ? "text-sand-400" : "text-sand-600",
            hasSessions && "group-hover:text-white"
          )}
        >
          {day}
        </span>
      )}
      {hasSessions && (
        <div className="mt-1 text-[10px] font-semibold rounded px-1 py-0.5 bg-teal-dark text-white truncate group-hover:bg-white group-hover:text-forest-600">
          {sessions.length} sesi
        </div>
      )}
      {locked && !hasSessions && <Lock className="w-3 h-3 text-sand-400 mt-1" />}
    </>
  );

  if (!hasSessions) {
    return <div className={base}>{inner}</div>;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(base, "group cursor-pointer hover:bg-forest-500")}
      >
        {inner}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setOpen(false)}
          onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="bg-white rounded-2xl border border-sand-200 shadow-xl max-w-sm w-full p-5 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif font-bold text-forest-500">Sesi {dateLabel}</h3>
            <div className="divide-y divide-sand-100 max-h-[60vh] overflow-y-auto">
              {sessions.map((s) => (
                <div key={s.id} className="py-2 flex items-start gap-3">
                  <span className="text-sm font-semibold text-forest-500 w-12 flex-shrink-0">
                    {s.time}
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm text-forest-600 truncate">{s.title}</div>
                    {s.subtitle && (
                      <div className="text-xs text-sand-400 truncate">{s.subtitle}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-full text-sm rounded-lg border border-sand-300 py-2 text-sand-600 hover:bg-sand-50"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
