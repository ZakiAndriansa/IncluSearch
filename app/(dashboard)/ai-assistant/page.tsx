"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  Sparkles,
  Brain,
  Heart,
  Target,
  Lightbulb,
  Flame,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Crown,
  Zap,
  ArrowLeft,
  BookOpen,
  Smile,
  Moon,
  Utensils,
  Users,
  Hand,
  MessageCircle,
  Lock,
  ArrowRight,
  Send,
  User,
  Plus,
  Clock,
  Coffee,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatRelativeTime } from "@/lib/utils";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
}

interface SituationCard {
  id: string;
  label: string;
  icon: React.ElementType;
  color: string;
  bg: string;
  prompt: string;
}

// ─────────────────────────────────────────────
// Quick situation cards
// ─────────────────────────────────────────────

const SITUATIONS: SituationCard[] = [
  {
    id: "tantrum",
    label: "Anak tantrum",
    icon: Flame,
    color: "text-rose-500",
    bg: "bg-rose-50 border-rose-200",
    prompt:
      "Anak saya sedang tantrum sekarang. Apa yang harus saya lakukan step by step?",
  },
  {
    id: "makan",
    label: "Menolak makan",
    icon: Utensils,
    color: "text-amber-500",
    bg: "bg-amber-50 border-amber-200",
    prompt: "Anak saya menolak makan. Bagaimana cara mengatasinya?",
  },
  {
    id: "tidur",
    label: "Susah tidur",
    icon: Moon,
    color: "text-indigo-500",
    bg: "bg-indigo-50 border-indigo-200",
    prompt: "Anak saya susah tidur malam. Tips apa yang bisa dicoba?",
  },
  {
    id: "pukul",
    label: "Anak memukul",
    icon: Hand,
    color: "text-red-500",
    bg: "bg-red-50 border-red-200",
    prompt:
      "Anak saya suka memukul orang lain saat frustrasi. Kenapa dan bagaimana mengatasinya?",
  },
  {
    id: "bicara",
    label: "Belum bicara",
    icon: MessageCircle,
    color: "text-blue-500",
    bg: "bg-blue-50 border-blue-200",
    prompt:
      "Anak saya terlambat bicara. Apa yang bisa saya lakukan untuk stimulasi bahasa di rumah?",
  },
  {
    id: "sosial",
    label: "Sulit berteman",
    icon: Users,
    color: "text-teal-dark",
    bg: "bg-teal-dark/10 border-teal-dark/20",
    prompt:
      "Anak saya sulit berinteraksi dengan teman sebaya. Bagaimana cara membantu?",
  },
  {
    id: "fokus",
    label: "Tidak fokus",
    icon: Target,
    color: "text-purple-500",
    bg: "bg-purple-50 border-purple-200",
    prompt: "Anak saya sulit fokus saat belajar. Strategi apa yang efektif?",
  },
  {
    id: "emosi",
    label: "Sulit atur emosi",
    icon: Heart,
    color: "text-pink-500",
    bg: "bg-pink-50 border-pink-200",
    prompt:
      "Anak saya sulit mengontrol emosi, mudah menangis dan marah. Bagaimana membantu regulasi emosinya?",
  },
];

const SUGGESTED_QUESTIONS = [
  "Aktivitas stimulasi apa yang cocok untuk anak saya?",
  "Bagaimana cara membuat jadwal visual untuk rutinitas?",
  "Apa milestone perkembangan sesuai usia anak saya?",
  "Tips mengurangi screen time anak",
  "Cara menjelaskan kondisi anak ke keluarga besar",
  "Bagaimana evaluasi perkembangan anak saya minggu ini?",
];

export default function AIAssistantPage() {
  // Data state
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [promptsLeft, setPromptsLeft] = useState<number | null>(null);
  const [limitReached, setLimitReached] = useState(false);

  // UI state
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [view, setView] = useState<"home" | "chat">("home");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load conversations on mount
  useEffect(() => {
    fetch("/api/ai-chat")
      .then((r) => r.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setIsPremium(data.isPremium ?? false);
        setPromptsLeft(data.promptsLeft ?? null);
      })
      .catch(() => {});
  }, []);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function startNewChat() {
    setConversationId(null);
    setMessages([]);
    setLimitReached(false);
    setView("chat");
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  function startWithPrompt(prompt: string) {
    setConversationId(null);
    setMessages([]);
    setLimitReached(false);
    setView("chat");
    // Slight delay so UI renders first
    setTimeout(() => handleSend(prompt), 50);
  }

  async function loadConversation(id: string) {
    const res = await fetch(`/api/ai-chat?id=${id}`);
    if (res.ok) {
      const data = await res.json();
      if (data.conversation) {
        setConversationId(data.conversation.id);
        setMessages(data.conversation.messages as Message[]);
        setView("chat");
        setShowHistory(false);
      }
    }
  }

  async function handleSend(text?: string) {
    const msg = (text || input).trim();
    if (!msg || sending || limitReached) return;

    const userMessage: Message = {
      role: "user",
      content: msg,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/ai-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: msg }),
      });

      const data = await res.json();

      if (res.status === 429) {
        setLimitReached(true);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.error,
            timestamp: new Date().toISOString(),
          },
        ]);
        return;
      }

      if (res.ok) {
        setConversationId(data.conversationId);
        setPromptsLeft(data.promptsLeft);
        setIsPremium(data.isPremium);
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.response,
            timestamp: new Date().toISOString(),
          },
        ]);

        // Refresh conversation list
        fetch("/api/ai-chat")
          .then((r) => r.json())
          .then((d) => setConversations(d.conversations || []))
          .catch(() => {});
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Maaf, terjadi kesalahan. Silakan coba lagi.",
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  // ═══════════════════════════════════════════
  // CHAT VIEW
  // ═══════════════════════════════════════════
  if (view === "chat") {
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)] lg:h-[calc(100vh-6rem)] animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-sand-200">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setView("home")}
              className="p-2 rounded-lg hover:bg-sand-100 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-sand-500" />
            </button>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-forest-500 to-teal-dark flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-forest-600">
                Pendamping AI
              </h1>
              <p className="text-[10px] text-sand-400">
                Powered by Inclu Search
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isPremium && promptsLeft !== null && (
              <span className="text-[11px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-200">
                <Zap className="w-3 h-3 inline mr-0.5" />
                {promptsLeft} tersisa
              </span>
            )}
            <button
              onClick={startNewChat}
              className="p-2 rounded-lg hover:bg-sand-100 text-sand-500 transition-colors"
              title="Percakapan baru"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {/* Empty state — suggested questions */}
          {messages.length === 0 && (
            <div className="pt-4">
              <p className="text-sm text-sand-500 text-center mb-4">
                Tanyakan apa saja tentang perkembangan anak Anda
              </p>
              <div className="space-y-2 max-w-lg mx-auto">
                {SUGGESTED_QUESTIONS.slice(0, 4).map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={sending}
                    className="w-full text-left text-xs bg-white border border-sand-200 rounded-xl p-3 hover:border-forest-200 hover:bg-forest-50/30 transition-all flex items-center gap-2.5"
                  >
                    <ChevronRight className="w-3.5 h-3.5 text-forest-400 flex-shrink-0" />
                    <span className="text-forest-600">{q}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message bubbles */}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "flex gap-2.5",
                msg.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              {msg.role === "assistant" && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-500 to-teal-dark flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3",
                  msg.role === "user"
                    ? "bg-forest-500 text-white rounded-tr-md"
                    : "bg-white border border-sand-200/80 text-forest-700 rounded-tl-md shadow-sm",
                )}
              >
                {msg.role === "assistant" ? (
                  <div className="text-sm leading-relaxed whitespace-pre-wrap prose-sm">
                    {renderMarkdown(msg.content)}
                  </div>
                ) : (
                  <p className="text-sm">{msg.content}</p>
                )}
              </div>
              {msg.role === "user" && (
                <div className="w-8 h-8 rounded-lg bg-teal-dark flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {sending && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-forest-500 to-teal-dark flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white border border-sand-200/80 rounded-2xl rounded-tl-md px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center">
                  <div
                    className="w-2 h-2 bg-forest-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-forest-400 rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <div
                    className="w-2 h-2 bg-forest-400 rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                  <span className="text-[10px] text-sand-400 ml-2">
                    Sedang berpikir...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Limit banner */}
        {limitReached && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 mb-2">
            <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs font-semibold text-amber-700">
                Trial habis
              </p>
              <p className="text-[10px] text-amber-600">
                Upgrade Premium untuk unlimited.
              </p>
            </div>
            <Button
              asChild
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex-shrink-0"
            >
              <Link href="/profil?tab=premium">Upgrade</Link>
            </Button>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-sand-200 pt-3">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={
                limitReached
                  ? "Upgrade Premium untuk melanjutkan..."
                  : "Tanya tentang perkembangan anak..."
              }
              disabled={limitReached}
              rows={1}
              className="flex-1 resize-none border border-sand-200 rounded-xl px-4 py-2.5 text-sm text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/60 disabled:opacity-50 transition-all"
            />
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || sending || limitReached}
              className="bg-forest-500 hover:bg-forest-600 text-white px-4 self-end rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-[10px] text-sand-300 mt-1.5 text-center">
            AI memberikan informasi umum, bukan pengganti konsultasi
            profesional.
          </p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // HOME VIEW — cards + history + ask button
  // ═══════════════════════════════════════════
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-forest-500 to-teal-dark flex items-center justify-center shadow-md">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-bold text-forest-600">
              Pendamping AI
            </h1>
            <p className="text-xs text-sand-500">
              Tanya apa saja tentang anak Anda
            </p>
          </div>
        </div>
        {!isPremium && promptsLeft !== null && (
          <span className="text-[11px] bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full border border-amber-200">
            <Zap className="w-3 h-3 inline mr-0.5" />
            {promptsLeft} trial tersisa
          </span>
        )}
      </div>

      {/* Ask button — primary CTA */}
      <button
        onClick={startNewChat}
        className="w-full bg-gradient-to-r from-forest-500 to-teal-dark text-white rounded-2xl p-4 flex items-center gap-3 hover:opacity-95 transition-opacity shadow-md"
      >
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
          <MessageCircle className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <div className="text-sm font-semibold">Tanya Pendamping AI</div>
          <p className="text-xs text-white/70 mt-0.5">
            Tanyakan apa saja — jawaban personal berdasarkan data anak Anda
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-white/50 flex-shrink-0" />
      </button>

      {/* Situation cards */}
      <section>
        <h2 className="text-sm font-semibold text-forest-600 mb-2.5 flex items-center gap-1.5">
          <Flame className="w-4 h-4 text-rose-400" /> Sedang menghadapi ini?
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {SITUATIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => startWithPrompt(s.prompt)}
              className={cn(
                "flex items-center gap-2 p-2.5 rounded-xl border text-left transition-all hover:shadow-sm hover:scale-[1.01]",
                s.bg,
              )}
            >
              <s.icon className={cn("w-4 h-4 flex-shrink-0", s.color)} />
              <span className="text-[11px] font-medium text-forest-600 leading-tight">
                {s.label}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Conversation History */}
      <section>
        <h2 className="text-sm font-semibold text-forest-600 mb-2.5 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-sand-400" /> Riwayat Percakapan
        </h2>
        {conversations.length === 0 ? (
          <div className="bg-white rounded-xl border border-sand-200 p-6 text-center">
            <MessageCircle className="w-8 h-8 text-sand-300 mx-auto mb-2" />
            <p className="text-xs text-sand-400">
              Belum ada percakapan. Mulai tanya sekarang!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.slice(0, showHistory ? 20 : 5).map((conv) => (
              <button
                key={conv.id}
                onClick={() => loadConversation(conv.id)}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-white border border-sand-200/80 hover:border-forest-200/60 hover:shadow-sm transition-all text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-forest-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-forest-600 truncate">
                    {conv.title}
                  </div>
                  <div className="text-[10px] text-sand-400 mt-0.5">
                    {formatRelativeTime(conv.updatedAt)}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-sand-300 flex-shrink-0" />
              </button>
            ))}
            {conversations.length > 5 && (
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="w-full text-center text-xs text-forest-500 font-medium py-2 hover:text-forest-600 transition-colors"
              >
                {showHistory
                  ? "Tampilkan lebih sedikit"
                  : `Lihat semua (${conversations.length})`}
              </button>
            )}
          </div>
        )}
      </section>

      {/* Premium CTA */}
      {!isPremium && (
        <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 rounded-2xl border border-amber-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-800">
              10 pertanyaan gratis
            </div>
            <p className="text-xs text-amber-600 mt-0.5">
              Upgrade Premium untuk unlimited tanya jawab + konteks data
              lengkap.
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="bg-amber-500 hover:bg-amber-600 text-white text-xs flex-shrink-0 rounded-xl"
          >
            <Link href="/profil?tab=premium">Upgrade</Link>
          </Button>
        </div>
      )}

      <p className="text-[10px] text-sand-300 text-center pb-2">
        Pendamping AI memberikan informasi umum, bukan pengganti konsultasi
        profesional.
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Markdown renderer
// ─────────────────────────────────────────────
function renderMarkdown(content: string) {
  return content.split("\n").map((line, i) => {
    if (line.startsWith("### "))
      return (
        <p
          key={i}
          className="font-semibold text-forest-600 mt-3 mb-1 text-[13px]"
        >
          {line.replace("### ", "")}
        </p>
      );
    if (line.startsWith("## "))
      return (
        <p key={i} className="font-bold text-forest-600 mt-3 mb-1">
          {line.replace("## ", "")}
        </p>
      );
    if (line.startsWith("**") && line.endsWith("**"))
      return (
        <p key={i} className="font-semibold mt-2 mb-1">
          {line.replace(/\*\*/g, "")}
        </p>
      );
    if (line.includes("**"))
      return (
        <p
          key={i}
          className="mt-0.5"
          dangerouslySetInnerHTML={{
            __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
          }}
        />
      );
    if (line.match(/^\d+\.\s/))
      return (
        <p key={i} className="ml-2 mt-0.5">
          {line}
        </p>
      );
    if (line.startsWith("- ") || line.startsWith("• "))
      return (
        <p key={i} className="ml-3 mt-0.5">
          {line}
        </p>
      );
    if (line.startsWith("> "))
      return (
        <p
          key={i}
          className="ml-3 pl-2 border-l-2 border-forest-200 text-forest-500 italic mt-1"
        >
          {line.replace("> ", "")}
        </p>
      );
    if (line.trim() === "") return <br key={i} />;
    return (
      <p key={i} className="mt-0.5">
        {line}
      </p>
    );
  });
}
