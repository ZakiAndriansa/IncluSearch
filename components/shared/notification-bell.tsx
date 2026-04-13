"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Bell, Check, CheckCheck, PenLine, ClipboardList,
  CalendarDays, Sparkles, Crown, Trophy, Info, X,
} from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  JOURNAL_REMINDER: { icon: PenLine, color: "text-blue-500", bg: "bg-blue-50" },
  ACTION_PLAN_REMINDER: { icon: ClipboardList, color: "text-purple-500", bg: "bg-purple-50" },
  CONSULTATION_REMINDER: { icon: CalendarDays, color: "text-teal-dark", bg: "bg-teal-dark/10" },
  INSIGHT_READY: { icon: Sparkles, color: "text-amber-500", bg: "bg-amber-50" },
  PREMIUM_EXPIRED: { icon: Crown, color: "text-amber-500", bg: "bg-amber-50" },
  ACHIEVEMENT: { icon: Trophy, color: "text-emerald-500", bg: "bg-emerald-50" },
  WELCOME: { icon: Sparkles, color: "text-forest-500", bg: "bg-forest-50" },
  SYSTEM: { icon: Info, color: "text-sand-500", bg: "bg-sand-100" },
};

export function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications
  async function fetchNotifications() {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
      }
    } catch { /* */ }
    setLoading(false);
  }

  // Fetch on mount and every 2 minutes
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 120000);
    return () => clearInterval(interval);
  }, []);

  async function markAsRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id }),
    });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  function handleClick(notif: Notification) {
    if (!notif.isRead) markAsRead(notif.id);
    if (notif.actionUrl) {
      setIsOpen(false);
      router.push(notif.actionUrl);
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-full hover:bg-sand-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-sand-500" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-11 w-80 sm:w-96 bg-white rounded-xl border border-sand-200/80 shadow-xl z-50 max-h-[70vh] flex flex-col animate-fade-in">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-sand-100">
            <h3 className="text-sm font-semibold text-forest-600">Notifikasi</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-forest-500 hover:text-forest-600 font-medium flex items-center gap-1 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Tandai semua dibaca
                </button>
              )}
              <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-sand-50">
                <X className="w-4 h-4 text-sand-400" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="p-6 text-center">
                <div className="w-5 h-5 border-2 border-sand-300 border-t-forest-500 rounded-full animate-spin mx-auto" />
                <p className="text-xs text-sand-400 mt-2">Memuat notifikasi...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-8 h-8 text-sand-300 mx-auto mb-2" />
                <p className="text-xs text-sand-400">Belum ada notifikasi</p>
              </div>
            ) : (
              <div>
                {notifications.map(notif => {
                  const config = TYPE_CONFIG[notif.type] || TYPE_CONFIG.SYSTEM;
                  const Icon = config.icon;

                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleClick(notif)}
                      className={cn(
                        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-sand-50 last:border-0",
                        !notif.isRead ? "bg-forest-50/30 hover:bg-forest-50/60" : "hover:bg-sand-50/50",
                        notif.actionUrl && "cursor-pointer"
                      )}
                    >
                      {/* Icon */}
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.bg)}>
                        <Icon className={cn("w-4 h-4", config.color)} />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-xs leading-snug", !notif.isRead ? "font-semibold text-forest-600" : "font-medium text-sand-700")}>
                            {notif.title}
                          </p>
                          {!notif.isRead && (
                            <span className="w-2 h-2 rounded-full bg-forest-400 flex-shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-sand-500 mt-0.5 leading-relaxed line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-[10px] text-sand-400 mt-1">
                          {formatRelativeTime(notif.createdAt)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
