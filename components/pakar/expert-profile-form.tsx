"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { SPECIALIZATION_LABELS } from "@/lib/utils";
import { DAY_LABELS } from "@/lib/expert";

interface Slot {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

interface ExpertProfileFormProps {
  profile: {
    bio: string;
    hourlyRate: number;
    yearsExperience: number;
    education: string | null;
    city: string | null;
    province: string | null;
    locationType: string;
    specializations: string[];
    isVerified: boolean;
  };
  slots: Slot[];
}

type DayState = { active: boolean; start: string; end: string };

const SPEC_OPTIONS = Object.entries(SPECIALIZATION_LABELS) as [string, string][];

export function ExpertProfileForm({ profile, slots }: ExpertProfileFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState({
    bio: profile.bio ?? "",
    hourlyRate: String(profile.hourlyRate ?? 0),
    yearsExperience: String(profile.yearsExperience ?? 0),
    education: profile.education ?? "",
    city: profile.city ?? "",
    province: profile.province ?? "",
    locationType: profile.locationType ?? "ONLINE",
    specializations: profile.specializations ?? [],
  });

  // One range per day for the editor (first slot of each day if present).
  const [days, setDays] = useState<DayState[]>(() =>
    Array.from({ length: 7 }, (_, d) => {
      const slot = slots.find((s) => s.dayOfWeek === d);
      return slot
        ? { active: true, start: slot.startTime, end: slot.endTime }
        : { active: false, start: "09:00", end: "17:00" };
    })
  );

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingSchedule, setSavingSchedule] = useState(false);

  function toggleSpec(value: string) {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(value)
        ? f.specializations.filter((s) => s !== value)
        : [...f.specializations, value],
    }));
  }

  function setDay(index: number, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  async function saveProfile() {
    setSavingProfile(true);
    try {
      const res = await fetch("/api/experts/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bio: form.bio,
          hourlyRate: parseInt(form.hourlyRate) || 0,
          yearsExperience: parseInt(form.yearsExperience) || 0,
          education: form.education || null,
          city: form.city || null,
          province: form.province || null,
          locationType: form.locationType,
          specializations: form.specializations,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Profil tersimpan" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan profil",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  }

  async function saveSchedule() {
    // Validate active days
    for (let i = 0; i < days.length; i++) {
      const d = days[i];
      if (d.active && d.start >= d.end) {
        toast({
          title: `${DAY_LABELS[i]}: jam mulai harus sebelum jam selesai`,
          variant: "destructive",
        });
        return;
      }
    }
    setSavingSchedule(true);
    try {
      const payload = {
        slots: days.flatMap((d, i) =>
          d.active ? [{ dayOfWeek: i, startTime: d.start, endTime: d.end }] : []
        ),
      };
      const res = await fetch("/api/experts/me/availability", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Jadwal tersimpan" });
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan jadwal",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSavingSchedule(false);
    }
  }

  return (
    <div className="space-y-6">
      {!profile.isVerified && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-700">
          Profil Anda belum diverifikasi admin. Lengkapi data di bawah — profil
          akan tampil di pencarian pakar setelah diverifikasi.
        </div>
      )}

      {/* ─── Profil ─── */}
      <section className="bg-white rounded-2xl border border-sand-200 p-5 space-y-4">
        <h2 className="font-serif font-bold text-lg text-forest-500">Profil Pakar</h2>

        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Bio</Label>
          <Textarea
            value={form.bio}
            onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
            placeholder="Ceritakan latar belakang & pendekatan Anda menangani ABK"
            className="min-h-[100px] border-sand-300"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Tarif / Jam (Rp)</Label>
            <Input
              type="number"
              min={0}
              value={form.hourlyRate}
              onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))}
              className="border-sand-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Pengalaman (tahun)</Label>
            <Input
              type="number"
              min={0}
              value={form.yearsExperience}
              onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))}
              className="border-sand-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Kota</Label>
            <Input
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="border-sand-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Provinsi</Label>
            <Input
              value={form.province}
              onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
              className="border-sand-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Pendidikan</Label>
            <Input
              value={form.education}
              onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))}
              placeholder="mis. S2 Psikologi Pendidikan"
              className="border-sand-300"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium">Tipe Layanan</Label>
            <select
              value={form.locationType}
              onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value }))}
              className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white"
            >
              <option value="ONLINE">Online</option>
              <option value="OFFLINE">Tatap Muka</option>
              <option value="BOTH">Online & Tatap Muka</option>
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-forest-500 font-medium">Spesialisasi</Label>
          <div className="flex flex-wrap gap-2">
            {SPEC_OPTIONS.map(([value, label]) => {
              const active = form.specializations.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleSpec(value)}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    active
                      ? "border-forest-500 bg-forest-50 text-forest-600"
                      : "border-sand-300 text-sand-600 hover:border-sand-400"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <Button
          onClick={saveProfile}
          disabled={savingProfile}
          className="bg-forest-500 hover:bg-forest-600 text-white"
        >
          {savingProfile ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Profil
        </Button>
      </section>

      {/* ─── Jadwal ketersediaan ─── */}
      <section className="bg-white rounded-2xl border border-sand-200 p-5 space-y-4">
        <div>
          <h2 className="font-serif font-bold text-lg text-forest-500">
            Jadwal Ketersediaan
          </h2>
          <p className="text-sand-500 text-sm mt-0.5">
            Tentukan hari & jam Anda menerima konsultasi. Orang tua hanya bisa
            memesan pada slot ini.
          </p>
        </div>

        <div className="space-y-2">
          {days.map((d, i) => (
            <div
              key={i}
              className="flex flex-wrap items-center gap-3 rounded-xl border border-sand-200 px-3 py-2.5"
            >
              <label className="flex items-center gap-2 w-28 cursor-pointer">
                <input
                  type="checkbox"
                  checked={d.active}
                  onChange={(e) => setDay(i, { active: e.target.checked })}
                  className="w-4 h-4 accent-forest-500"
                />
                <span className="text-sm font-medium text-forest-500">
                  {DAY_LABELS[i]}
                </span>
              </label>
              <div className="flex items-center gap-2 text-sm">
                <input
                  type="time"
                  value={d.start}
                  disabled={!d.active}
                  onChange={(e) => setDay(i, { start: e.target.value })}
                  className="h-9 rounded-md border border-sand-300 px-2 disabled:opacity-40"
                />
                <span className="text-sand-400">–</span>
                <input
                  type="time"
                  value={d.end}
                  disabled={!d.active}
                  onChange={(e) => setDay(i, { end: e.target.value })}
                  className="h-9 rounded-md border border-sand-300 px-2 disabled:opacity-40"
                />
              </div>
            </div>
          ))}
        </div>

        <Button
          onClick={saveSchedule}
          disabled={savingSchedule}
          className="bg-forest-500 hover:bg-forest-600 text-white"
        >
          {savingSchedule ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Simpan Jadwal
        </Button>
      </section>
    </div>
  );
}
