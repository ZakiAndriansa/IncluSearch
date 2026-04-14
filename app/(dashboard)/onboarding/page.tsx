"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowRight, CheckCircle2, ClipboardList, Bot, PenLine,
  Users, Heart, Sparkles, ChevronRight,
  MessageCircle, Zap, BookOpen, Target, Smile, RefreshCw,
  Home, School, Building2, Repeat2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { cn, CHALLENGE_TYPE_LABELS } from "@/lib/utils";

const CHALLENGE_OPTIONS = [
  { value: "COMMUNICATION_ISSUES", label: "Masalah Komunikasi", desc: "Keterlambatan bicara, sulit mengekspresikan diri", icon: MessageCircle, color: "text-blue-500 bg-blue-50" },
  { value: "BEHAVIORAL_CHALLENGES", label: "Tantangan Perilaku", desc: "Tantrum, sulit mengikuti aturan, agresi", icon: Zap, color: "text-amber-500 bg-amber-50" },
  { value: "LEARNING_DIFFICULTIES", label: "Kesulitan Belajar", desc: "Sulit fokus, membaca, menulis, berhitung", icon: BookOpen, color: "text-purple-500 bg-purple-50" },
  { value: "SENSORY_PROCESSING", label: "Pemrosesan Sensorik", desc: "Sensitif suara/cahaya, butuh stimulasi", icon: Target, color: "text-rose-500 bg-rose-50" },
  { value: "SOCIAL_EMOTIONAL", label: "Sosial & Emosional", desc: "Sulit berteman, cemas, regulasi emosi", icon: Smile, color: "text-teal-dark bg-teal-dark/10" },
  { value: "MULTIPLE_CHALLENGES", label: "Multi-Tantangan", desc: "Kombinasi beberapa tantangan di atas", icon: RefreshCw, color: "text-forest-500 bg-forest-50" },
];

const GOAL_OPTIONS = [
  "Meningkatkan kemampuan bicara",
  "Mengurangi tantrum",
  "Meningkatkan fokus belajar",
  "Meningkatkan interaksi sosial",
  "Mengembangkan motorik halus",
  "Meningkatkan kemandirian",
  "Mengelola emosi",
  "Meningkatkan konsentrasi",
];

const LEARNING_ENV_OPTIONS = [
  { value: "HOME", label: "Rumah", icon: Home, color: "text-emerald-500 bg-emerald-50" },
  { value: "SCHOOL", label: "Sekolah", icon: School, color: "text-blue-500 bg-blue-50" },
  { value: "BOTH", label: "Rumah & Sekolah", icon: Repeat2, color: "text-purple-500 bg-purple-50" },
  { value: "THERAPY_CENTER", label: "Pusat Terapi", icon: Building2, color: "text-rose-500 bg-rose-50" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Assessment form
  const [childName, setChildName] = useState("");
  const [childAge, setChildAge] = useState("");
  const [challengeType, setChallengeType] = useState("");
  const [challengeDetails, setChallengeDetails] = useState("");
  const [learningEnv, setLearningEnv] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const totalSteps = 5;
  const userName = session?.user?.name?.split(" ")[0] || "Bunda/Ayah";

  function toggleGoal(goal: string) {
    setGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal]);
  }

  async function handleCreateAssessment() {
    if (!childName.trim() || !childAge || !challengeType || !learningEnv) {
      toast({ title: "Lengkapi semua data", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          childName: childName.trim(),
          childAge: parseInt(childAge),
          challengeType,
          challengeDetails: challengeDetails || undefined,
          learningEnv: learningEnv,
          goals,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Gagal menyimpan");
      }

      setStep(5);
    } catch (err) {
      toast({
        title: "Gagal menyimpan asesmen",
        description: err instanceof Error ? err.message : "Coba lagi",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function completeOnboarding() {
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  async function skipOnboarding() {
    await fetch("/api/onboarding/complete", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4">
      <div className="w-full max-w-lg">

        {/* Progress */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex gap-1.5 flex-1 mr-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all duration-500",
                  i < step ? "bg-forest-400" : "bg-sand-200"
                )}
              />
            ))}
          </div>
          {step < 5 && (
            <button onClick={skipOnboarding} className="text-xs text-sand-400 hover:text-sand-600 transition-colors">
              Lewati
            </button>
          )}
        </div>

        {/* ═══ Step 1: Welcome ═══ */}
        {step === 1 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-forest-50 flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-forest-400" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-forest-600 mb-2">
              Selamat datang, {userName}!
            </h1>
            <p className="text-sand-500 text-sm leading-relaxed max-w-sm mx-auto mb-8">
              Mari siapkan profil anak Anda agar kami bisa memberikan insight,
              rekomendasi pakar, dan rencana aktivitas yang tepat.
            </p>

            <div className="space-y-3 text-left max-w-xs mx-auto mb-8">
              {[
                { icon: ClipboardList, text: "Isi data anak Anda", color: "text-forest-500 bg-forest-50" },
                { icon: Sparkles, text: "Dapatkan insight personal", color: "text-amber-500 bg-amber-50" },
                { icon: Bot, text: "Akses AI Pendamping 24/7", color: "text-blue-500 bg-blue-50" },
              ].map(({ icon: Icon, text, color }) => (
                <div key={text} className="flex items-center gap-3 p-3 rounded-xl bg-white border border-sand-200/80">
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", color.split(" ")[1])}>
                    <Icon className={cn("w-4 h-4", color.split(" ")[0])} />
                  </div>
                  <span className="text-sm text-forest-600 font-medium">{text}</span>
                </div>
              ))}
            </div>

            <Button onClick={() => setStep(2)} className="bg-forest-500 hover:bg-forest-600 text-white h-12 px-8 rounded-xl text-sm font-semibold shadow-sm">
              Mulai <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-[11px] text-sand-400 mt-3">Hanya butuh 2 menit</p>
          </div>
        )}

        {/* ═══ Step 2: Child Info ═══ */}
        {step === 2 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-serif font-bold text-forest-600 mb-1">Tentang Anak Anda</h2>
            <p className="text-sm text-sand-500 mb-6">Informasi dasar untuk personalisasi</p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-sand-600 mb-1.5 block">Nama Anak</label>
                <input
                  type="text"
                  value={childName}
                  onChange={e => setChildName(e.target.value)}
                  placeholder="Masukkan nama anak"
                  autoFocus
                  className="w-full border border-sand-200 rounded-xl px-4 py-3 text-sm text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/60 focus:border-forest-300 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-sand-600 mb-1.5 block">Usia (tahun)</label>
                <input
                  type="number"
                  value={childAge}
                  onChange={e => setChildAge(e.target.value)}
                  placeholder="Contoh: 4"
                  min={1}
                  max={18}
                  className="w-full border border-sand-200 rounded-xl px-4 py-3 text-sm text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/60 focus:border-forest-300 transition-all"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-sand-600 mb-2 block">Lingkungan Belajar</label>
                <div className="grid grid-cols-2 gap-2">
                  {LEARNING_ENV_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setLearningEnv(opt.value)}
                      className={cn(
                        "flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all",
                        learningEnv === opt.value
                          ? "border-forest-400 bg-forest-50/50 shadow-sm"
                          : "border-sand-200/80 hover:border-sand-300"
                      )}
                    >
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", opt.color.split(" ")[1])}>
                        <opt.icon className={cn("w-4 h-4", opt.color.split(" ")[0])} />
                      </div>
                      <span className={cn("text-xs font-medium", learningEnv === opt.value ? "text-forest-600" : "text-sand-600")}>
                        {opt.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-11 rounded-xl border-sand-200">
                Kembali
              </Button>
              <Button
                onClick={() => {
                  if (!childName.trim()) { toast({ title: "Isi nama anak", variant: "destructive" }); return; }
                  if (!childAge) { toast({ title: "Isi usia anak", variant: "destructive" }); return; }
                  if (!learningEnv) { toast({ title: "Pilih lingkungan belajar", variant: "destructive" }); return; }
                  setStep(3);
                }}
                className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white"
              >
                Lanjut <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 3: Challenge Type ═══ */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-serif font-bold text-forest-600 mb-1">
              Tantangan {childName}
            </h2>
            <p className="text-sm text-sand-500 mb-6">Pilih yang paling menggambarkan kondisi anak</p>

            <div className="space-y-2">
              {CHALLENGE_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChallengeType(opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all",
                    challengeType === opt.value
                      ? "border-forest-400 bg-forest-50/50 shadow-sm"
                      : "border-sand-200/80 hover:border-sand-300 hover:bg-sand-50/50"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", opt.color.split(" ")[1])}>
                    <opt.icon className={cn("w-5 h-5", opt.color.split(" ")[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", challengeType === opt.value ? "text-forest-600" : "text-sand-700")}>
                      {opt.label}
                    </div>
                    <div className="text-[11px] text-sand-400 mt-0.5">{opt.desc}</div>
                  </div>
                  {challengeType === opt.value && (
                    <CheckCircle2 className="w-5 h-5 text-forest-500 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>

            {/* Optional details */}
            <div className="mt-4">
              <label className="text-xs font-medium text-sand-600 mb-1.5 block">
                Detail tambahan (opsional)
              </label>
              <textarea
                value={challengeDetails}
                onChange={e => setChallengeDetails(e.target.value)}
                rows={2}
                placeholder="Ceritakan lebih lanjut tentang kondisi anak Anda..."
                className="w-full border border-sand-200 rounded-xl px-4 py-2.5 text-sm text-forest-600 resize-none focus:outline-none focus:ring-2 focus:ring-forest-200/60 transition-all"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-11 rounded-xl border-sand-200">
                Kembali
              </Button>
              <Button
                onClick={() => {
                  if (!challengeType) { toast({ title: "Pilih tantangan anak", variant: "destructive" }); return; }
                  setStep(4);
                }}
                className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white"
              >
                Lanjut <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 4: Goals ═══ */}
        {step === 4 && (
          <div className="animate-fade-in">
            <h2 className="text-xl font-serif font-bold text-forest-600 mb-1">
              Tujuan Anda untuk {childName}
            </h2>
            <p className="text-sm text-sand-500 mb-6">Pilih satu atau lebih tujuan</p>

            <div className="flex flex-wrap gap-2">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => toggleGoal(goal)}
                  className={cn(
                    "px-3.5 py-2 rounded-xl border-2 text-xs font-medium transition-all",
                    goals.includes(goal)
                      ? "border-forest-400 bg-forest-50 text-forest-600 shadow-sm"
                      : "border-sand-200/80 text-sand-600 hover:border-sand-300"
                  )}
                >
                  {goals.includes(goal) && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5" />}
                  {goal}
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-8">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-11 rounded-xl border-sand-200">
                Kembali
              </Button>
              <Button
                onClick={handleCreateAssessment}
                disabled={saving}
                className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white"
              >
                {saving ? "Menyimpan..." : "Simpan & Lihat Hasil"}
              </Button>
            </div>
          </div>
        )}

        {/* ═══ Step 5: Done ═══ */}
        {step === 5 && (
          <div className="text-center animate-fade-in">
            <div className="w-20 h-20 rounded-3xl bg-emerald-50 flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-serif font-bold text-forest-600 mb-2">
              Profil {childName} Siap!
            </h2>
            <p className="text-sm text-sand-500 max-w-sm mx-auto mb-8 leading-relaxed">
              Asesmen berhasil disimpan. Sekarang Anda bisa melihat insight, membuat action plan,
              dan mulai mencatat perkembangan {childName} setiap hari.
            </p>

            <div className="space-y-2 max-w-xs mx-auto mb-8">
              {[
                { label: "Lihat Insight Asesmen", desc: "Analisis kebutuhan & rekomendasi", href: "/profil?tab=asesmen", icon: Sparkles, color: "text-amber-500 bg-amber-50" },
                { label: "Tanya AI Pendamping", desc: "Tanya apa saja tentang anak Anda", href: "/ai-assistant", icon: Bot, color: "text-forest-500 bg-forest-50" },
                { label: "Tulis Jurnal Pertama", desc: "Catat perkembangan hari ini", href: "/jurnal", icon: PenLine, color: "text-blue-500 bg-blue-50" },
                { label: "Cari Pakar", desc: "Temukan pakar yang cocok", href: "/cari-pakar", icon: Users, color: "text-teal-dark bg-teal-dark/10" },
              ].map(({ label, desc, href, icon: Icon, color }) => (
                <button
                  key={href}
                  onClick={async () => {
                    await fetch("/api/onboarding/complete", { method: "POST" });
                    router.push(href);
                    router.refresh();
                  }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white border border-sand-200/80 hover:shadow-md hover:border-forest-200/60 transition-all text-left group"
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0", color.split(" ")[1])}>
                    <Icon className={cn("w-4 h-4", color.split(" ")[0])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-forest-600">{label}</div>
                    <div className="text-[11px] text-sand-400">{desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-sand-300 group-hover:text-forest-400 transition-colors flex-shrink-0" />
                </button>
              ))}
            </div>

            <Button onClick={completeOnboarding} variant="outline" className="border-sand-200 text-sand-500 rounded-xl">
              Langsung ke Dashboard
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
