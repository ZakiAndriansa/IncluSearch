"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { Send, Loader2, Clock, ShieldCheck, Bell } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  type?: string;
  sentAt: Date;
  isRead: boolean;
  sender: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface ChatRoomProps {
  roomId: string;
  initialMessages: Message[];
  currentUser: {
    id: string;
    name: string;
    image: string | null;
  };
  consultationStatus: string;
  imageOverrides?: Record<string, string | null>;
  scheduledAt: string;
  durationMins: number;
  isExpert: boolean;
  expertInitiated: boolean;
}

function formatTimeID(date: Date) {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getTimeStatus(scheduledAt: string, durationMins: number) {
  const now = new Date();
  const start = new Date(scheduledAt);
  const end = new Date(start.getTime() + durationMins * 60 * 1000);

  if (now < start) return { status: "before" as const, start, end, remaining: start.getTime() - now.getTime() };
  if (now > end) return { status: "after" as const, start, end, remaining: 0 };
  return { status: "active" as const, start, end, remaining: end.getTime() - now.getTime() };
}

export function ChatRoom({
  roomId,
  initialMessages,
  currentUser,
  consultationStatus,
  imageOverrides,
  scheduledAt,
  durationMins,
  isExpert,
  expertInitiated: initialExpertInitiated,
}: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [expertInitiated, setExpertInitiated] = useState(initialExpertInitiated);
  const [timeInfo, setTimeInfo] = useState(() => getTimeStatus(scheduledAt, durationMins));
  const [showNotification, setShowNotification] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string | undefined>(
    initialMessages[initialMessages.length - 1]?.id
  );
  const prevExpertInitiated = useRef(initialExpertInitiated);
  const isClosed =
    consultationStatus === "COMPLETED" || consultationStatus === "CANCELLED";

  // Semua role dinonaktifkan di luar jendela waktu konsultasi
  const canSend = timeInfo.status === "active";

  // Update time status every second
  useEffect(() => {
    if (isClosed) return;
    const interval = setInterval(() => {
      setTimeInfo(getTimeStatus(scheduledAt, durationMins));
    }, 1000);
    return () => clearInterval(interval);
  }, [scheduledAt, durationMins, isClosed]);

  // Show notification when expert initiates
  useEffect(() => {
    if (expertInitiated && !prevExpertInitiated.current && !isExpert) {
      setShowNotification(true);
      prevExpertInitiated.current = true;
      const timeout = setTimeout(() => setShowNotification(false), 8000);
      return () => clearTimeout(timeout);
    }
  }, [expertInitiated, isExpert]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Keep lastMessageIdRef in sync
  useEffect(() => {
    const last = messages[messages.length - 1]?.id;
    if (last && !last.startsWith("temp-")) lastMessageIdRef.current = last;
  }, [messages]);

  // Poll for new messages
  useEffect(() => {
    if (isClosed) return;
    const interval = setInterval(async () => {
      const lastId = lastMessageIdRef.current;
      if (!lastId) return;
      try {
        const res = await fetch(`/api/chat/${roomId}/messages?after=${lastId}`);
        if (res.ok) {
          const data = await res.json();

          // Update expert initiated status from server
          if (data.expertInitiated && !expertInitiated) {
            setExpertInitiated(true);
          }

          if (data.messages?.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = (data.messages as Message[]).filter((m) => !existingIds.has(m.id));
              return fresh.length > 0 ? [...prev.filter((m) => !m.id.startsWith("temp-")), ...fresh] : prev;
            });
          }
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId, isClosed, expertInitiated]);

  const sendMessage = useCallback(async () => {
    const content = input.trim();
    if (!content || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      content,
      sentAt: new Date(),
      isRead: false,
      sender: { id: currentUser.id, name: currentUser.name, image: currentUser.image },
    };

    setInput("");
    setIsSending(true);
    setMessages((prev) => [...prev, optimistic]);

    try {
      const res = await fetch(`/api/chat/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });

      if (res.ok) {
        const { message } = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? message : m)));
      } else {
        const data = await res.json().catch(() => ({}));
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        if (data.code === "TIME_RESTRICTED") {
          // Refresh time info
          setTimeInfo(getTimeStatus(scheduledAt, durationMins));
        }
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, currentUser, roomId, scheduledAt, durationMins]);

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  // Format countdown
  function formatCountdown(ms: number) {
    const totalSecs = Math.max(0, Math.floor(ms / 1000));
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0) return `${h} jam ${m} menit`;
    if (m > 0) return `${m} menit ${s} detik`;
    return `${s} detik`;
  }

  // Render system messages (expert initiated notification)
  function renderSystemMessage(msg: Message) {
    const displayContent = msg.content.startsWith("__EXPERT_INITIATED__")
      ? msg.content.replace("__EXPERT_INITIATED__", "")
      : msg.content;

    return (
      <div key={msg.id} className="flex justify-center my-3">
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-700 text-xs px-4 py-2 rounded-full">
          <ShieldCheck className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{displayContent}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-white border border-t-0 border-sand-200 rounded-b-2xl overflow-hidden">
      {/* Expert-initiated notification toast */}
      {showNotification && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 animate-fade-in">
          <div className="flex items-center gap-2 bg-teal-500 text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">
            <Bell className="w-4 h-4 flex-shrink-0" />
            <span>Pakar telah membuka sesi! Anda sudah bisa berkonsultasi sekarang.</span>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-sand-400 text-sm">
            {canSend
              ? "Belum ada pesan. Mulai percakapan!"
              : "Menunggu sesi konsultasi dimulai..."}
          </div>
        )}

        {messages.map((msg, i) => {
          // Render system messages differently
          if (msg.type === "SYSTEM") {
            return renderSystemMessage(msg);
          }

          const isSelf = msg.sender.id === currentUser.id;
          const prevMsg = messages[i - 1];
          const showAvatar =
            !isSelf && (!prevMsg || prevMsg.sender.id !== msg.sender.id || prevMsg.type === "SYSTEM");

          return (
            <div
              key={msg.id}
              className={cn("flex items-end gap-2", isSelf && "flex-row-reverse")}
            >
              {/* Avatar */}
              {!isSelf ? (
                <div className="w-7 h-7 flex-shrink-0">
                  {showAvatar && (
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={(imageOverrides?.[msg.sender.id] ?? msg.sender.image) ?? undefined} />
                      <AvatarFallback className="bg-forest-100 text-forest-500 text-xs font-bold">
                        {getInitials(msg.sender.name ?? "P")}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ) : (
                <div className="w-7" />
              )}

              <div
                className={cn("max-w-[85%] sm:max-w-[72%] space-y-1", isSelf && "items-end")}
              >
                <div
                  className={cn(
                    "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                    isSelf
                      ? "chat-bubble-sent"
                      : "chat-bubble-received",
                    msg.id.startsWith("temp-") && "opacity-70"
                  )}
                >
                  {msg.content}
                </div>
                <div
                  className={cn(
                    "text-[10px] text-sand-400 px-1",
                    isSelf && "text-right"
                  )}
                >
                  {formatRelativeTime(msg.sentAt)}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      {isClosed ? (
        <div className="p-4 border-t border-sand-200 text-center text-sm text-sand-400 bg-sand-50">
          {consultationStatus === "COMPLETED"
            ? "Sesi konsultasi telah berakhir. Chat tidak dapat dilanjutkan."
            : "Konsultasi ini telah dibatalkan."}
        </div>
      ) : !canSend ? (
        /* Time-restricted banner for parents */
        <div className="p-4 border-t border-sand-200 bg-amber-50">
          <div className="flex items-center gap-3 justify-center text-sm">
            <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
            {timeInfo.status === "before" ? (
              <div className="text-center">
                <p className="text-amber-700 font-medium">
                  Sesi konsultasi belum dimulai
                </p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Dimulai pukul {formatTimeID(timeInfo.start)} · Tersisa {formatCountdown(timeInfo.remaining)} lagi
                </p>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-amber-700 font-medium">
                  Waktu sesi konsultasi telah berakhir
                </p>
                <p className="text-amber-600 text-xs mt-0.5">
                  Sesi berakhir pada pukul {formatTimeID(timeInfo.end)}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-3 border-t border-sand-200 bg-white">
          {/* Active session indicator */}
          {timeInfo.status === "active" && !isClosed && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-teal-600 mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Sesi aktif · Berakhir dalam {formatCountdown(timeInfo.remaining)}
            </div>
          )}
          {expertInitiated && timeInfo.status !== "active" && !isClosed && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-teal-600 mb-2">
              <ShieldCheck className="w-3 h-3" />
              Sesi dibuka oleh pakar
            </div>
          )}
          <div className="flex items-end gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan... (Enter untuk kirim, Shift+Enter untuk baris baru)"
              className="resize-none border-sand-300 focus:border-forest-500 min-h-[44px] max-h-32 text-sm rounded-xl"
              rows={1}
            />
            <Button
              onClick={sendMessage}
              disabled={!input.trim() || isSending}
              className="bg-forest-500 hover:bg-forest-600 text-white h-11 w-11 p-0 flex-shrink-0 rounded-xl"
            >
              {isSending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
