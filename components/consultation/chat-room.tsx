"use client";

import {
  useState,
  useEffect,
  useRef,
} from "react";
import { Send, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { formatRelativeTime, getInitials } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
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
}

export function ChatRoom({
  roomId,
  initialMessages,
  currentUser,
  consultationStatus,
  imageOverrides,
}: ChatRoomProps) {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastMessageIdRef = useRef<string | undefined>(
    initialMessages[initialMessages.length - 1]?.id
  );
  const isClosed =
    consultationStatus === "COMPLETED" || consultationStatus === "CANCELLED";

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
          if (data.messages?.length > 0) {
            setMessages((prev) => {
              const existingIds = new Set(prev.map((m) => m.id));
              const fresh = data.messages.filter((m: Message) => !existingIds.has(m.id));
              return fresh.length > 0 ? [...prev.filter((m) => !m.id.startsWith("temp-")), ...fresh] : prev;
            });
          }
        }
      } catch {
        // silent
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [roomId, isClosed]);

  async function sendMessage() {
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
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div className="flex flex-col flex-1 bg-white border border-t-0 border-sand-200 rounded-b-2xl overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-8 text-sand-400 text-sm">
            Belum ada pesan. Mulai percakapan!
          </div>
        )}

        {messages.map((msg, i) => {
          const isSelf = msg.sender.id === currentUser.id;
          const prevMsg = messages[i - 1];
          const showAvatar =
            !isSelf && (!prevMsg || prevMsg.sender.id !== msg.sender.id);

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
      ) : (
        <div className="p-3 border-t border-sand-200 bg-white">
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
