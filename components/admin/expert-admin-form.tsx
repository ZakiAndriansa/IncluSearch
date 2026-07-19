"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";
import { SPECIALIZATION_LABELS } from "@/lib/utils";

const SPEC_OPTIONS = Object.entries(SPECIALIZATION_LABELS) as [string, string][];

export interface ExpertInitial {
  name: string;
  bio: string;
  hourlyRate: number;
  yearsExperience: number;
  education: string | null;
  city: string | null;
  province: string | null;
  locationType: string;
  specializations: string[];
  profilePhotoUrl: string | null;
  isVerified: boolean;
}

export function ExpertAdminForm({
  mode,
  expertId,
  initial,
}: {
  mode: "create" | "edit";
  expertId?: string;
  initial?: ExpertInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: "",
    password: "",
    bio: initial?.bio ?? "",
    hourlyRate: String(initial?.hourlyRate ?? 0),
    yearsExperience: String(initial?.yearsExperience ?? 0),
    education: initial?.education ?? "",
    city: initial?.city ?? "",
    province: initial?.province ?? "",
    locationType: initial?.locationType ?? "ONLINE",
    specializations: initial?.specializations ?? [],
    profilePhotoUrl: initial?.profilePhotoUrl ?? "",
    isVerified: initial?.isVerified ?? true,
  });

  function toggleSpec(v: string) {
    setForm((f) => ({
      ...f,
      specializations: f.specializations.includes(v)
        ? f.specializations.filter((s) => s !== v)
        : [...f.specializations, v],
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        bio: form.bio,
        hourlyRate: parseInt(form.hourlyRate) || 0,
        yearsExperience: parseInt(form.yearsExperience) || 0,
        education: form.education || null,
        city: form.city || null,
        province: form.province || null,
        locationType: form.locationType,
        specializations: form.specializations,
        profilePhotoUrl: form.profilePhotoUrl || null,
        isVerified: form.isVerified,
        ...(mode === "create" ? { email: form.email, password: form.password } : {}),
      };
      const res = await fetch(
        mode === "create" ? "/api/admin/experts" : `/api/admin/experts/${expertId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: mode === "create" ? "Pakar dibuat" : "Perubahan tersimpan" });
      router.push("/admin/pakar");
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan",
        description: err instanceof Error ? err.message : undefined,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-sand-200 p-5 space-y-4">
      {/* Foto profil */}
      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Foto Profil</Label>
        <FileUpload
          accept="image/*"
          folder="avatars"
          label="Unggah Foto"
          preview
          currentUrl={form.profilePhotoUrl || null}
          onUploaded={(url) => setForm((f) => ({ ...f, profilePhotoUrl: url }))}
          onClear={() => setForm((f) => ({ ...f, profilePhotoUrl: "" }))}
          maxSizeMB={5}
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Nama</Label>
          <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="border-sand-300" />
        </div>
        {mode === "create" && (
          <>
            <div className="space-y-1.5">
              <Label className="text-forest-500 font-medium">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="border-sand-300" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-forest-500 font-medium">Password Awal</Label>
              <Input type="text" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} placeholder="min. 8 karakter" className="border-sand-300" />
            </div>
          </>
        )}
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Tarif / Jam (Rp)</Label>
          <Input type="number" min={0} value={form.hourlyRate} onChange={(e) => setForm((f) => ({ ...f, hourlyRate: e.target.value }))} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Pengalaman (tahun)</Label>
          <Input type="number" min={0} value={form.yearsExperience} onChange={(e) => setForm((f) => ({ ...f, yearsExperience: e.target.value }))} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Kota</Label>
          <Input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Provinsi</Label>
          <Input value={form.province} onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Pendidikan</Label>
          <Input value={form.education} onChange={(e) => setForm((f) => ({ ...f, education: e.target.value }))} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Tipe Layanan</Label>
          <select value={form.locationType} onChange={(e) => setForm((f) => ({ ...f, locationType: e.target.value }))} className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white">
            <option value="ONLINE">Online</option>
            <option value="OFFLINE">Tatap Muka</option>
            <option value="BOTH">Online & Tatap Muka</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Bio</Label>
        <Textarea value={form.bio} onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))} className="min-h-[90px] border-sand-300" />
      </div>

      <div className="space-y-2">
        <Label className="text-forest-500 font-medium">Spesialisasi</Label>
        <div className="flex flex-wrap gap-2">
          {SPEC_OPTIONS.map(([value, label]) => {
            const active = form.specializations.includes(value);
            return (
              <button key={value} type="button" onClick={() => toggleSpec(value)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? "border-forest-500 bg-forest-50 text-forest-600" : "border-sand-300 text-sand-600 hover:border-sand-400"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))} className="w-4 h-4 accent-forest-500" />
        <span className="text-sm text-forest-500">Terverifikasi (tampil di pencarian pakar)</span>
      </label>

      <Button onClick={submit} disabled={saving} className="bg-forest-500 hover:bg-forest-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {mode === "create" ? "Buat Pakar" : "Simpan Perubahan"}
      </Button>
    </div>
  );
}
