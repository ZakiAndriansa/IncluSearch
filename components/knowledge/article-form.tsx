"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const CATEGORIES: { value: string; label: string }[] = [
  { value: "LEARNING_DIFFICULTIES", label: "Kesulitan Belajar" },
  { value: "BEHAVIORAL_SUPPORT", label: "Dukungan Perilaku" },
  { value: "COMMUNICATION_DISORDERS", label: "Gangguan Komunikasi" },
  { value: "SENSORY_PROCESSING", label: "Pemrosesan Sensorik" },
  { value: "PARENTING_TIPS", label: "Tips Parenting" },
  { value: "EXPERT_GUIDES", label: "Panduan Pakar" },
  { value: "CASE_STUDIES", label: "Studi Kasus" },
];

const TYPES: { value: string; label: string }[] = [
  { value: "ARTICLE", label: "Artikel" },
  { value: "VIDEO", label: "Video" },
  { value: "MODULE", label: "Modul" },
];

export function ArticleForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: "",
    category: "LEARNING_DIFFICULTIES",
    type: "ARTICLE",
    excerpt: "",
    content: "",
    thumbnailUrl: "",
    readTimeMins: "",
    isPremium: false,
  });

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit() {
    setSaving(true);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          category: form.category,
          type: form.type,
          excerpt: form.excerpt || null,
          content: form.content,
          thumbnailUrl: form.thumbnailUrl || null,
          readTimeMins: form.readTimeMins ? parseInt(form.readTimeMins) : null,
          isPremium: form.isPremium,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Gagal");
      toast({ title: "Artikel dipublikasikan" });
      router.push("/knowledge-hub/saya");
      router.refresh();
    } catch (err) {
      toast({
        title: "Gagal menyimpan artikel",
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
        <Input
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
          placeholder="Judul artikel"
          className="border-sand-300"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Kategori</Label>
          <select
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
            className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Tipe</Label>
          <select
            value={form.type}
            onChange={(e) => set("type", e.target.value)}
            className="w-full h-10 rounded-md border border-sand-300 px-3 text-sm bg-white"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Ringkasan</Label>
        <Textarea
          value={form.excerpt}
          onChange={(e) => set("excerpt", e.target.value)}
          placeholder="Ringkasan singkat (opsional)"
          className="min-h-[60px] border-sand-300"
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-forest-500 font-medium">Isi Artikel</Label>
        <Textarea
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
          placeholder="Tulis isi artikel di sini. Gunakan baris baru untuk paragraf."
          className="min-h-[240px] border-sand-300"
        />
        <p className="text-xs text-sand-400">
          Ditulis sebagai teks biasa (tanpa HTML) demi keamanan pembaca.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">URL Thumbnail (opsional)</Label>
          <Input
            value={form.thumbnailUrl}
            onChange={(e) => set("thumbnailUrl", e.target.value)}
            placeholder="https://…"
            className="border-sand-300"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-500 font-medium">Estimasi baca (menit)</Label>
          <Input
            type="number"
            min={1}
            value={form.readTimeMins}
            onChange={(e) => set("readTimeMins", e.target.value)}
            className="border-sand-300"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={form.isPremium}
          onChange={(e) => set("isPremium", e.target.checked)}
          className="w-4 h-4 accent-forest-500"
        />
        <span className="text-sm text-forest-500">Konten premium (khusus pelanggan)</span>
      </label>

      <Button
        onClick={submit}
        disabled={saving || !form.title || form.content.length < 20}
        className="bg-forest-500 hover:bg-forest-600 text-white"
      >
        {saving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Send className="w-4 h-4 mr-2" />
        )}
        Publikasikan
      </Button>
    </div>
  );
}
