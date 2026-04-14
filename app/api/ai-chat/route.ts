import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

const chatSchema = z.object({
  conversationId: z.string().nullish(),
  message: z.string().min(1).max(2000),
});

const CHALLENGE_LABELS: Record<string, string> = {
  COMMUNICATION_ISSUES: "Masalah Komunikasi",
  BEHAVIORAL_CHALLENGES: "Tantangan Perilaku",
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  SENSORY_PROCESSING: "Pemrosesan Sensorik",
  SOCIAL_EMOTIONAL: "Sosial & Emosional",
  MULTIPLE_CHALLENGES: "Multi-Tantangan",
};

const MOOD_LABELS: Record<string, string> = {
  VERY_HAPPY: "Sangat Senang",
  HAPPY: "Senang",
  NEUTRAL: "Biasa",
  SAD: "Sedih",
  VERY_SAD: "Sangat Sedih",
};

// POST: Send message and get Gemini AI response
export async function POST(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = chatSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const { conversationId, message } = parsed.data;

  // Check premium
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true, name: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  // Rate limit: 10 prompts lifetime for free users
  let totalUserPrompts = 0;
  if (!isPremium) {
    const allConversations = await prisma.aiConversation.findMany({
      where: { userId: session.user.id },
      select: { messages: true },
    });
    totalUserPrompts = allConversations.reduce((count, conv) => {
      const msgs = conv.messages as unknown as ChatMessage[];
      return count + msgs.filter((m) => m.role === "user").length;
    }, 0);

    if (totalUserPrompts >= 10) {
      return NextResponse.json(
        {
          error:
            "Trial 10 pertanyaan sudah habis. Upgrade ke Premium untuk unlimited.",
          limitReached: true,
        },
        { status: 429 },
      );
    }
  }

  // Load existing conversation
  let conversation;
  let messages: ChatMessage[] = [];
  if (conversationId) {
    conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
    if (conversation) {
      messages = conversation.messages as unknown as ChatMessage[];
    }
  }

  // Gather full context from the platform
  const [assessment, recentJournals, activePlan, insight] = await Promise.all([
    prisma.assessment.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: {
        childName: true,
        childAge: true,
        challengeType: true,
        challengeDetails: true,
        goals: true,
      },
    }),
    prisma.dailyJournal.findMany({
      where: { userId: session.user.id },
      orderBy: { date: "desc" },
      take: isPremium ? 7 : 3,
      select: {
        date: true,
        mood: true,
        sleepQuality: true,
        appetiteLevel: true,
        tantrumCount: true,
        achievements: true,
        challenges: true,
        activities: true,
        notes: true,
      },
    }),
    prisma.actionPlan.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: {
        title: true,
        weekNumber: true,
        goalText: true,
        activities: {
          select: { title: true, isCompleted: true, domain: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }),
    prisma.assessment.findFirst({
      where: { userId: session.user.id, isActive: true },
      select: {
        insight: {
          select: { summary: true, riskLevel: true, strengths: true },
        },
      },
    }),
  ]);

  // Build system prompt with platform context
  const systemPrompt = buildSystemPrompt({
    userName: user?.name || "Pengguna",
    assessment,
    journals: recentJournals,
    activePlan,
    insightSummary: insight?.insight?.summary || null,
    insightRiskLevel: insight?.insight?.riskLevel || null,
    insightStrengths: (insight?.insight?.strengths as string[]) || [],
    isPremium,
  });

  // Build conversation history for Gemini
  const historyForGemini = messages.map((m) => ({
    role: m.role === "user" ? ("user" as const) : ("model" as const),
    parts: [{ text: m.content }],
  }));

  // Call Gemini
  let aiResponse: string;
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      systemInstruction: systemPrompt,
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 1024,
      },
    });

    const chat = model.startChat({ history: historyForGemini });
    const result = await chat.sendMessage(message);
    aiResponse = result.response.text();
  } catch (err) {
    console.error("[GEMINI ERROR]", err);
    // Fallback if API fails
    aiResponse = `Maaf, saya sedang mengalami kendala teknis. Silakan coba lagi dalam beberapa saat.\n\nSementara itu, Anda bisa:\n- Catat perkembangan anak di **Jurnal Harian**\n- Lihat **Action Plan** untuk aktivitas mingguan\n- **Konsultasi Pakar** untuk bantuan langsung`;
  }

  // Save messages
  const userMsg: ChatMessage = {
    role: "user",
    content: message,
    timestamp: new Date().toISOString(),
  };
  const assistantMsg: ChatMessage = {
    role: "assistant",
    content: aiResponse,
    timestamp: new Date().toISOString(),
  };
  messages.push(userMsg, assistantMsg);

  const title = message.slice(0, 50);
  const messagesJson = messages as unknown as Parameters<
    typeof prisma.aiConversation.create
  >[0]["data"]["messages"];

  if (conversation) {
    await prisma.aiConversation.update({
      where: { id: conversation.id },
      data: { messages: messagesJson, title: conversation.title || title },
    });
  } else {
    conversation = await prisma.aiConversation.create({
      data: { userId: session.user.id, title, messages: messagesJson },
    });
  }

  const newTotal = totalUserPrompts + 1;

  return NextResponse.json({
    conversationId: conversation.id,
    response: aiResponse,
    promptsLeft: isPremium ? null : Math.max(0, 10 - newTotal),
    isPremium,
  });
}

// GET: List conversations + prompt count
export async function GET(req: Request) {
  const session = await auth();
  if (!session)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get("id");

  if (conversationId) {
    const conversation = await prisma.aiConversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    });
    return NextResponse.json({ conversation });
  }

  const conversations = await prisma.aiConversation.findMany({
    where: { userId: session.user.id },
    select: { id: true, title: true, createdAt: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
    take: 20,
  });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isPremium: true, premiumExpiresAt: true },
  });
  const isPremium =
    user?.isPremium === true &&
    (!user.premiumExpiresAt || user.premiumExpiresAt > new Date());

  let promptsLeft: number | null = null;
  if (!isPremium) {
    const allConvs = await prisma.aiConversation.findMany({
      where: { userId: session.user.id },
      select: { messages: true },
    });
    const total = allConvs.reduce((c, conv) => {
      const msgs = conv.messages as unknown as ChatMessage[];
      return c + msgs.filter((m) => m.role === "user").length;
    }, 0);
    promptsLeft = Math.max(0, 10 - total);
  }

  return NextResponse.json({ conversations, isPremium, promptsLeft });
}

// ─────────────────────────────────────────────
// System Prompt Builder
// ─────────────────────────────────────────────

interface PromptContext {
  userName: string;
  assessment: {
    childName: string;
    childAge: number;
    challengeType: string;
    challengeDetails: string | null;
    goals: string[];
  } | null;
  journals: Array<{
    date: Date;
    mood: string;
    sleepQuality: string | null;
    appetiteLevel: string | null;
    tantrumCount: number;
    achievements: string[];
    challenges: string[];
    activities: string[];
    notes: string | null;
  }>;
  activePlan: {
    title: string;
    weekNumber: number;
    goalText: string;
    activities: Array<{ title: string; isCompleted: boolean; domain: string }>;
  } | null;
  insightSummary: string | null;
  insightRiskLevel: string | null;
  insightStrengths: string[];
  isPremium: boolean;
}

function buildSystemPrompt(ctx: PromptContext): string {
  let prompt = `Kamu adalah "Pendamping AI" di platform IncluSearch — platform pendampingan orang tua Anak Berkebutuhan Khusus (ABK) di Indonesia.

PERAN:
- Kamu adalah pendamping yang hangat, empatik, dan suportif untuk orang tua/pengasuh ABK.
- Kamu memberikan informasi berdasarkan literatur perkembangan anak dan best practice intervensi dini.
- Kamu BUKAN dokter atau terapis. Selalu ingatkan untuk konsultasi profesional jika serius.
- Jawab dalam Bahasa Indonesia yang ramah dan mudah dipahami.
- Gunakan nama anak jika tersedia agar terasa personal.

FORMAT JAWABAN:
- Gunakan markdown: **bold** untuk poin penting, numbered list untuk langkah-langkah.
- Jawab ringkas tapi lengkap. Maks 300 kata.
- Berikan langkah konkret yang bisa dilakukan, bukan teori panjang.
- Jika relevan, sarankan fitur platform: Jurnal Harian, Action Plan, Konsultasi Pakar, Export PDF.

BATASAN:
- Jangan pernah mendiagnosis kondisi medis.
- Jangan memberikan resep obat.
- Jangan memberikan saran yang bertentangan dengan praktik klinis standar.
- Jika pertanyaan di luar topik anak/pengasuhan, arahkan kembali ke topik utama dengan sopan.
`;

  // Add child context
  if (ctx.assessment) {
    const a = ctx.assessment;
    prompt += `\n--- DATA ANAK ---\n`;
    prompt += `Nama anak: ${a.childName}\n`;
    prompt += `Usia: ${a.childAge} tahun\n`;
    prompt += `Tantangan utama: ${CHALLENGE_LABELS[a.challengeType] || a.challengeType}\n`;
    if (a.challengeDetails)
      prompt += `Detail tantangan: ${a.challengeDetails}\n`;
    if (a.goals.length > 0)
      prompt += `Tujuan orang tua: ${a.goals.join(", ")}\n`;
  }

  // Add insight context
  if (ctx.insightSummary) {
    prompt += `\n--- INSIGHT ASESMEN ---\n`;
    prompt += `Ringkasan: ${ctx.insightSummary}\n`;
    if (ctx.insightRiskLevel)
      prompt += `Tingkat perhatian: ${ctx.insightRiskLevel}\n`;
    if (ctx.insightStrengths.length > 0)
      prompt += `Kekuatan anak: ${ctx.insightStrengths.join(", ")}\n`;
  }

  // Add journal context
  if (ctx.journals.length > 0) {
    prompt += `\n--- JURNAL HARIAN TERAKHIR ---\n`;
    ctx.journals.forEach((j) => {
      const dateStr = new Date(j.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      });
      prompt += `${dateStr}: mood=${MOOD_LABELS[j.mood] || j.mood}`;
      if (j.tantrumCount > 0) prompt += `, tantrum=${j.tantrumCount}x`;
      if (j.achievements.length > 0)
        prompt += `, pencapaian: ${j.achievements.join(", ")}`;
      if (j.challenges.length > 0)
        prompt += `, tantangan: ${j.challenges.join(", ")}`;
      if (j.notes) prompt += `, catatan: "${j.notes}"`;
      prompt += `\n`;
    });
  }

  // Add action plan context
  if (ctx.activePlan) {
    const p = ctx.activePlan;
    const done = p.activities.filter((a) => a.isCompleted).length;
    const total = p.activities.length;
    prompt += `\n--- ACTION PLAN AKTIF ---\n`;
    prompt += `${p.title} (Minggu ${p.weekNumber})\n`;
    prompt += `Target: ${p.goalText}\n`;
    prompt += `Progres: ${done}/${total} aktivitas selesai\n`;
    prompt += `Aktivitas: ${p.activities.map((a) => `${a.title} [${a.isCompleted ? "Selesai" : "Belum"}]`).join(", ")}\n`;
  }

  prompt += `\n--- INFO PENGGUNA ---\n`;
  prompt += `Nama pengguna: ${ctx.userName}\n`;
  prompt += `Status: ${ctx.isPremium ? "Premium" : "Gratis"}\n`;

  return prompt;
}
