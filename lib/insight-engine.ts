/**
 * Smart Assessment Insight Engine
 * Generates comprehensive analysis from assessment data
 * Free users see summary only; Premium users see full insight
 */

import type { Assessment } from "@prisma/client";
import type { ChallengeType } from "@/lib/enums";

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface DomainScore {
  communication: number; // 1-10
  behavior: number;
  social: number;
  academic: number;
  motor: number;
  emotion: number;
}

export interface PriorityIssue {
  title: string;
  severity: "HIGH" | "MODERATE" | "LOW";
  description: string;
  recommendation: string;
}

export interface Recommendation {
  title: string;
  description: string;
  isPremium: boolean;
}

export interface InsightResult {
  summary: string;
  detailedAnalysis: string;
  priorityIssues: PriorityIssue[];
  domainScores: DomainScore;
  riskLevel: "LOW" | "MODERATE" | "HIGH";
  recommendations: Recommendation[];
  strengths: string[];
}

// ─────────────────────────────────────────────
// Challenge-specific analysis data
// ─────────────────────────────────────────────

const CHALLENGE_PROFILES: Record<ChallengeType, {
  primaryDomains: (keyof DomainScore)[];
  baseScores: DomainScore;
  typicalIssues: PriorityIssue[];
  typicalStrengths: string[];
}> = {
  LEARNING_DIFFICULTIES: {
    primaryDomains: ["academic", "communication"],
    baseScores: { communication: 5, behavior: 6, social: 6, academic: 3, motor: 7, emotion: 5 },
    typicalIssues: [
      { title: "Kesulitan Memproses Informasi", severity: "HIGH", description: "Anak mungkin mengalami kesulitan dalam memahami instruksi verbal atau tertulis yang kompleks.", recommendation: "Gunakan instruksi sederhana, satu langkah pada satu waktu, dengan dukungan visual." },
      { title: "Motivasi Belajar Rendah", severity: "MODERATE", description: "Kegagalan berulang dapat menurunkan motivasi dan kepercayaan diri anak.", recommendation: "Berikan apresiasi pada usaha, bukan hanya hasil. Pecah tugas besar menjadi langkah kecil." },
      { title: "Rentang Perhatian Terbatas", severity: "MODERATE", description: "Anak mungkin sulit fokus pada aktivitas belajar dalam durasi lama.", recommendation: "Sesi belajar pendek 15-20 menit dengan jeda aktif di antaranya." },
    ],
    typicalStrengths: ["Kreativitas visual", "Kemampuan berpikir konkret", "Keterampilan sosial yang baik"],
  },
  BEHAVIORAL_CHALLENGES: {
    primaryDomains: ["behavior", "emotion"],
    baseScores: { communication: 6, behavior: 3, social: 4, academic: 5, motor: 7, emotion: 3 },
    typicalIssues: [
      { title: "Tantrum dan Ledakan Emosi", severity: "HIGH", description: "Anak mengalami kesulitan mengelola emosi yang kuat, sering meledak tanpa pemicu yang jelas.", recommendation: "Identifikasi pemicu, ajarkan teknik self-regulation seperti pernapasan dalam atau zona emosi." },
      { title: "Kesulitan Mengikuti Aturan", severity: "HIGH", description: "Anak mungkin menolak instruksi atau melanggar aturan secara konsisten.", recommendation: "Buat aturan visual yang jelas, konsisten dengan konsekuensi positif dan natural." },
      { title: "Agresi atau Perilaku Destruktif", severity: "MODERATE", description: "Perilaku agresif bisa muncul sebagai cara komunikasi ketika anak belum mampu mengekspresikan kebutuhan.", recommendation: "Ajarkan alternatif ekspresi emosi, validasi perasaan anak, dan berikan pilihan." },
    ],
    typicalStrengths: ["Energi tinggi", "Determinasi kuat", "Kemampuan fisik yang baik"],
  },
  COMMUNICATION_ISSUES: {
    primaryDomains: ["communication", "social"],
    baseScores: { communication: 2, behavior: 5, social: 4, academic: 5, motor: 7, emotion: 5 },
    typicalIssues: [
      { title: "Keterlambatan Bicara", severity: "HIGH", description: "Perkembangan bahasa ekspresif atau reseptif anak di bawah milestone usia yang diharapkan.", recommendation: "Stimulasi bahasa intensif: narasi aktivitas sehari-hari, bacakan cerita, dan tunggu respons anak." },
      { title: "Kesulitan Interaksi Sosial", severity: "MODERATE", description: "Keterbatasan komunikasi dapat membuat anak sulit berinteraksi dengan teman sebaya.", recommendation: "Fasilitasi bermain bersama dengan teman sebaya yang suportif, gunakan visual support." },
      { title: "Frustrasi karena Tidak Dipahami", severity: "MODERATE", description: "Anak mungkin frustrasi ketika tidak bisa menyampaikan kebutuhannya dengan jelas.", recommendation: "Gunakan komunikasi augmentatif: gestur, gambar, atau alat bantu komunikasi sederhana." },
    ],
    typicalStrengths: ["Pemahaman non-verbal yang baik", "Kemampuan visual yang kuat", "Kemauan berkomunikasi"],
  },
  SENSORY_PROCESSING: {
    primaryDomains: ["motor", "behavior"],
    baseScores: { communication: 6, behavior: 4, social: 5, academic: 5, motor: 3, emotion: 4 },
    typicalIssues: [
      { title: "Sensitivitas Sensorik Berlebihan", severity: "HIGH", description: "Anak mungkin sangat sensitif terhadap suara, sentuhan, cahaya, atau tekstur tertentu.", recommendation: "Ciptakan lingkungan yang nyaman, berikan peringatan sebelum transisi, sediakan alat sensory calming." },
      { title: "Kebutuhan Input Sensorik", severity: "MODERATE", description: "Anak mungkin mencari stimulasi sensorik berlebihan (berputar, melompat, menyentuh benda).", recommendation: "Sediakan aktivitas sensorik terstruktur: sensory bin, trampolin mini, atau mainan fidget." },
      { title: "Kesulitan Motorik Halus", severity: "MODERATE", description: "Koordinasi tangan-mata dan gerakan halus mungkin terhambat.", recommendation: "Latihan motorik halus: meremas plastisin, menggunting, meronce, atau bermain puzzle." },
    ],
    typicalStrengths: ["Kesadaran tubuh yang berkembang", "Perhatian terhadap detail", "Kemampuan adaptasi"],
  },
  SOCIAL_EMOTIONAL: {
    primaryDomains: ["social", "emotion"],
    baseScores: { communication: 6, behavior: 5, social: 3, academic: 5, motor: 7, emotion: 3 },
    typicalIssues: [
      { title: "Kesulitan Membaca Isyarat Sosial", severity: "HIGH", description: "Anak mungkin tidak memahami ekspresi wajah, nada suara, atau bahasa tubuh orang lain.", recommendation: "Gunakan social stories, role play, dan video modeling untuk mengajarkan keterampilan sosial." },
      { title: "Kecemasan Sosial", severity: "MODERATE", description: "Anak mungkin menghindari situasi sosial atau merasa sangat cemas di lingkungan baru.", recommendation: "Ekspos bertahap dengan dukungan, latih teknik coping, dan validasi perasaan cemas anak." },
      { title: "Kesulitan Menjalin Pertemanan", severity: "MODERATE", description: "Anak mungkin kesulitan memulai atau mempertahankan hubungan pertemanan.", recommendation: "Fasilitasi playdate terstruktur, ajarkan cara bergabung dalam permainan, dan latih turn-taking." },
    ],
    typicalStrengths: ["Empati yang dalam", "Loyalitas terhadap orang terdekat", "Sensitivitas terhadap lingkungan"],
  },
  MULTIPLE_CHALLENGES: {
    primaryDomains: ["communication", "behavior", "social"],
    baseScores: { communication: 4, behavior: 4, social: 4, academic: 4, motor: 5, emotion: 4 },
    typicalIssues: [
      { title: "Kebutuhan Pendampingan Komprehensif", severity: "HIGH", description: "Anak menghadapi tantangan di beberapa area perkembangan yang saling mempengaruhi.", recommendation: "Dibutuhkan tim multi-disiplin: terapis wicara, terapis okupasi, dan psikolog perkembangan." },
      { title: "Prioritas Intervensi", severity: "HIGH", description: "Dengan beberapa area tantangan, penting menentukan prioritas intervensi yang tepat.", recommendation: "Fokus pada area yang paling berdampak pada kualitas hidup dan kemandirian anak terlebih dahulu." },
      { title: "Risiko Kelelahan Pengasuh", severity: "MODERATE", description: "Mendampingi anak dengan multi-tantangan dapat menyebabkan burnout pada orang tua/guru.", recommendation: "Bergabung dengan support group, jaga keseimbangan istirahat, dan manfaatkan respite care." },
    ],
    typicalStrengths: ["Ketahanan yang terbangun", "Kemampuan adaptasi", "Ikatan keluarga yang kuat"],
  },
};

// ─────────────────────────────────────────────
// Goal-based adjustments
// ─────────────────────────────────────────────

const GOAL_ADJUSTMENTS: Record<string, Partial<DomainScore>> = {
  "Meningkatkan kemampuan bicara": { communication: -1 },
  "Mengurangi tantrum": { behavior: -1, emotion: -1 },
  "Meningkatkan fokus belajar": { academic: -1 },
  "Meningkatkan interaksi sosial": { social: -1 },
  "Mengembangkan motorik halus": { motor: -1 },
  "Meningkatkan kemandirian": { behavior: -1, academic: -1 },
  "Mengelola emosi": { emotion: -1 },
  "Meningkatkan konsentrasi": { academic: -1, behavior: -1 },
};

// ─────────────────────────────────────────────
// Main insight generation
// ─────────────────────────────────────────────

export function generateInsight(assessment: Assessment): InsightResult {
  const profile = CHALLENGE_PROFILES[assessment.challengeType];

  // Calculate domain scores with age and goal adjustments
  const domainScores = { ...profile.baseScores };

  // Age-based adjustments (younger = more room for growth = slightly higher baseline)
  if (assessment.childAge <= 4) {
    Object.keys(domainScores).forEach(key => {
      domainScores[key as keyof DomainScore] = Math.min(10, domainScores[key as keyof DomainScore] + 1);
    });
  }

  // Goal-based adjustments (if user identified specific goals, lower those domain scores)
  assessment.goals.forEach(goal => {
    const adj = GOAL_ADJUSTMENTS[goal];
    if (adj) {
      Object.entries(adj).forEach(([key, val]) => {
        const k = key as keyof DomainScore;
        domainScores[k] = Math.max(1, domainScores[k] + (val ?? 0));
      });
    }
  });

  // Determine risk level
  const avgScore = Object.values(domainScores).reduce((a, b) => a + b, 0) / 6;
  const riskLevel: "LOW" | "MODERATE" | "HIGH" =
    avgScore <= 3.5 ? "HIGH" : avgScore <= 5.5 ? "MODERATE" : "LOW";

  // Generate summary (visible to free users)
  const summary = generateSummary(assessment, domainScores, riskLevel);

  // Generate detailed analysis (premium only)
  const detailedAnalysis = generateDetailedAnalysis(assessment, domainScores, profile);

  // Generate recommendations
  const recommendations = generateRecommendations(assessment, domainScores, profile);

  // Adjust issues based on child specifics
  const priorityIssues = profile.typicalIssues.map(issue => ({
    ...issue,
    description: issue.description.replace("Anak", assessment.childName),
  }));

  return {
    summary,
    detailedAnalysis,
    priorityIssues,
    domainScores,
    riskLevel,
    recommendations,
    strengths: profile.typicalStrengths,
  };
}

function generateSummary(
  assessment: Assessment,
  scores: DomainScore,
  riskLevel: string
): string {
  const weakDomains = Object.entries(scores)
    .filter(([, v]) => v <= 4)
    .map(([k]) => DOMAIN_LABELS[k as keyof DomainScore]);

  const strongDomains = Object.entries(scores)
    .filter(([, v]) => v >= 7)
    .map(([k]) => DOMAIN_LABELS[k as keyof DomainScore]);

  let summary = `Berdasarkan asesmen untuk ${assessment.childName} (usia ${assessment.childAge} tahun), `;

  if (riskLevel === "HIGH") {
    summary += `kami mengidentifikasi beberapa area yang membutuhkan perhatian segera. `;
  } else if (riskLevel === "MODERATE") {
    summary += `terdapat beberapa area yang perlu pendampingan lebih lanjut. `;
  } else {
    summary += `perkembangan anak secara umum menunjukkan tren positif dengan beberapa area yang dapat ditingkatkan. `;
  }

  if (weakDomains.length > 0) {
    summary += `Area yang perlu diperhatikan: ${weakDomains.join(", ")}. `;
  }
  if (strongDomains.length > 0) {
    summary += `Kekuatan yang teridentifikasi pada area: ${strongDomains.join(", ")}.`;
  }

  return summary;
}

function generateDetailedAnalysis(
  assessment: Assessment,
  scores: DomainScore,
  profile: typeof CHALLENGE_PROFILES[ChallengeType]
): string {
  const lines: string[] = [];

  lines.push(`## Analisis Mendalam - ${assessment.childName}`);
  lines.push("");
  lines.push(`### Profil Perkembangan`);
  lines.push(`${assessment.childName} berusia ${assessment.childAge} tahun dengan tantangan utama di area ${CHALLENGE_TYPE_DISPLAY[assessment.challengeType]}. Lingkungan belajar saat ini: ${ENV_LABELS[assessment.learningEnv]}.`);
  lines.push("");

  lines.push(`### Analisis Per Domain`);
  lines.push("");

  Object.entries(scores).forEach(([key, value]) => {
    const domain = key as keyof DomainScore;
    const label = DOMAIN_LABELS[domain];
    const isPrimary = profile.primaryDomains.includes(domain);
    const level = value <= 3 ? "Perlu Perhatian Serius" : value <= 5 ? "Perlu Pengembangan" : value <= 7 ? "Cukup Baik" : "Baik";

    lines.push(`**${label}** (Skor: ${value}/10 - ${level})${isPrimary ? " ⚠️ Area Prioritas" : ""}`);
    lines.push(getDomainDescription(domain, value, assessment.childAge));
    lines.push("");
  });

  if (assessment.challengeDetails) {
    lines.push(`### Catatan Tambahan dari Orang Tua`);
    lines.push(`"${assessment.challengeDetails}"`);
    lines.push("");
  }

  lines.push(`### Tujuan yang Diinginkan`);
  assessment.goals.forEach((goal, i) => {
    lines.push(`${i + 1}. ${goal}`);
  });

  return lines.join("\n");
}

function generateRecommendations(
  assessment: Assessment,
  scores: DomainScore,
  profile: typeof CHALLENGE_PROFILES[ChallengeType]
): Recommendation[] {
  const recs: Recommendation[] = [];

  // Free recommendations (always visible)
  recs.push({
    title: "Konsultasi dengan Pakar",
    description: `Berdasarkan profil ${assessment.childName}, disarankan untuk berkonsultasi dengan pakar yang mendalami ${CHALLENGE_TYPE_DISPLAY[assessment.challengeType]}.`,
    isPremium: false,
  });

  recs.push({
    title: "Lingkungan yang Mendukung",
    description: "Ciptakan lingkungan yang terstruktur, konsisten, dan mendukung di rumah maupun sekolah.",
    isPremium: false,
  });

  // Premium recommendations
  const weakDomains = Object.entries(scores)
    .filter(([, v]) => v <= 4)
    .sort(([, a], [, b]) => a - b);

  weakDomains.forEach(([domain]) => {
    const label = DOMAIN_LABELS[domain as keyof DomainScore];
    recs.push({
      title: `Rencana Intervensi ${label}`,
      description: `Program aktivitas mingguan yang dirancang khusus untuk meningkatkan kemampuan ${label.toLowerCase()} ${assessment.childName}. Termasuk checklist harian, milestone, dan panduan evaluasi.`,
      isPremium: true,
    });
  });

  recs.push({
    title: "Action Plan 14 Hari",
    description: `Rencana aksi personal selama 14 hari dengan aktivitas harian yang disesuaikan dengan kebutuhan ${assessment.childName}. Termasuk tracker progres dan rekomendasi penyesuaian.`,
    isPremium: true,
  });

  recs.push({
    title: "Laporan Perkembangan Lengkap",
    description: "Akses laporan detail dengan prediksi perkembangan, analisis tren, dan rekomendasi pakar. Export ke PDF untuk dibawa ke dokter atau terapis.",
    isPremium: true,
  });

  return recs;
}

function getDomainDescription(domain: keyof DomainScore, score: number, age: number): string {
  const descriptions: Record<keyof DomainScore, Record<string, string>> = {
    communication: {
      low: `Perkembangan komunikasi perlu perhatian khusus. Untuk usia ${age} tahun, diharapkan anak sudah mampu berkomunikasi dengan lebih efektif. Diperlukan stimulasi bahasa yang intensif.`,
      mid: `Kemampuan komunikasi berkembang namun masih di bawah rata-rata usia. Stimulasi bahasa secara konsisten akan membantu peningkatan.`,
      high: `Kemampuan komunikasi berkembang baik sesuai usia. Pertahankan stimulasi bahasa yang ada.`,
    },
    behavior: {
      low: `Terdapat tantangan perilaku yang signifikan. Dibutuhkan strategi manajemen perilaku yang konsisten dan terstruktur.`,
      mid: `Perilaku anak masih memerlukan pendampingan. Penerapan rutinitas yang konsisten akan membantu.`,
      high: `Perilaku anak secara umum terkontrol dengan baik. Terus pertahankan struktur dan konsistensi.`,
    },
    social: {
      low: `Keterampilan sosial memerlukan perhatian serius. Anak perlu dukungan untuk memahami dan berpartisipasi dalam interaksi sosial.`,
      mid: `Keterampilan sosial berkembang namun perlu difasilitasi lebih banyak kesempatan berinteraksi.`,
      high: `Keterampilan sosial berkembang dengan baik. Anak menunjukkan kemampuan berinteraksi yang sesuai usia.`,
    },
    academic: {
      low: `Kemampuan akademik memerlukan dukungan intensif. Metode pembelajaran perlu disesuaikan dengan gaya belajar anak.`,
      mid: `Kemampuan akademik berkembang dengan dukungan tambahan. Perlu strategi pembelajaran yang lebih terstruktur.`,
      high: `Kemampuan akademik berkembang sesuai harapan. Terus dukung dengan aktivitas belajar yang menarik.`,
    },
    motor: {
      low: `Perkembangan motorik perlu perhatian. Diperlukan latihan motorik halus dan kasar yang rutin.`,
      mid: `Perkembangan motorik cukup baik namun dapat ditingkatkan dengan aktivitas fisik yang lebih terstruktur.`,
      high: `Perkembangan motorik baik. Anak menunjukkan koordinasi yang sesuai usia.`,
    },
    emotion: {
      low: `Regulasi emosi menjadi tantangan utama. Anak memerlukan bantuan untuk mengenali dan mengelola emosinya.`,
      mid: `Kemampuan regulasi emosi berkembang namun masih sering memerlukan bantuan dari orang dewasa.`,
      high: `Regulasi emosi berkembang baik. Anak mulai mampu mengenali dan mengelola emosinya sendiri.`,
    },
  };

  const level = score <= 4 ? "low" : score <= 7 ? "mid" : "high";
  return descriptions[domain][level];
}

// ─────────────────────────────────────────────
// Labels
// ─────────────────────────────────────────────

export const DOMAIN_LABELS: Record<keyof DomainScore, string> = {
  communication: "Komunikasi",
  behavior: "Perilaku",
  social: "Sosial",
  academic: "Akademik",
  motor: "Motorik",
  emotion: "Emosi",
};

const CHALLENGE_TYPE_DISPLAY: Record<ChallengeType, string> = {
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  BEHAVIORAL_CHALLENGES: "Tantangan Perilaku",
  COMMUNICATION_ISSUES: "Masalah Komunikasi",
  SENSORY_PROCESSING: "Pemrosesan Sensorik",
  SOCIAL_EMOTIONAL: "Sosial & Emosional",
  MULTIPLE_CHALLENGES: "Multi-Tantangan",
};

const ENV_LABELS: Record<string, string> = {
  HOME: "Rumah",
  SCHOOL: "Sekolah",
  BOTH: "Rumah & Sekolah",
  THERAPY_CENTER: "Pusat Terapi",
};
