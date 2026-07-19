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
import { ABK_FOCUS_LABELS } from "@/lib/utils";

const ORG_TYPES: { value: string; label: string }[] = [
  { value: "FOUNDATION", label: "Yayasan" },
  { value: "SCHOOL", label: "Sekolah" },
  { value: "THERAPY_CENTER", label: "Pusat Terapi" },
  { value: "SUPPORT_GROUP", label: "Kelompok Dukungan" },
  { value: "GOVERNMENT", label: "Pemerintah" },
  { value: "NGO", label: "LSM" },
];

const FOCUS_OPTIONS = Object.entries(ABK_FOCUS_LABELS) as [string, string][];

export interface CommunityInitial {
  name: string;
  description: string;
  orgType: string;
  focusAreas: string[];
  region: string;
  province: string;
  contactEmail: string | null;
  contactPhone: string | null;
  website: string | null;
  logoUrl: string | null;
  memberCount: number;
  isVerified: boolean;
  isActive: boolean;
}

export function CommunityAdminForm({
  mode,
  communityId,
  initial,
}: {
  mode: "create" | "edit";
  communityId?: string;
  initial?: CommunityInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    description: initial?.description ?? "",
    orgType: initial?.orgType ?? "FOUNDATION",
    focusAreas: initial?.focusAreas ?? ([] as string[]),
    region: initial?.region ?? "",
    province: initial?.province ?? "",
    contactEmail: initial?.contactEmail ?? "",
    contactPhone: initial?.contactPhone ?? "",
    website: initial?.website ?? "",
    logoUrl: initial?.logoUrl ?? "",
    memberCount: String(initial?.memberCount ?? 0),
    isVerified: initial?.isVerified ?? false,
    isActive: initial?.isActive ?? true,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toggleFocus(v: string) {
    setForm((f) => ({
      ...f,
      focusAreas: f.focusAreas.includes(v)
        ? f.focusAreas.filter((x) => x !== v)
        : [...f.focusAreas, v],
    }));
  }

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        orgType: form.orgType,
        focusAreas: form.focusAreas,
        region: form.region,
        province: form.province,
        contactEmail: form.contactEmail || null,
        contactPhone: form.contactPhone || null,
        website: form.website || null,
        logoUrl: form.logoUrl || null,
        memberCount: parseInt(form.memberCount) || 0,
        isVerified: form.isVerified,
        isActive: form.isActive,
      };
      const res = await fetch(
        mode === "create" ? "/api/admin/communities" : `/api/admin/communities/${communityId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: mode === "create" ? "Komunitas dibuat" : "Perubahan tersimpan" });
      router.push("/admin/forum");
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
      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Logo</Label>
        <FileUpload
          accept="image/*"
          folder="communities"
          label="Unggah Logo"
          preview
          currentUrl={form.logoUrl || null}
          onUploaded={(url) => set("logoUrl", url)}
          onClear={() => set("logoUrl", "")}
          maxSizeMB={5}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Nama Komunitas / Forum</Label>
        <Input value={form.name} onChange={(e) => set("name", e.target.value)} className="border-sand-300" />
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Deskripsi</Label>
        <Textarea value={form.description} onChange={(e) => set("description", e.target.value)} className="min-h-[90px] border-sand-300" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Jenis Organisasi</Label>
          <select value={form.orgType} onChange={(e) => set("orgType", e.target.value)} className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white">
            {ORG_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Jumlah Anggota</Label>
          <Input type="number" min={0} value={form.memberCount} onChange={(e) => set("memberCount", e.target.value)} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Kota / Wilayah</Label>
          <Input value={form.region} onChange={(e) => set("region", e.target.value)} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Provinsi</Label>
          <Input value={form.province} onChange={(e) => set("province", e.target.value)} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Email Kontak</Label>
          <Input type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} className="border-sand-300" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Telepon Kontak</Label>
          <Input value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className="border-sand-300" />
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label className="text-forest-500 font-medium">Website</Label>
          <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://…" className="border-sand-300" />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-forest-500 font-medium">Fokus ABK</Label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_OPTIONS.map(([value, label]) => {
            const active = form.focusAreas.includes(value);
            return (
              <button key={value} type="button" onClick={() => toggleFocus(value)} className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${active ? "border-forest-500 bg-forest-50 text-forest-600" : "border-sand-300 text-sand-600 hover:border-sand-400"}`}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isVerified} onChange={(e) => set("isVerified", e.target.checked)} className="w-4 h-4 accent-forest-500" />
          <span className="text-sm text-forest-500">Terverifikasi</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="w-4 h-4 accent-forest-500" />
          <span className="text-sm text-forest-500">Aktif (tampil di forum)</span>
        </label>
      </div>

      <Button onClick={submit} disabled={saving} className="bg-forest-500 hover:bg-forest-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {mode === "create" ? "Buat Komunitas" : "Simpan Perubahan"}
      </Button>
    </div>
  );
}
