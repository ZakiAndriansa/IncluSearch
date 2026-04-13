"use client";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─────────────────────────────────────────────
// Shared helpers
// ─────────────────────────────────────────────

const BRAND = { forest: [30, 70, 32], teal: [52, 108, 112], sand: [136, 132, 122], white: [255, 255, 255] } as const;

function rgb(c: readonly number[]): [number, number, number] {
  return [c[0], c[1], c[2]];
}

function addHeader(doc: jsPDF, title: string, subtitle: string) {
  // Green header bar
  doc.setFillColor(...rgb(BRAND.forest));
  doc.rect(0, 0, 210, 32, "F");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...rgb(BRAND.white));
  doc.text("IncluSearch", 14, 14);

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(200, 220, 200);
  doc.text("Platform Pendampingan ABK", 14, 20);

  // Title
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...rgb(BRAND.white));
  doc.text(title, 14, 28);

  // Subtitle below header
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...rgb(BRAND.sand));
  doc.text(subtitle, 14, 38);
}

function addFooter(doc: jsPDF) {
  const pageCount = (doc as any).getNumberOfPages?.() ?? doc.internal.pages.length - 1;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...rgb(BRAND.sand));
    doc.text(
      `IncluSearch - Laporan ini dibuat otomatis pada ${new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
      14,
      287
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, 196, 287, { align: "right" });
    // Bottom line
    doc.setDrawColor(220, 220, 216);
    doc.setLineWidth(0.3);
    doc.line(14, 284, 196, 284);
  }
}

function sectionTitle(doc: jsPDF, text: string, y: number): number {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...rgb(BRAND.forest));
  doc.text(text, 14, y);
  return y + 6;
}

function bodyText(doc: jsPDF, text: string, y: number, maxWidth = 180): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 56);
  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 14, y);
  return y + lines.length * 4.5;
}

// ─────────────────────────────────────────────
// Export: Assessment Insight
// ─────────────────────────────────────────────

interface DomainScore {
  communication: number;
  behavior: number;
  social: number;
  academic: number;
  motor: number;
  emotion: number;
}

interface PriorityIssue {
  title: string;
  severity: string;
  description: string;
  recommendation: string;
}

interface Recommendation {
  title: string;
  description: string;
}

interface InsightData {
  summary: string;
  detailedAnalysis: string | null;
  priorityIssues: PriorityIssue[];
  domainScores: DomainScore;
  riskLevel: string;
  recommendations: Recommendation[];
  strengths: string[];
}

interface AssessmentInfo {
  childName: string;
  childAge: number;
  challengeType: string;
}

const DOMAIN_LABELS: Record<string, string> = {
  communication: "Komunikasi",
  behavior: "Perilaku",
  social: "Sosial",
  academic: "Akademik",
  motor: "Motorik",
  emotion: "Emosi",
};

export function exportInsightPDF(insight: InsightData, assessment: AssessmentInfo) {
  const doc = new jsPDF();

  addHeader(doc, `Laporan Insight - ${assessment.childName}`, `Usia ${assessment.childAge} tahun | Dibuat ${new Date().toLocaleDateString("id-ID")}`);

  let y = 46;

  // Risk level badge
  const riskLabel = insight.riskLevel === "HIGH" ? "Tinggi" : insight.riskLevel === "MODERATE" ? "Sedang" : "Rendah";
  const riskColor: [number, number, number] = insight.riskLevel === "HIGH" ? [220, 50, 50] : insight.riskLevel === "MODERATE" ? [210, 150, 30] : [34, 170, 80];
  doc.setFillColor(...riskColor);
  doc.roundedRect(14, y, 45, 7, 2, 2, "F");
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text(`Tingkat Perhatian: ${riskLabel}`, 16, y + 5);
  y += 14;

  // Summary
  y = sectionTitle(doc, "Ringkasan", y);
  y = bodyText(doc, insight.summary, y);
  y += 4;

  // Domain Scores table
  y = sectionTitle(doc, "Profil Perkembangan", y);

  const domainData = Object.entries(insight.domainScores).map(([key, value]) => {
    const score = value as number;
    const level = score <= 3 ? "Perlu Perhatian" : score <= 5 ? "Perlu Pengembangan" : score <= 7 ? "Cukup Baik" : "Baik";
    return [DOMAIN_LABELS[key] || key, `${score}/10`, level];
  });

  autoTable(doc, {
    startY: y,
    head: [["Domain", "Skor", "Status"]],
    body: domainData,
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 3, textColor: [50, 50, 46] },
    headStyles: { fillColor: rgb(BRAND.forest), textColor: rgb(BRAND.white), fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 248, 243] },
    margin: { left: 14, right: 14 },
  });

  y = (doc as any).lastAutoTable.finalY + 8;

  // Priority Issues
  if (insight.priorityIssues.length > 0) {
    if (y > 240) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Prioritas Masalah", y);

    insight.priorityIssues.forEach((issue, i) => {
      if (y > 260) { doc.addPage(); y = 20; }
      const sevLabel = issue.severity === "HIGH" ? "PRIORITAS" : issue.severity === "MODERATE" ? "SEDANG" : "RENDAH";

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...rgb(BRAND.forest));
      doc.text(`${i + 1}. ${issue.title} [${sevLabel}]`, 14, y);
      y += 5;

      y = bodyText(doc, issue.description, y);
      y += 1;

      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(...rgb(BRAND.teal));
      const recLines = doc.splitTextToSize(`Rekomendasi: ${issue.recommendation}`, 176);
      doc.text(recLines, 18, y);
      y += recLines.length * 4 + 4;
    });
  }

  // Strengths
  if (insight.strengths.length > 0) {
    if (y > 260) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Kekuatan yang Teridentifikasi", y);
    insight.strengths.forEach(s => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(60, 60, 56);
      doc.text(`  +  ${s}`, 14, y);
      y += 5;
    });
    y += 3;
  }

  // Recommendations
  if (insight.recommendations.length > 0) {
    if (y > 250) { doc.addPage(); y = 20; }
    y = sectionTitle(doc, "Rekomendasi", y);
    insight.recommendations.forEach((rec, i) => {
      if (y > 265) { doc.addPage(); y = 20; }
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...rgb(BRAND.forest));
      doc.text(`${i + 1}. ${rec.title}`, 14, y);
      y += 5;
      y = bodyText(doc, rec.description, y, 176);
      y += 3;
    });
  }

  // Detailed Analysis
  if (insight.detailedAnalysis) {
    doc.addPage();
    y = 20;
    y = sectionTitle(doc, "Analisis Mendalam", y);

    const analysisLines = insight.detailedAnalysis.split("\n");
    analysisLines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 20; }
      if (line.startsWith("## ") || line.startsWith("### ")) {
        y += 3;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.setTextColor(...rgb(BRAND.forest));
        doc.text(line.replace(/^#+\s/, ""), 14, y);
        y += 6;
      } else if (line.startsWith("**")) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 56);
        doc.text(line.replace(/\*\*/g, ""), 14, y);
        y += 5;
      } else if (line.trim()) {
        y = bodyText(doc, line, y);
        y += 1;
      } else {
        y += 3;
      }
    });
  }

  addFooter(doc);
  doc.save(`IncluSearch_Insight_${assessment.childName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─────────────────────────────────────────────
// Export: Journal entries
// ─────────────────────────────────────────────

interface JournalEntry {
  date: string;
  childName: string;
  mood: string;
  sleepQuality?: string;
  appetiteLevel?: string;
  tantrumCount: number;
  achievements: string[];
  challenges: string[];
  activities: string[];
  notes?: string;
}

const MOOD_LABELS: Record<string, string> = {
  VERY_HAPPY: "Sangat Senang",
  HAPPY: "Senang",
  NEUTRAL: "Biasa",
  SAD: "Sedih",
  VERY_SAD: "Sangat Sedih",
};

const SLEEP_LABELS: Record<string, string> = {
  VERY_GOOD: "Sangat Nyenyak",
  GOOD: "Nyenyak",
  FAIR: "Cukup",
  POOR: "Kurang",
  VERY_POOR: "Sulit Tidur",
};

const APPETITE_LABELS: Record<string, string> = {
  VERY_GOOD: "Lahap Sekali",
  GOOD: "Makan Baik",
  FAIR: "Cukup",
  POOR: "Kurang",
  REFUSED: "Menolak Makan",
};

export function exportJournalPDF(journals: JournalEntry[], childName: string) {
  const doc = new jsPDF();

  const dateRange = journals.length > 0
    ? `${formatDateID(journals[journals.length - 1].date)} - ${formatDateID(journals[0].date)}`
    : "";

  addHeader(doc, `Jurnal Harian - ${childName}`, `${journals.length} catatan | ${dateRange}`);

  let y = 46;

  // Summary stats
  if (journals.length > 0) {
    const moodValues: Record<string, number> = { VERY_SAD: 1, SAD: 2, NEUTRAL: 3, HAPPY: 4, VERY_HAPPY: 5 };
    const avgMood = journals.reduce((s, j) => s + (moodValues[j.mood] || 3), 0) / journals.length;
    const totalTantrums = journals.reduce((s, j) => s + j.tantrumCount, 0);
    const totalAchievements = journals.reduce((s, j) => s + j.achievements.length, 0);

    y = sectionTitle(doc, "Ringkasan Periode", y);

    autoTable(doc, {
      startY: y,
      body: [
        ["Mood Rata-rata", `${avgMood.toFixed(1)}/5`],
        ["Total Tantrum", `${totalTantrums}x (rata-rata ${(totalTantrums / journals.length).toFixed(1)}x/hari)`],
        ["Total Pencapaian", `${totalAchievements} pencapaian`],
        ["Jumlah Catatan", `${journals.length} hari`],
      ],
      theme: "plain",
      styles: { fontSize: 9, cellPadding: 2.5 },
      columnStyles: {
        0: { fontStyle: "bold", textColor: rgb(BRAND.forest), cellWidth: 50 },
        1: { textColor: [60, 60, 56] },
      },
      margin: { left: 14, right: 14 },
    });

    y = (doc as any).lastAutoTable.finalY + 8;
  }

  // Detail per day
  y = sectionTitle(doc, "Detail Harian", y);
  y += 2;

  journals.forEach((journal, idx) => {
    if (y > 240) { doc.addPage(); y = 20; }

    // Date header
    doc.setFillColor(243, 248, 243);
    doc.roundedRect(14, y - 4, 182, 8, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...rgb(BRAND.forest));
    doc.text(formatDateID(journal.date), 17, y + 1);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...rgb(BRAND.sand));
    doc.text(`Mood: ${MOOD_LABELS[journal.mood] || journal.mood}`, 100, y + 1);
    y += 10;

    // Stats row
    const stats: string[] = [];
    if (journal.sleepQuality) stats.push(`Tidur: ${SLEEP_LABELS[journal.sleepQuality] || journal.sleepQuality}`);
    if (journal.appetiteLevel) stats.push(`Makan: ${APPETITE_LABELS[journal.appetiteLevel] || journal.appetiteLevel}`);
    if (journal.tantrumCount > 0) stats.push(`Tantrum: ${journal.tantrumCount}x`);

    if (stats.length > 0) {
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 94);
      doc.text(stats.join("  |  "), 17, y);
      y += 5;
    }

    // Achievements
    if (journal.achievements.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(34, 150, 80);
      doc.text("Pencapaian:", 17, y);
      doc.setFont("helvetica", "normal");
      doc.text(journal.achievements.join(", "), 45, y);
      y += 5;
    }

    // Activities
    if (journal.activities.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(50, 100, 180);
      doc.text("Aktivitas:", 17, y);
      doc.setFont("helvetica", "normal");
      const actText = doc.splitTextToSize(journal.activities.join(", "), 145);
      doc.text(actText, 43, y);
      y += actText.length * 4;
      y += 1;
    }

    // Challenges
    if (journal.challenges.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(180, 120, 30);
      doc.text("Tantangan:", 17, y);
      doc.setFont("helvetica", "normal");
      doc.text(journal.challenges.join(", "), 45, y);
      y += 5;
    }

    // Notes
    if (journal.notes) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(120, 118, 110);
      const noteLines = doc.splitTextToSize(`"${journal.notes}"`, 165);
      doc.text(noteLines, 17, y);
      y += noteLines.length * 4;
    }

    y += 6;
  });

  addFooter(doc);
  doc.save(`IncluSearch_Jurnal_${childName.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`);
}

function formatDateID(date: string): string {
  return new Date(date).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
