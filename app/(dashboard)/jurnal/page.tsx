"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Plus, Calendar, Moon, Utensils, AlertCircle, CheckCircle2,
  TrendingUp, TrendingDown, Minus, Crown, Pencil, X,
  Smile, CloudMoon, Apple, Zap, Star, Heart, Download,
  Laugh, Meh, Frown, CloudRain,
  MoonStar, Coffee, BedDouble, EyeOff, AlarmClock,
  UtensilsCrossed, Salad, CupSoda, ThumbsDown, Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn, formatDate } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import Link from "next/link";

interface Journal {
  id: string;
  date: string;
  childName: string;
  mood: string;
  sleepQuality?: string;
  appetiteLevel?: string;
  tantrumCount: number;
  achievements: string[];
  challenges: string[];
  behaviors: string[];
  activities: string[];
  notes?: string;
}

interface Trends {
  avgMood: number;
  avgTantrums: number;
  moodTrend: string;
  totalEntries: number;
  totalAchievements: number;
}

const MOOD_OPTIONS = [
  { value: "VERY_HAPPY", label: "Luar Biasa", icon: Laugh, bg: "bg-emerald-50", border: "border-emerald-300", text: "text-emerald-700", iconColor: "text-emerald-500" },
  { value: "HAPPY", label: "Senang", icon: Smile, bg: "bg-green-50", border: "border-green-300", text: "text-green-700", iconColor: "text-green-500" },
  { value: "NEUTRAL", label: "Biasa", icon: Meh, bg: "bg-slate-50", border: "border-slate-300", text: "text-slate-700", iconColor: "text-slate-400" },
  { value: "SAD", label: "Sedih", icon: Frown, bg: "bg-blue-50", border: "border-blue-300", text: "text-blue-700", iconColor: "text-blue-500" },
  { value: "VERY_SAD", label: "Sangat Sedih", icon: CloudRain, bg: "bg-red-50", border: "border-red-300", text: "text-red-700", iconColor: "text-red-500" },
];

const SLEEP_OPTIONS = [
  { value: "VERY_GOOD", label: "Sangat Nyenyak", icon: BedDouble, iconColor: "text-indigo-500" },
  { value: "GOOD", label: "Nyenyak", icon: MoonStar, iconColor: "text-blue-500" },
  { value: "FAIR", label: "Cukup", icon: CloudMoon, iconColor: "text-slate-400" },
  { value: "POOR", label: "Kurang", icon: Coffee, iconColor: "text-amber-500" },
  { value: "VERY_POOR", label: "Sulit Tidur", icon: AlarmClock, iconColor: "text-red-500" },
];

const APPETITE_OPTIONS = [
  { value: "VERY_GOOD", label: "Lahap Sekali", icon: UtensilsCrossed, iconColor: "text-emerald-500" },
  { value: "GOOD", label: "Makan Baik", icon: Salad, iconColor: "text-green-500" },
  { value: "FAIR", label: "Cukup", icon: CupSoda, iconColor: "text-slate-400" },
  { value: "POOR", label: "Kurang", icon: ThumbsDown, iconColor: "text-amber-500" },
  { value: "REFUSED", label: "Menolak", icon: Ban, iconColor: "text-red-500" },
];

const QUICK_ACHIEVEMENTS = [
  "Bicara kata baru", "Makan sendiri", "Tidur tepat waktu",
  "Bermain bersama teman", "Mengikuti instruksi", "Tidak tantrum",
];

const QUICK_ACTIVITIES = [
  "Bermain puzzle", "Membaca buku", "Menggambar",
  "Bermain di luar", "Terapi wicara", "Latihan motorik",
];

export default function JournalPage() {
  const { toast } = useToast();
  const [journals, setJournals] = useState<Journal[]>([]);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formStep, setFormStep] = useState(1);

  const [childName, setChildName] = useState("");
  const [childNameInput, setChildNameInput] = useState("");

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  // Form state
  const [mood, setMood] = useState("NEUTRAL");
  const [sleepQuality, setSleepQuality] = useState("GOOD");
  const [appetiteLevel, setAppetiteLevel] = useState("GOOD");
  const [tantrumCount, setTantrumCount] = useState(0);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [activities, setActivities] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [addingTo, setAddingTo] = useState<string | null>(null);

  const fetchJournals = useCallback(async () => {
    if (!childName) { setLoading(false); return; }
    try {
      const params = new URLSearchParams({ days: "30", childName });
      const res = await fetch(`/api/journal?${params}`);
      if (res.ok) {
        const data = await res.json();
        setJournals(data.journals);
        setTrends(data.trends);
        setIsPremium(data.isPremium);
      }
    } catch { /* */ }
    setLoading(false);
  }, [childName]);

  useEffect(() => {
    fetch("/api/assessments")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.assessments) ? data.assessments : Array.isArray(data) ? data : [];
        if (list.length > 0) {
          setChildName(list[0].childName);
          setChildNameInput(list[0].childName);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (childName) fetchJournals();
  }, [childName, fetchJournals]);

  function resetForm() {
    setMood("NEUTRAL");
    setSleepQuality("GOOD");
    setAppetiteLevel("GOOD");
    setTantrumCount(0);
    setAchievements([]);
    setChallenges([]);
    setActivities([]);
    setNotes("");
    setCustomInput("");
    setAddingTo(null);
    setFormStep(1);
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }

  function openForm() {
    resetForm();
    if (childName) setChildNameInput(childName);
    setShowForm(true);
  }

  async function handleSave() {
    const nameToUse = childNameInput.trim();
    if (!nameToUse) {
      toast({ title: "Nama anak harus diisi", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate, childName: nameToUse, mood, sleepQuality, appetiteLevel,
          tantrumCount, achievements, challenges, activities, notes: notes || undefined,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast({ title: "Gagal menyimpan", description: typeof err.error === "string" ? err.error : "Coba lagi.", variant: "destructive" });
        return;
      }
      if (nameToUse !== childName) setChildName(nameToUse);
      toast({ title: "Jurnal tersimpan!", description: `Catatan untuk ${formatDate(selectedDate)} berhasil disimpan.` });
      setShowForm(false);
      resetForm();
      fetchJournals();
    } catch {
      toast({ title: "Koneksi gagal", description: "Periksa internet Anda.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  function toggleQuickItem(list: string, item: string) {
    if (list === "achievements") {
      setAchievements(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
    }
    if (list === "activities") {
      setActivities(prev => prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]);
    }
  }

  function addCustomItem(list: string) {
    if (!customInput.trim()) return;
    if (list === "achievements") setAchievements(prev => [...prev, customInput.trim()]);
    if (list === "challenges") setChallenges(prev => [...prev, customInput.trim()]);
    if (list === "activities") setActivities(prev => [...prev, customInput.trim()]);
    setCustomInput("");
    setAddingTo(null);
  }

  function removeItem(list: string, index: number) {
    if (list === "achievements") setAchievements(prev => prev.filter((_, i) => i !== index));
    if (list === "challenges") setChallenges(prev => prev.filter((_, i) => i !== index));
    if (list === "activities") setActivities(prev => prev.filter((_, i) => i !== index));
  }

  const getMoodIcon = (m: string) => {
    const opt = MOOD_OPTIONS.find(o => o.value === m);
    if (!opt) return <Meh className="w-5 h-5 text-slate-400" />;
    const Icon = opt.icon;
    return <Icon className={cn("w-5 h-5", opt.iconColor)} />;
  };
  const getMoodLabel = (m: string) => MOOD_OPTIONS.find(o => o.value === m)?.label || "";

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 bg-sand-200 rounded-lg" />
        <div className="h-32 bg-sand-100 rounded-xl" />
        <div className="h-24 bg-sand-100 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-serif font-bold text-forest-600">Jurnal Harian</h1>
          <p className="text-xs text-sand-500 mt-0.5">
            {childName ? `Catatan harian ${childName}` : "Catat perkembangan anak setiap hari"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isPremium && journals.length > 0 && (
            <Button
              onClick={async () => {
                try {
                  const { exportJournalPDF } = await import("@/lib/pdf-export");
                  exportJournalPDF(journals, childName);
                  toast({ title: "PDF berhasil dibuat!", description: "File akan otomatis terdownload." });
                } catch {
                  toast({ title: "Gagal membuat PDF", variant: "destructive" });
                }
              }}
              variant="outline"
              size="sm"
              className="border-forest-200 text-forest-600 hover:bg-forest-50 rounded-xl h-9"
            >
              <Download className="w-4 h-4 mr-1" /> PDF
            </Button>
          )}
          <Button onClick={openForm} size="sm" className="bg-forest-500 hover:bg-forest-600 text-white rounded-xl h-9 px-4 shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Tulis
          </Button>
        </div>
      </div>

      {/* Trends Cards */}
      {trends && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { label: "Mood", value: <span className="flex items-center gap-1.5">{trends.avgMood >= 4 ? <Smile className="w-5 h-5 text-green-500" /> : trends.avgMood >= 3 ? <Meh className="w-5 h-5 text-slate-400" /> : <Frown className="w-5 h-5 text-red-500" />} {trends.avgMood}/5</span> },
            { label: "Tren", value: <span className="flex items-center gap-1.5">{trends.moodTrend === "improving" ? <TrendingUp className="w-4 h-4 text-emerald-500" /> : trends.moodTrend === "declining" ? <TrendingDown className="w-4 h-4 text-red-400" /> : <Minus className="w-4 h-4 text-sand-400" />}{trends.moodTrend === "improving" ? "Membaik" : trends.moodTrend === "declining" ? "Menurun" : "Stabil"}</span> },
            { label: "Tantrum", value: <>{trends.avgTantrums}x <span className="text-sand-400 font-normal">/hari</span></> },
            { label: "Pencapaian", value: trends.totalAchievements },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-xl border border-sand-200/80 p-3">
              <div className="text-[10px] text-sand-400 uppercase tracking-wider mb-1">{label}</div>
              <div className="text-sm font-semibold text-forest-600">{value}</div>
            </div>
          ))}
        </div>
      )}

      {/* Premium Banner */}
      {!isPremium && journals.length >= 3 && (
        <div className="bg-amber-50/80 border border-amber-200/60 rounded-xl p-3.5 flex items-center gap-3">
          <Crown className="w-6 h-6 text-amber-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700">Lihat pola & tren otomatis</p>
            <p className="text-[11px] text-amber-600/80 mt-0.5">Upgrade untuk analisis mood & tantrum.</p>
          </div>
          <Link href="/profil?tab=premium" className="text-[11px] font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg px-3 py-1.5 transition-colors flex-shrink-0">
            Upgrade
          </Link>
        </div>
      )}

      {/* ═══ Form Modal ═══ */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl max-h-[92vh] flex flex-col shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-sand-100">
              <div>
                <h2 className="text-base font-serif font-semibold text-forest-600">
                  {formStep === 1 ? "Bagaimana hari ini?" : formStep === 2 ? "Detail Harian" : "Pencapaian & Aktivitas"}
                </h2>
                <p className="text-[11px] text-sand-400 mt-0.5">Langkah {formStep} dari 3</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 rounded-full hover:bg-sand-50 transition-colors">
                <X className="w-5 h-5 text-sand-400" />
              </button>
            </div>

            {/* Progress bar */}
            <div className="flex gap-1 px-4 pt-3">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn("h-1 flex-1 rounded-full transition-all", s <= formStep ? "bg-forest-400" : "bg-sand-200")} />
              ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Step 1: Mood + Child Name + Date */}
              {formStep === 1 && (
                <>
                  {/* Child Name */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-1.5 block">Nama Anak</label>
                    <input
                      type="text"
                      value={childNameInput}
                      onChange={e => setChildNameInput(e.target.value)}
                      placeholder="Masukkan nama anak"
                      className="w-full border border-sand-200 rounded-xl px-3.5 py-2.5 text-sm text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/60 focus:border-forest-300 transition-all"
                    />
                  </div>

                  {/* Date */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-1.5 block">Tanggal</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      max={new Date().toISOString().split("T")[0]}
                      className="w-full border border-sand-200 rounded-xl px-3.5 py-2.5 text-sm text-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-200/60 transition-all"
                    />
                  </div>

                  {/* Mood Selection */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-3 block">
                      Bagaimana mood {childNameInput || "anak"} hari ini?
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {MOOD_OPTIONS.map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setMood(option.value)}
                          className={cn(
                            "flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all",
                            mood === option.value
                              ? `${option.bg} ${option.border} ${option.text} shadow-sm scale-105`
                              : "border-transparent bg-sand-50/80 hover:bg-sand-100"
                          )}
                        >
                          <option.icon className={cn("w-6 h-6", mood === option.value ? option.iconColor : "text-sand-400")} />
                          <span className="text-[9px] font-medium leading-tight">{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Step 2: Sleep, Appetite, Tantrum */}
              {formStep === 2 && (
                <>
                  {/* Sleep Quality */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <CloudMoon className="w-3.5 h-3.5 text-indigo-400" /> Kualitas Tidur Semalam
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {SLEEP_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setSleepQuality(o.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center",
                            sleepQuality === o.value
                              ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                              : "border-sand-200/80 hover:bg-sand-50"
                          )}
                        >
                          <o.icon className={cn("w-5 h-5", sleepQuality === o.value ? o.iconColor : "text-sand-400")} />
                          <span className="text-[9px] font-medium leading-tight">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Appetite */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <Apple className="w-3.5 h-3.5 text-orange-400" /> Nafsu Makan Hari Ini
                    </label>
                    <div className="grid grid-cols-5 gap-1.5">
                      {APPETITE_OPTIONS.map(o => (
                        <button
                          key={o.value}
                          type="button"
                          onClick={() => setAppetiteLevel(o.value)}
                          className={cn(
                            "flex flex-col items-center gap-1 p-2 rounded-xl border transition-all text-center",
                            appetiteLevel === o.value
                              ? "border-orange-300 bg-orange-50 text-orange-700 shadow-sm"
                              : "border-sand-200/80 hover:bg-sand-50"
                          )}
                        >
                          <o.icon className={cn("w-5 h-5", appetiteLevel === o.value ? o.iconColor : "text-sand-400")} />
                          <span className="text-[9px] font-medium leading-tight">{o.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tantrum */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-red-400" /> Tantrum Hari Ini
                    </label>
                    <div className="flex items-center justify-center gap-5 py-2">
                      <button
                        type="button"
                        onClick={() => setTantrumCount(Math.max(0, tantrumCount - 1))}
                        className="w-11 h-11 rounded-full border-2 border-sand-200 flex items-center justify-center text-xl text-sand-500 hover:bg-sand-50 hover:border-sand-300 transition-all active:scale-95"
                      >-</button>
                      <div className="text-center">
                        <span className="text-3xl font-bold text-forest-600">{tantrumCount}</span>
                        <div className="text-[10px] text-sand-400 mt-0.5">kali</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setTantrumCount(tantrumCount + 1)}
                        className="w-11 h-11 rounded-full border-2 border-sand-200 flex items-center justify-center text-xl text-sand-500 hover:bg-sand-50 hover:border-sand-300 transition-all active:scale-95"
                      >+</button>
                    </div>
                    {tantrumCount === 0 && (
                      <p className="text-center text-[10px] text-emerald-500 font-medium mt-1">Bagus! Tidak ada tantrum hari ini</p>
                    )}
                  </div>
                </>
              )}

              {/* Step 3: Achievements, Activities, Challenges, Notes */}
              {formStep === 3 && (
                <>
                  {/* Quick Achievements */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-amber-400" /> Pencapaian Hari Ini
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACHIEVEMENTS.map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleQuickItem("achievements", item)}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full border transition-all",
                            achievements.includes(item)
                              ? "bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm"
                              : "border-sand-200 text-sand-600 hover:bg-sand-50"
                          )}
                        >
                          {achievements.includes(item) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {item}
                        </button>
                      ))}
                    </div>
                    {/* Custom achievements */}
                    {achievements.filter(a => !QUICK_ACHIEVEMENTS.includes(a)).map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 rounded-full px-2.5 py-1 mt-1.5 mr-1">
                        {a}
                        <button type="button" onClick={() => setAchievements(prev => prev.filter(x => x !== a))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {addingTo === "achievements" ? (
                      <div className="flex gap-2 mt-2">
                        <input autoFocus value={customInput} onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomItem("achievements"); } if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Pencapaian lainnya..."
                          className="flex-1 text-xs border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-200/60" />
                        <button type="button" onClick={() => addCustomItem("achievements")} disabled={!customInput.trim()}
                          className="px-3 py-2 rounded-lg bg-forest-500 text-white text-xs hover:bg-forest-600 disabled:opacity-40 transition-colors">Tambah</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setAddingTo("achievements"); setCustomInput(""); }}
                        className="text-[11px] text-forest-500 hover:text-forest-600 flex items-center gap-1 mt-2 font-medium">
                        <Plus className="w-3 h-3" /> Tulis pencapaian lainnya
                      </button>
                    )}
                  </div>

                  {/* Quick Activities */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <Heart className="w-3.5 h-3.5 text-pink-400" /> Aktivitas Hari Ini
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ACTIVITIES.map(item => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => toggleQuickItem("activities", item)}
                          className={cn(
                            "text-xs px-3 py-1.5 rounded-full border transition-all",
                            activities.includes(item)
                              ? "bg-blue-50 border-blue-300 text-blue-700 shadow-sm"
                              : "border-sand-200 text-sand-600 hover:bg-sand-50"
                          )}
                        >
                          {activities.includes(item) && <CheckCircle2 className="w-3 h-3 inline mr-1" />}
                          {item}
                        </button>
                      ))}
                    </div>
                    {activities.filter(a => !QUICK_ACTIVITIES.includes(a)).map((a, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 mt-1.5 mr-1">
                        {a}
                        <button type="button" onClick={() => setActivities(prev => prev.filter(x => x !== a))} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {addingTo === "activities" ? (
                      <div className="flex gap-2 mt-2">
                        <input autoFocus value={customInput} onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomItem("activities"); } if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Aktivitas lainnya..."
                          className="flex-1 text-xs border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-200/60" />
                        <button type="button" onClick={() => addCustomItem("activities")} disabled={!customInput.trim()}
                          className="px-3 py-2 rounded-lg bg-forest-500 text-white text-xs hover:bg-forest-600 disabled:opacity-40 transition-colors">Tambah</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setAddingTo("activities"); setCustomInput(""); }}
                        className="text-[11px] text-forest-500 hover:text-forest-600 flex items-center gap-1 mt-2 font-medium">
                        <Plus className="w-3 h-3" /> Tulis aktivitas lainnya
                      </button>
                    )}
                  </div>

                  {/* Challenges */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400" /> Tantangan (opsional)
                    </label>
                    {challenges.map((c, i) => (
                      <span key={i} className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 rounded-full px-2.5 py-1 mr-1 mb-1">
                        {c}
                        <button type="button" onClick={() => removeItem("challenges", i)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                      </span>
                    ))}
                    {addingTo === "challenges" ? (
                      <div className="flex gap-2">
                        <input autoFocus value={customInput} onChange={e => setCustomInput(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomItem("challenges"); } if (e.key === "Escape") setAddingTo(null); }}
                          placeholder="Contoh: Sulit fokus saat belajar"
                          className="flex-1 text-xs border border-sand-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-forest-200/60" />
                        <button type="button" onClick={() => addCustomItem("challenges")} disabled={!customInput.trim()}
                          className="px-3 py-2 rounded-lg bg-forest-500 text-white text-xs hover:bg-forest-600 disabled:opacity-40 transition-colors">Tambah</button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => { setAddingTo("challenges"); setCustomInput(""); }}
                        className="text-[11px] text-forest-500 hover:text-forest-600 flex items-center gap-1 font-medium">
                        <Plus className="w-3 h-3" /> Tulis tantangan
                      </button>
                    )}
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-xs font-medium text-sand-600 mb-1.5 flex items-center gap-1.5">
                      <Pencil className="w-3.5 h-3.5 text-sand-400" /> Catatan Tambahan
                    </label>
                    <textarea
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Observasi atau catatan untuk hari ini... (opsional)"
                      className="w-full border border-sand-200 rounded-xl px-3.5 py-2.5 text-sm text-forest-600 resize-none focus:outline-none focus:ring-2 focus:ring-forest-200/60 transition-all"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Bottom buttons */}
            <div className="p-4 border-t border-sand-100 flex gap-2">
              {formStep > 1 && (
                <Button type="button" variant="outline" onClick={() => setFormStep(formStep - 1)} className="flex-1 h-11 rounded-xl border-sand-200">
                  Kembali
                </Button>
              )}
              {formStep < 3 ? (
                <Button
                  type="button"
                  onClick={() => {
                    if (formStep === 1 && !childNameInput.trim()) {
                      toast({ title: "Isi nama anak dulu", variant: "destructive" });
                      return;
                    }
                    setFormStep(formStep + 1);
                  }}
                  className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white"
                >
                  Lanjut
                </Button>
              ) : (
                <Button onClick={handleSave} disabled={saving} className="flex-1 h-11 rounded-xl bg-forest-500 hover:bg-forest-600 text-white">
                  {saving ? "Menyimpan..." : "Simpan Jurnal"}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══ Journal Entries ═══ */}
      {journals.length === 0 ? (
        <div className="bg-white rounded-xl border border-sand-200/80 p-10 text-center">
          <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mx-auto mb-4">
            <Pencil className="w-6 h-6 text-forest-400" />
          </div>
          <h3 className="text-sm font-semibold text-forest-600 mb-1">Mulai Jurnal Pertama</h3>
          <p className="text-xs text-sand-500 mb-4 max-w-[280px] mx-auto leading-relaxed">
            Catat mood, tidur, makan, dan pencapaian anak setiap hari. Hanya butuh 2 menit!
          </p>
          <Button onClick={openForm} size="sm" className="bg-forest-500 hover:bg-forest-600 text-white rounded-xl shadow-sm">
            <Plus className="w-4 h-4 mr-1.5" /> Tulis Jurnal
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {journals.map(journal => (
            <div key={journal.id} className="bg-white rounded-xl border border-sand-200/80 p-4 hover:shadow-sm transition-shadow">
              {/* Header row */}
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-sand-50 flex items-center justify-center">
                    {getMoodIcon(journal.mood)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-forest-600">{formatDate(journal.date)}</div>
                    <div className="text-[11px] text-sand-400 flex items-center gap-1.5">
                      <span>{journal.childName}</span>
                      <span className="text-sand-300">&middot;</span>
                      <span>{getMoodLabel(journal.mood)}</span>
                    </div>
                  </div>
                </div>
                {journal.tantrumCount > 0 && (
                  <span className="text-[10px] bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-medium">
                    {journal.tantrumCount}x tantrum
                  </span>
                )}
              </div>

              {/* Quick stats row */}
              <div className="flex flex-wrap gap-2 text-[11px] text-sand-500 mb-2">
                {journal.sleepQuality && (() => {
                  const sleepOpt = SLEEP_OPTIONS.find(o => o.value === journal.sleepQuality);
                  if (!sleepOpt) return null;
                  return (
                    <span className="flex items-center gap-1 bg-sand-50 rounded-full px-2 py-0.5">
                      <sleepOpt.icon className={cn("w-3.5 h-3.5", sleepOpt.iconColor)} />
                      {sleepOpt.label}
                    </span>
                  );
                })()}
                {journal.appetiteLevel && (() => {
                  const appOpt = APPETITE_OPTIONS.find(o => o.value === journal.appetiteLevel);
                  if (!appOpt) return null;
                  return (
                    <span className="flex items-center gap-1 bg-sand-50 rounded-full px-2 py-0.5">
                      <appOpt.icon className={cn("w-3.5 h-3.5", appOpt.iconColor)} />
                      {appOpt.label}
                    </span>
                  );
                })()}
              </div>

              {/* Tags */}
              {journal.achievements.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {journal.achievements.map((a, i) => (
                    <span key={i} className="text-[11px] bg-emerald-50 text-emerald-600 rounded-full px-2 py-0.5 font-medium">{a}</span>
                  ))}
                </div>
              )}
              {journal.activities.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {journal.activities.map((a, i) => (
                    <span key={i} className="text-[11px] bg-blue-50 text-blue-600 rounded-full px-2 py-0.5">{a}</span>
                  ))}
                </div>
              )}
              {journal.challenges.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {journal.challenges.map((c, i) => (
                    <span key={i} className="text-[11px] bg-amber-50 text-amber-600 rounded-full px-2 py-0.5">{c}</span>
                  ))}
                </div>
              )}
              {journal.notes && (
                <p className="mt-2.5 text-xs text-sand-500 bg-sand-50/80 rounded-lg p-2.5 leading-relaxed italic">
                  &ldquo;{journal.notes}&rdquo;
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      {!isPremium && journals.length > 0 && (
        <p className="text-[11px] text-center text-sand-400">
          Menampilkan 7 hari terakhir.{" "}
          <Link href="/profil?tab=premium" className="text-forest-500 font-medium hover:underline">Upgrade</Link>{" "}
          untuk histori lengkap.
        </p>
      )}
    </div>
  );
}
