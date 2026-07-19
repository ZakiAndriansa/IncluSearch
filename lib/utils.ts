import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export function formatDateTime(date: Date | string): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function formatRelativeTime(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return "Baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  if (diffHours < 24) return `${diffHours} jam lalu`;
  if (diffDays < 7) return `${diffDays} hari lalu`;
  return formatDate(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function generateOrderId(prefix: string = "ORD"): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  // crypto.randomUUID has far more entropy than Math.random — avoids order-id
  // collisions (which would fail the unique constraint on midtransOrderId).
  const random = crypto.randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "…";
}

export const DAYS_OF_WEEK = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const CHALLENGE_TYPE_LABELS: Record<string, string> = {
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  BEHAVIORAL_CHALLENGES: "Tantangan Perilaku",
  COMMUNICATION_ISSUES: "Masalah Komunikasi",
  SENSORY_PROCESSING: "Pemrosesan Sensorik",
  SOCIAL_EMOTIONAL: "Sosial & Emosional",
  MULTIPLE_CHALLENGES: "Multi-Tantangan",
};

export const SPECIALIZATION_LABELS: Record<string, string> = {
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  BEHAVIORAL_SUPPORT: "Dukungan Perilaku",
  COMMUNICATION_DISORDERS: "Gangguan Komunikasi",
  SENSORY_PROCESSING: "Pemrosesan Sensorik",
  AUTISM_SPECTRUM: "Spektrum Autisme",
  ADHD: "ADHD",
  DOWN_SYNDROME: "Down Syndrome",
  EMOTIONAL_REGULATION: "Regulasi Emosi",
  SOCIAL_SKILLS: "Keterampilan Sosial",
  MOTOR_DEVELOPMENT: "Perkembangan Motorik",
};

export const CATEGORY_LABELS: Record<string, string> = {
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  BEHAVIORAL_SUPPORT: "Dukungan Perilaku",
  COMMUNICATION_DISORDERS: "Gangguan Komunikasi",
  SENSORY_PROCESSING: "Pemrosesan Sensorik",
  PARENTING_TIPS: "Tips Parenting",
  EXPERT_GUIDES: "Panduan Pakar",
  CASE_STUDIES: "Studi Kasus",
};

export const ABK_FOCUS_LABELS: Record<string, string> = {
  AUTISM: "Autisme",
  ADHD: "ADHD",
  DOWN_SYNDROME: "Down Syndrome",
  DYSLEXIA: "Disleksia",
  HEARING_IMPAIRMENT: "Gangguan Pendengaran",
  VISUAL_IMPAIRMENT: "Gangguan Penglihatan",
  CEREBRAL_PALSY: "Cerebral Palsy",
  INTELLECTUAL_DISABILITY: "Disabilitas Intelektual",
  MULTIPLE_DISABILITIES: "Multi-Disabilitas",
  GENERAL_ABK: "ABK Umum",
};
