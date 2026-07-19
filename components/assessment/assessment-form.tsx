"use client";

import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";
import { CHALLENGE_TYPE_LABELS } from "@/lib/utils";

const LEARNING_ENV_LABELS: Record<string, string> = {
  HOME: "Rumah",
  SCHOOL: "Sekolah",
  BOTH: "Rumah & Sekolah",
  THERAPY_CENTER: "Pusat Terapi",
};

const LOCATION_PREF_LABELS: Record<string, string> = {
  ONLINE: "Online",
  OFFLINE: "Tatap Muka",
  BOTH: "Keduanya",
};

const COMMON_GOALS = [
  "Meningkatkan kemampuan belajar",
  "Mengelola perilaku",
  "Meningkatkan komunikasi",
  "Dukungan sosial & emosional",
  "Pengembangan kemandirian",
  "Persiapan transisi sekolah",
];

interface AssessmentFormProps {
  onClose: () => void;
}

export function AssessmentForm({ onClose }: AssessmentFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [form, setForm] = useState({
    childName: "",
    childAge: "",
    challengeType: "",
    challengeDetails: "",
    learningEnv: "",
    locationPref: "ONLINE",
    goals: [] as string[],
    documentUrl: "",
    documentName: "",
  });

  function toggleGoal(goal: string) {
    setForm((f) => ({
      ...f,
      goals: f.goals.includes(goal)
        ? f.goals.filter((g) => g !== goal)
        : [...f.goals, goal],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.childName || !form.childAge || !form.challengeType || !form.learningEnv) {
      toast({ title: "Lengkapi semua field yang diperlukan", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          childAge: parseInt(form.childAge),
          documentUrl: form.documentUrl || null,
          documentName: form.documentName || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Gagal membuat asesmen");
      }

      toast({ title: "Asesmen berhasil dibuat!" });
      onClose();
    } catch (err: unknown) {
      toast({
        title: "Gagal membuat asesmen",
        description: err instanceof Error ? err.message : "Coba lagi",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-teal-dark/20 bg-teal-dark/5 p-5">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-forest-500">
          Buat Asesmen Baru
        </h4>
        <button onClick={onClose} className="text-sand-400 hover:text-forest-500 tap-target">
          <X className="w-4 h-4" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium text-sm">
              Nama Anak <span className="text-red-500">*</span>
            </Label>
            <Input
              value={form.childName}
              onChange={(e) => setForm((f) => ({ ...f, childName: e.target.value }))}
              placeholder="Nama anak"
              required
              className="border-sand-300 focus:border-forest-500 bg-white"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium text-sm">
              Usia <span className="text-red-500">*</span>
            </Label>
            <Input
              type="number"
              value={form.childAge}
              onChange={(e) => setForm((f) => ({ ...f, childAge: e.target.value }))}
              placeholder="Usia dalam tahun"
              min={1}
              max={25}
              required
              className="border-sand-300 focus:border-forest-500 bg-white"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium text-sm">
            Jenis Tantangan <span className="text-red-500">*</span>
          </Label>
          <Select
            value={form.challengeType}
            onValueChange={(v) => setForm((f) => ({ ...f, challengeType: v }))}
            required
          >
            <SelectTrigger className="border-sand-300 focus:border-forest-500 bg-white">
              <SelectValue placeholder="Pilih jenis tantangan..." />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CHALLENGE_TYPE_LABELS).map(([v, l]) => (
                <SelectItem key={v} value={v}>{l}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium text-sm">
            Deskripsi Tantangan
          </Label>
          <Textarea
            value={form.challengeDetails}
            onChange={(e) => setForm((f) => ({ ...f, challengeDetails: e.target.value }))}
            placeholder="Ceritakan lebih detail tentang tantangan yang dihadapi..."
            className="border-sand-300 focus:border-forest-500 bg-white resize-none"
            rows={2}
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium text-sm">
              Lingkungan Belajar <span className="text-red-500">*</span>
            </Label>
            <Select
              value={form.learningEnv}
              onValueChange={(v) => setForm((f) => ({ ...f, learningEnv: v }))}
            >
              <SelectTrigger className="border-sand-300 focus:border-forest-500 bg-white">
                <SelectValue placeholder="Pilih lingkungan..." />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LEARNING_ENV_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-forest-500 font-medium text-sm">
              Preferensi Konsultasi
            </Label>
            <Select
              value={form.locationPref}
              onValueChange={(v) => setForm((f) => ({ ...f, locationPref: v }))}
            >
              <SelectTrigger className="border-sand-300 focus:border-forest-500 bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(LOCATION_PREF_LABELS).map(([v, l]) => (
                  <SelectItem key={v} value={v}>{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-forest-500 font-medium text-sm">
            Tujuan Konsultasi
          </Label>
          <div className="flex flex-wrap gap-2">
            {COMMON_GOALS.map((goal) => (
              <button
                key={goal}
                type="button"
                onClick={() => toggleGoal(goal)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.goals.includes(goal)
                    ? "bg-forest-500 text-white border-forest-500"
                    : "bg-white text-sand-600 border-sand-300 hover:border-forest-300"
                }`}
              >
                {goal}
              </button>
            ))}
          </div>
        </div>

        {/* Dokumen pendukung (PDF) */}
        <div className="space-y-2">
          <Label className="text-forest-500 font-medium text-sm">
            Dokumen Pendukung (PDF, opsional)
          </Label>
          <FileUpload
            accept="application/pdf"
            folder="assessments"
            label={form.documentName ? "Ganti PDF" : "Unggah PDF"}
            currentUrl={form.documentUrl || null}
            onUploaded={(url, name) =>
              setForm((f) => ({ ...f, documentUrl: url, documentName: name }))
            }
            onClear={() => setForm((f) => ({ ...f, documentUrl: "", documentName: "" }))}
            maxSizeMB={20}
          />
          {form.documentName && (
            <p className="text-xs text-sand-500">Terlampir: {form.documentName}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1 border-sand-300"
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-forest-500 hover:bg-forest-600 text-white"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Menyimpan...
              </>
            ) : (
              "Simpan Asesmen"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
