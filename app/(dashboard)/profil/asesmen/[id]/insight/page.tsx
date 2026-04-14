"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Crown, Lock, AlertTriangle, CheckCircle2,
  TrendingUp, Brain, Heart, Users, BookOpen, Hand, Smile,
  ChevronRight, Sparkles, ClipboardList, Download,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

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
  isPremium?: boolean;
}

interface Insight {
  id: string;
  summary: string;
  detailedAnalysis: string | null;
  priorityIssues: PriorityIssue[];
  domainScores: DomainScore;
  riskLevel: string;
  recommendations: Recommendation[];
  strengths: string[];
  isPremium: boolean;
}

const DOMAIN_CONFIG: Record<keyof DomainScore, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  communication: { label: "Komunikasi", icon: Brain, color: "text-blue-600", bg: "bg-blue-50" },
  behavior: { label: "Perilaku", icon: ClipboardList, color: "text-orange-600", bg: "bg-orange-50" },
  social: { label: "Sosial", icon: Users, color: "text-green-600", bg: "bg-green-50" },
  academic: { label: "Akademik", icon: BookOpen, color: "text-purple-600", bg: "bg-purple-50" },
  motor: { label: "Motorik", icon: Hand, color: "text-red-600", bg: "bg-red-50" },
  emotion: { label: "Emosi", icon: Smile, color: "text-pink-600", bg: "bg-pink-50" },
};

export default function InsightPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [assessmentInfo, setAssessmentInfo] = useState<{ childName: string; childAge: number; challengeType: string } | null>(null);

  useEffect(() => {
    async function fetchInsight() {
      try {
        // Fetch insight
        const res = await fetch(`/api/assessments/${params.id}/insight`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        setInsight(data.insight);

        // Fetch assessment info for PDF export
        const aRes = await fetch(`/api/assessments/${params.id}`);
        if (aRes.ok) {
          const aData = await aRes.json();
          const a = aData.assessment || aData;
          setAssessmentInfo({ childName: a.childName, childAge: a.childAge, challengeType: a.challengeType });
        }
      } catch {
        router.push("/profil?tab=asesmen");
      } finally {
        setLoading(false);
      }
    }
    fetchInsight();
  }, [params.id, router]);

  async function handleExportPDF() {
    if (!insight || !assessmentInfo || !insight.isPremium) {
      toast({ title: "Fitur Premium", description: "Upgrade ke Premium untuk export laporan PDF.", variant: "destructive" });
      return;
    }
    try {
      const { exportInsightPDF } = await import("@/lib/pdf-export");
      exportInsightPDF(insight, assessmentInfo);
      toast({ title: "PDF berhasil dibuat!", description: "File akan otomatis terdownload." });
    } catch {
      toast({ title: "Gagal membuat PDF", variant: "destructive" });
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-sand-200 rounded-lg" />
        <div className="h-32 bg-sand-100 rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-24 bg-sand-100 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!insight) return null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-sand-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-sand-500" />
          </button>
          <div>
            <h1 className="text-xl font-serif font-bold text-forest-600">Insight Asesmen</h1>
            <p className="text-xs text-sand-400">Hasil analisis kebutuhan anak Anda</p>
          </div>
        </div>
        {insight.isPremium && (
          <Button onClick={handleExportPDF} variant="outline" size="sm" className="border-forest-200 text-forest-600 hover:bg-forest-50 rounded-xl">
            <Download className="w-4 h-4 mr-1.5" /> Export PDF
          </Button>
        )}
      </div>

      {/* Risk Level Badge */}
      <div className={cn(
        "rounded-2xl border p-4",
        insight.riskLevel === "HIGH" && "bg-red-50 border-red-200",
        insight.riskLevel === "MODERATE" && "bg-amber-50 border-amber-200",
        insight.riskLevel === "LOW" && "bg-green-50 border-green-200",
      )}>
        <div className="flex items-center gap-2 mb-2">
          {insight.riskLevel === "HIGH" && <AlertTriangle className="w-5 h-5 text-red-500" />}
          {insight.riskLevel === "MODERATE" && <AlertTriangle className="w-5 h-5 text-amber-500" />}
          {insight.riskLevel === "LOW" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          <span className={cn(
            "text-sm font-semibold",
            insight.riskLevel === "HIGH" && "text-red-700",
            insight.riskLevel === "MODERATE" && "text-amber-700",
            insight.riskLevel === "LOW" && "text-green-700",
          )}>
            Tingkat Perhatian: {insight.riskLevel === "HIGH" ? "Tinggi" : insight.riskLevel === "MODERATE" ? "Sedang" : "Rendah"}
          </span>
        </div>
        <p className="text-sm text-forest-600 leading-relaxed">{insight.summary}</p>
      </div>

      {/* Domain Scores */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-forest-500 mb-3">Profil Perkembangan</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(insight.domainScores).map(([key, value]) => {
            const config = DOMAIN_CONFIG[key as keyof DomainScore];
            const Icon = config.icon;
            const percentage = (value as number) * 10;
            return (
              <div key={key} className="bg-white rounded-xl border border-sand-200 p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", config.bg)}>
                    <Icon className={cn("w-4 h-4", config.color)} />
                  </div>
                  <div>
                    <div className="text-xs text-sand-400">{config.label}</div>
                    <div className="text-sm font-bold text-forest-500">{value as number}/10</div>
                  </div>
                </div>
                <div className="w-full h-2 bg-sand-100 rounded-full overflow-hidden">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all duration-1000",
                      percentage >= 70 ? "bg-green-500" : percentage >= 40 ? "bg-amber-500" : "bg-red-500"
                    )}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Priority Issues */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-forest-500 mb-3">Prioritas Masalah</h2>
        <div className="space-y-3">
          {insight.priorityIssues.map((issue, i) => {
            const isLocked = issue.title === "🔒 Premium";
            return (
              <div key={i} className={cn(
                "bg-white rounded-xl border border-sand-200 p-4",
                isLocked && "relative overflow-hidden"
              )}>
                {isLocked && (
                  <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <div className="text-center">
                      <Lock className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                      <p className="text-xs text-sand-500">Premium Only</p>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                    issue.severity === "HIGH" ? "bg-red-500" : issue.severity === "MODERATE" ? "bg-amber-500" : "bg-green-500"
                  )} />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-forest-500">{issue.title}</h3>
                      <span className={cn(
                        "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                        issue.severity === "HIGH" ? "bg-red-50 text-red-600" : issue.severity === "MODERATE" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
                      )}>
                        {issue.severity === "HIGH" ? "Prioritas" : issue.severity === "MODERATE" ? "Sedang" : "Rendah"}
                      </span>
                    </div>
                    <p className="text-xs text-sand-500 leading-relaxed mb-2">{issue.description}</p>
                    <div className="flex items-start gap-1.5 bg-forest-50 rounded-lg p-2">
                      <Sparkles className="w-3.5 h-3.5 text-forest-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs text-forest-600">{issue.recommendation}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Detailed Analysis (Premium) */}
      {insight.detailedAnalysis ? (
        <section>
          <h2 className="text-lg font-serif font-semibold text-forest-500 mb-3">Analisis Mendalam</h2>
          <div className="bg-white rounded-xl border border-sand-200 p-4 prose prose-sm max-w-none text-forest-600">
            {insight.detailedAnalysis.split("\n").map((line, i) => {
              if (line.startsWith("## ")) return <h2 key={i} className="text-base font-serif font-bold text-forest-500 mt-4 mb-2">{line.replace("## ", "")}</h2>;
              if (line.startsWith("### ")) return <h3 key={i} className="text-sm font-semibold text-forest-500 mt-3 mb-1">{line.replace("### ", "")}</h3>;
              if (line.startsWith("**") && line.endsWith("**")) return <p key={i} className="font-semibold text-sm mt-2">{line.replace(/\*\*/g, "")}</p>;
              if (line.startsWith("**")) return <p key={i} className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>") }} />;
              if (line.match(/^\d+\./)) return <p key={i} className="text-sm ml-4">{line}</p>;
              if (line.trim() === "") return <br key={i} />;
              return <p key={i} className="text-xs text-sand-500 leading-relaxed">{line}</p>;
            })}
          </div>
        </section>
      ) : (
        <section>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-6 text-center">
            <Lock className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <h3 className="text-base font-semibold text-amber-700 mb-1">Analisis Mendalam Terkunci</h3>
            <p className="text-sm text-amber-600 mb-4 max-w-md mx-auto">
              Upgrade ke Premium untuk membuka analisis mendalam per domain, rekomendasi intervensi personal, dan prediksi perkembangan.
            </p>
            <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white">
              <Link href="/profil?tab=premium">
                <Crown className="w-4 h-4 mr-2" /> Buka Insight Lengkap
              </Link>
            </Button>
          </div>
        </section>
      )}

      {/* Strengths */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-forest-500 mb-3">Kekuatan yang Teridentifikasi</h2>
        <div className="flex flex-wrap gap-2">
          {insight.strengths.map((strength, i) => (
            <span key={i} className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-full px-3 py-1.5">
              <CheckCircle2 className="w-3 h-3 inline mr-1" /> {strength}
            </span>
          ))}
        </div>
      </section>

      {/* Recommendations */}
      <section>
        <h2 className="text-lg font-serif font-semibold text-forest-500 mb-3">Rekomendasi</h2>
        <div className="space-y-2">
          {insight.recommendations.map((rec, i) => (
            <div key={i} className="bg-white rounded-xl border border-sand-200 p-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-forest-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-forest-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-forest-500">{rec.title}</h3>
                <p className="text-xs text-sand-500 mt-0.5">{rec.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-sand-300 flex-shrink-0 mt-1" />
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <div className="grid sm:grid-cols-2 gap-3">
        <Button asChild variant="outline" className="border-forest-200 text-forest-500 hover:bg-forest-50">
          <Link href="/cari-pakar">
            <Users className="w-4 h-4 mr-2" /> Cari Pakar yang Sesuai
          </Link>
        </Button>
        <Button asChild className="bg-forest-500 hover:bg-forest-600 text-white">
          <Link href="/action-plan">
            <ClipboardList className="w-4 h-4 mr-2" /> Buat Action Plan
          </Link>
        </Button>
      </div>
    </div>
  );
}
