"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";

const CATEGORIES = [
  { value: "LEARNING_DIFFICULTIES", label: "Kesulitan Belajar" },
  { value: "BEHAVIORAL_SUPPORT", label: "Dukungan Perilaku" },
  { value: "COMMUNICATION_DISORDERS", label: "Gangguan Komunikasi" },
  { value: "SENSORY_PROCESSING", label: "Pemrosesan Sensorik" },
  { value: "PARENTING_TIPS", label: "Tips Parenting" },
  { value: "EXPERT_GUIDES", label: "Panduan Pakar" },
  { value: "CASE_STUDIES", label: "Studi Kasus" },
];

const TYPES = [
  { value: "ARTICLE", label: "Tulisan" },
  { value: "LINK", label: "Tautan (link)" },
  { value: "VIDEO", label: "File Video" },
  { value: "PHOTO", label: "File Foto" },
  { value: "MODULE", label: "Modul" },
];

export interface ArticleInitial {
  title: string;
  category: string;
  type: string;
  excerpt: string | null;
  content: string | null;
  externalUrl: string | null;
  videoUrl: string | null;
  fileUrl: string | null;
  thumbnailUrl: string | null;
  readTimeMins: number | null;
  isPremium: boolean;
}

export function ArticleForm({
  mode = "create",
  contentId,
  initial,
}: {
  mode?: "create" | "edit";
  contentId?: string;
  initial?: ArticleInitial;
} = {}) {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    category: initial?.category ?? "LEARNING_DIFFICULTIES",
    type: initial?.type ?? "ARTICLE",
    excerpt: initial?.excerpt ?? "",
    content: initial?.content ?? "",
    externalUrl: initial?.externalUrl ?? "",
    videoUrl: initial?.videoUrl ?? "",
    fileUrl: initial?.fileUrl ?? "",
    thumbnailUrl: initial?.thumbnailUrl ?? "",
    readTimeMins: initial?.readTimeMins != null ? String(initial.readTimeMins) : "",
    isPremium: initial?.isPremium ?? false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isText = form.type === "ARTICLE" || form.type === "MODULE";
  const mainReady =
    (isText && form.content.length >= 20) ||
    (form.type === "LINK" && !!form.externalUrl) ||
    (form.type === "VIDEO" && !!form.videoUrl) ||
    (form.type === "PHOTO" && !!form.fileUrl);

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch(
        mode === "edit" ? `/api/knowledge/${contentId}` : "/api/knowledge",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: form.title,
            category: form.category,
            type: form.type,
            excerpt: form.excerpt || null,
            content: isText ? form.content : null,
            externalUrl: form.type === "LINK" ? form.externalUrl : null,
            videoUrl: form.type === "VIDEO" ? form.videoUrl : null,
            fileUrl: form.type === "PHOTO" ? form.fileUrl : null,
            thumbnailUrl: form.thumbnailUrl || null,
            readTimeMins: form.readTimeMins ? parseInt(form.readTimeMins) : null,
            isPremium: form.isPremium,
          }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: mode === "edit" ? "Perubahan tersimpan" : "Konten dipublikasikan" });
      router.push("/knowledge-hub/saya");
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
        <Label className="text-forest-500 font-medium">Judul</Label>
        <Input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Judul konten" className="border-sand-300" />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Kategori</Label>
          <select value={form.category} onChange={(e) => set("category", e.target.value)} className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white">
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Tipe Konten</Label>
          <select value={form.type} onChange={(e) => set("type", e.target.value)} className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white">
            {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Ringkasan</Label>
        <Textarea value={form.excerpt} onChange={(e) => set("excerpt", e.target.value)} placeholder="Ringkasan singkat (opsional)" className="min-h-[60px] border-sand-300" />
      </div>

      {/* Main content — depends on type */}
      {isText && (
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Isi {form.type === "MODULE" ? "Modul" : "Artikel"}</Label>
          <Textarea value={form.content} onChange={(e) => set("content", e.target.value)} placeholder="Tulis di sini. Gunakan baris baru untuk paragraf." className="min-h-[220px] border-sand-300" />
          <p className="text-xs text-sand-400">Teks biasa (tanpa HTML) demi keamanan pembaca.</p>
        </div>
      )}

      {form.type === "LINK" && (
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">URL Tautan</Label>
          <Input value={form.externalUrl} onChange={(e) => set("externalUrl", e.target.value)} placeholder="https://…" className="border-sand-300" />
        </div>
      )}

      {form.type === "VIDEO" && (
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">File Video</Label>
          <FileUpload accept="video/*" folder="knowledge/video" label="Unggah Video" currentUrl={form.videoUrl || null} onUploaded={(url) => set("videoUrl", url)} onClear={() => set("videoUrl", "")} maxSizeMB={100} />
        </div>
      )}

      {form.type === "PHOTO" && (
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">File Foto</Label>
          <FileUpload accept="image/*" folder="knowledge/photo" label="Unggah Foto" preview currentUrl={form.fileUrl || null} onUploaded={(url) => set("fileUrl", url)} onClear={() => set("fileUrl", "")} maxSizeMB={15} />
        </div>
      )}

      {/* Thumbnail (optional) */}
      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Thumbnail (opsional)</Label>
        <FileUpload accept="image/*" folder="knowledge/thumb" label="Unggah Thumbnail" preview currentUrl={form.thumbnailUrl || null} onUploaded={(url) => set("thumbnailUrl", url)} onClear={() => set("thumbnailUrl", "")} maxSizeMB={5} />
      </div>

      <div className="space-y-1.5 max-w-[200px]">
        <Label className="text-forest-500 font-medium">Estimasi baca/tonton (menit)</Label>
        <Input type="number" min={1} value={form.readTimeMins} onChange={(e) => set("readTimeMins", e.target.value)} className="border-sand-300" />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={form.isPremium} onChange={(e) => set("isPremium", e.target.checked)} className="w-4 h-4 accent-forest-500" />
        <span className="text-sm text-forest-500">Konten premium (khusus pelanggan)</span>
      </label>

      <Button onClick={submit} disabled={saving || !form.title || !mainReady} className="bg-forest-500 hover:bg-forest-600 text-white">
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
        {mode === "edit" ? "Simpan Perubahan" : "Publikasikan"}
      </Button>
    </div>
  );
}
