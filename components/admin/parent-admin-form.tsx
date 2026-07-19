"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";

export interface ParentInitial {
  name: string;
  phone: string | null;
  isPremium: boolean;
  image: string | null;
}

export function ParentAdminForm({
  mode,
  parentId,
  initial,
}: {
  mode: "create" | "edit";
  parentId?: string;
  initial?: ParentInitial;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    email: "",
    password: "",
    phone: initial?.phone ?? "",
    isPremium: initial?.isPremium ?? false,
    image: initial?.image ?? "",
  });

  async function submit() {
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || null,
        isPremium: form.isPremium,
        image: form.image || null,
        ...(mode === "create" ? { email: form.email, password: form.password } : {}),
      };
      const res = await fetch(
        mode === "create" ? "/api/admin/parents" : `/api/admin/parents/${parentId}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: mode === "create" ? "Orang tua dibuat" : "Perubahan tersimpan" });
      router.push("/admin/orang-tua");
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
        <Label className="text-forest-500 font-medium">Foto Profil</Label>
        <FileUpload
          accept="image/*"
          folder="avatars"
          label="Unggah Foto"
          preview
          currentUrl={form.image || null}
          onUploaded={(url) => setForm((f) => ({ ...f, image: url }))}
          onClear={() => setForm((f) => ({ ...f, image: "" }))}
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
          <Label className="text-forest-500 font-medium">Nomor HP</Label>
          <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="border-sand-300" />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPremium} onChange={(e) => setForm((f) => ({ ...f, isPremium: e.target.checked }))} className="w-4 h-4 accent-forest-500" />
        <span className="text-sm text-forest-500">Premium (konsultasi tanpa batas)</span>
      </label>

      <Button onClick={submit} disabled={saving} className="bg-forest-500 hover:bg-forest-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        {mode === "create" ? "Buat Orang Tua" : "Simpan Perubahan"}
      </Button>
    </div>
  );
}
