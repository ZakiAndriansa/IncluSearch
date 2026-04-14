"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Plus, CheckCircle2, Circle, Calendar, Target,
  ChevronDown, ChevronUp, Crown, ArrowRight, Sparkles,
  ClipboardList, Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn, formatDate } from "@/lib/utils";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  domain: string;
  dayOfWeek: number | null;
  isCompleted: boolean;
  completedAt: string | null;
}

interface Plan {
  id: string;
  title: string;
  weekNumber: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  domain: string;
  goalText: string;
  activities: Activity[];
  assessment?: { childName: string; challengeType: string } | null;
}

const DOMAIN_LABELS: Record<string, string> = {
  COMMUNICATION: "Komunikasi",
  BEHAVIOR: "Perilaku",
  SOCIAL: "Sosial",
  ACADEMIC: "Akademik",
  MOTOR: "Motorik",
  EMOTION: "Emosi",
};

const DOMAIN_COLORS: Record<string, string> = {
  COMMUNICATION: "bg-blue-100 text-blue-700",
  BEHAVIOR: "bg-orange-100 text-orange-700",
  SOCIAL: "bg-green-100 text-green-700",
  ACADEMIC: "bg-purple-100 text-purple-700",
  MOTOR: "bg-red-100 text-red-700",
  EMOTION: "bg-pink-100 text-pink-700",
};

const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export default function ActionPlanPage() {
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedPlan, setExpandedPlan] = useState<string | null>(null);
  const [assessmentId, setAssessmentId] = useState<string | null>(null);

  const fetchPlans = useCallback(async () => {
    const res = await fetch("/api/action-plans");
    if (res.ok) {
      const data = await res.json();
      setPlans(data.plans);
      if (data.plans.length > 0 && !expandedPlan) {
        const active = data.plans.find((p: Plan) => p.isActive);
        setExpandedPlan(active?.id || data.plans[0].id);
      }
    }
    setLoading(false);
  }, [expandedPlan]);

  useEffect(() => {
    fetchPlans();
    // Get active assessment
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.assessments) ? data.assessments : Array.isArray(data) ? data : [];
        if (list.length > 0) setAssessmentId(list[0].id);
      })
      .catch(() => {});
  }, [fetchPlans]);

  async function createPlan() {
    if (!assessmentId) return;
    setCreating(true);
    try {
      const res = await fetch("/api/action-plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId }),
      });
      if (res.ok) {
        toast({ title: "Action Plan berhasil dibuat!", description: "Ikuti aktivitas mingguan untuk perkembangan anak." });
        fetchPlans();
      } else {
        const err = await res.json();
        const message = err.error || "Gagal membuat plan";
        // If it's a premium limit error, show upgrade toast
        if (res.status === 403) {
          toast({
            title: "Batas Plan Tercapai",
            description: "Upgrade ke Premium untuk membuat plan tanpa batas.",
            action: (
              <Link href="/profil?tab=premium" className="text-xs font-semibold bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                Upgrade
              </Link>
            ),
          });
        } else {
          toast({ title: "Gagal membuat plan", description: message, variant: "destructive" });
        }
      }
    } finally {
      setCreating(false);
    }
  }

  async function toggleActivity(planId: string, activityId: string, completed: boolean) {
    const res = await fetch(`/api/action-plans/${planId}/complete-activity`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityId, completed: !completed }),
    });
    if (res.ok) {
      setPlans((prev) =>
        prev.map((plan) =>
          plan.id === planId
            ? {
                ...plan,
                activities: plan.activities.map((a) =>
                  a.id === activityId ? { ...a, isCompleted: !completed, completedAt: !completed ? new Date().toISOString() : null } : a
                ),
              }
            : plan
        )
      );
    }
  }

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-sand-200 rounded-lg" />
        <div className="h-48 bg-sand-100 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold text-forest-500">Action Plan</h1>
          <p className="text-xs text-sand-400 mt-0.5">Rencana aktivitas mingguan untuk mendukung perkembangan anak</p>
        </div>
        {assessmentId && (
          <Button
            onClick={createPlan}
            disabled={creating}
            size="sm"
            className="bg-forest-500 hover:bg-forest-600 text-white"
          >
            <Plus className="w-4 h-4 mr-1" /> {creating ? "Membuat..." : "Plan Baru"}
          </Button>
        )}
      </div>

      {!assessmentId && (
        <div className="bg-white rounded-2xl border border-sand-200 p-8 text-center">
          <ClipboardList className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-forest-500 mb-1">Isi Assessment Dulu</h3>
          <p className="text-xs text-sand-400 mb-3">Buat assessment anak terlebih dahulu untuk mendapatkan action plan yang personal.</p>
          <Button asChild size="sm" className="bg-forest-500 hover:bg-forest-600 text-white">
            <Link href="/profil?tab=asesmen">Buat Assessment <ArrowRight className="w-3 h-3 ml-1" /></Link>
          </Button>
        </div>
      )}

      {plans.length === 0 && assessmentId && (
        <div className="bg-white rounded-2xl border border-sand-200 p-8 text-center">
          <Target className="w-10 h-10 text-sand-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-forest-500 mb-1">Belum ada action plan</h3>
          <p className="text-xs text-sand-400 mb-3">Buat rencana aktivitas mingguan berdasarkan assessment anak Anda.</p>
          <Button onClick={createPlan} disabled={creating} size="sm" className="bg-forest-500 hover:bg-forest-600 text-white">
            <Sparkles className="w-4 h-4 mr-1" /> Buat Action Plan Pertama
          </Button>
        </div>
      )}

      {/* Plans */}
      <div className="space-y-4">
        {plans.map((plan) => {
          const isExpanded = expandedPlan === plan.id;
          const completedCount = plan.activities.filter((a) => a.isCompleted).length;
          const totalCount = plan.activities.length;
          const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div key={plan.id} className={cn("bg-white rounded-2xl border transition-all", plan.isActive ? "border-forest-200 shadow-sm" : "border-sand-200")}>
              {/* Plan Header */}
              <button
                onClick={() => setExpandedPlan(isExpanded ? null : plan.id)}
                className="w-full p-4 flex items-center gap-3 text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-semibold text-forest-500 truncate">{plan.title}</h3>
                    {plan.isActive && (
                      <span className="text-[10px] bg-forest-50 text-forest-600 px-1.5 py-0.5 rounded-full font-medium">Aktif</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-sand-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(plan.startDate)} - {formatDate(plan.endDate)}
                    </span>
                    <span className={cn("px-1.5 py-0.5 rounded-full text-[10px] font-medium", DOMAIN_COLORS[plan.domain])}>
                      {DOMAIN_LABELS[plan.domain]}
                    </span>
                  </div>
                </div>

                {/* Progress */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-sm font-bold text-forest-500">{progress}%</div>
                    <div className="text-[10px] text-sand-400">{completedCount}/{totalCount}</div>
                  </div>
                  <div className="w-10 h-10 relative">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                      <path d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831" fill="none" stroke="#e5e5e0" strokeWidth="3" />
                      <path
                        d="M18 2.0845a15.9155 15.9155 0 0 1 0 31.831a15.9155 15.9155 0 0 1 0-31.831"
                        fill="none"
                        stroke={progress >= 80 ? "#22c55e" : progress >= 40 ? "#f59e0b" : "#e5e5e0"}
                        strokeWidth="3"
                        strokeDasharray={`${progress}, 100`}
                      />
                    </svg>
                    {progress === 100 && (
                      <Trophy className="w-4 h-4 text-green-500 absolute inset-0 m-auto" />
                    )}
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-sand-400" /> : <ChevronDown className="w-4 h-4 text-sand-400" />}
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-sand-100">
                  {/* Goal */}
                  <div className="bg-forest-50 rounded-xl p-3 mt-3 mb-4">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Target className="w-3.5 h-3.5 text-forest-500" />
                      <span className="text-xs font-semibold text-forest-600">Target Minggu Ini</span>
                    </div>
                    <p className="text-xs text-forest-500 leading-relaxed">{plan.goalText}</p>
                  </div>

                  {/* Activities */}
                  <div className="space-y-2">
                    {plan.activities.map((activity) => (
                      <div
                        key={activity.id}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer",
                          activity.isCompleted
                            ? "bg-green-50/50 border-green-200"
                            : "bg-white border-sand-200 hover:border-forest-200"
                        )}
                        onClick={() => toggleActivity(plan.id, activity.id, activity.isCompleted)}
                      >
                        {activity.isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <Circle className="w-5 h-5 text-sand-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <h4 className={cn("text-sm font-medium", activity.isCompleted ? "text-green-700 line-through" : "text-forest-500")}>
                              {activity.title}
                            </h4>
                            {activity.dayOfWeek !== null && (
                              <span className="text-[10px] bg-sand-100 text-sand-500 px-1.5 py-0.5 rounded">{DAYS[activity.dayOfWeek]}</span>
                            )}
                            <span className={cn("text-[10px] px-1.5 py-0.5 rounded", DOMAIN_COLORS[activity.domain])}>
                              {DOMAIN_LABELS[activity.domain]}
                            </span>
                          </div>
                          {activity.description && (
                            <p className={cn("text-xs leading-relaxed", activity.isCompleted ? "text-green-600/70" : "text-sand-500")}>
                              {activity.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Next week CTA when plan is complete */}
                  {plan.isActive && progress === 100 && (
                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                          <Trophy className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-semibold text-emerald-700">Semua aktivitas selesai!</div>
                          <p className="text-xs text-emerald-600/80 mt-0.5">
                            Lanjutkan ke minggu berikutnya dengan aktivitas baru yang lebih progresif.
                          </p>
                        </div>
                        <Button
                          onClick={createPlan}
                          disabled={creating}
                          size="sm"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white flex-shrink-0"
                        >
                          {creating ? "Membuat..." : "Minggu Berikutnya"} <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Encouragement when plan is partially complete */}
                  {plan.isActive && progress > 0 && progress < 100 && (
                    <div className="mt-3 flex items-center gap-2 text-xs text-sand-500">
                      <div className="w-full bg-sand-100 rounded-full h-1.5">
                        <div
                          className={cn("h-1.5 rounded-full transition-all duration-500", progress >= 80 ? "bg-emerald-400" : progress >= 40 ? "bg-amber-400" : "bg-sand-300")}
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="flex-shrink-0">{completedCount}/{totalCount} selesai</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
