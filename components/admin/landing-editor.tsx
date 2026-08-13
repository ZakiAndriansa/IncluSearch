"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Eye, ImageIcon, Film } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";
import { DEFAULT_LANDING, type LandingData } from "@/lib/landing";

const UPLOAD = "/api/admin/landing/upload";

// ── small field helpers ──────────────────────────────────────────────
function TextField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-forest-600 text-sm">{label}</Label>
      <Input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="border-sand-300 focus:border-forest-500"
      />
    </div>
  );
}

function AreaField({
  label,
  value,
  onChange,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-forest-600 text-sm">{label}</Label>
      <Textarea
        value={value}
        rows={rows}
        onChange={(e) => onChange(e.target.value)}
        className="border-sand-300 focus:border-forest-500 resize-y"
      />
    </div>
  );
}

function Section({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-2xl border border-sand-200 p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-serif font-semibold text-lg text-forest-500">{title}</h2>
        {desc && <p className="text-xs text-sand-500 mt-0.5">{desc}</p>}
      </div>
      {children}
    </section>
  );
}

export function LandingEditor({ initial }: { initial: LandingData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<LandingData>(initial);
  const [saving, setSaving] = useState(false);

  // ── immutable update helpers ──
  const patch = <K extends keyof LandingData>(key: K, value: Partial<LandingData[K]>) =>
    setData((d) => ({ ...d, [key]: { ...(d[key] as object), ...value } }));

  const setStat = (i: number, v: string) =>
    setData((d) => {
      const statsLabels = [...d.statsLabels] as LandingData["statsLabels"];
      statsLabels[i] = v;
      return { ...d, statsLabels };
    });

  const setFeatureItem = (i: number, key: "title" | "desc", v: string) =>
    setData((d) => {
      const items = d.features.items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it));
      return { ...d, features: { ...d.features, items } };
    });

  const setStepItem = (i: number, key: "no" | "title" | "desc", v: string) =>
    setData((d) => {
      const items = d.steps.items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it));
      return { ...d, steps: { ...d.steps, items } };
    });

  const setAudienceCard = (
    which: "parent" | "expert",
    key: "title" | "desc" | "ctaLabel",
    v: string
  ) =>
    setData((d) => ({
      ...d,
      audience: { ...d.audience, [which]: { ...d.audience[which], [key]: v } },
    }));

  const setBullet = (which: "parent" | "expert", i: number, v: string) =>
    setData((d) => {
      const bullets = d.audience[which].bullets.map((b, idx) => (idx === i ? v : b));
      return { ...d, audience: { ...d.audience, [which]: { ...d.audience[which], bullets } } };
    });

  async function save() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/landing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Gagal menyimpan");
      toast({ title: "Landing page tersimpan", description: "Perubahan langsung tampil di halaman utama." });
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

  const SaveButton = (
    <Button onClick={save} disabled={saving} className="bg-forest-500 hover:bg-forest-600 text-white">
      {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
      Simpan Perubahan
    </Button>
  );

  return (
    <div className="space-y-5 pb-24">
      {/* Header actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Kelola Landing Page</h1>
          <p className="text-sand-500 text-sm mt-1">
            Ubah semua teks, foto, dan video halaman utama. Statistik angka tetap otomatis dari data.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="border-sand-300 text-forest-500 hover:bg-sand-50">
            <Link href="/" target="_blank">
              <Eye className="w-4 h-4 mr-1.5" /> Lihat
            </Link>
          </Button>
          {SaveButton}
        </div>
      </div>

      {/* HERO */}
      <Section title="Hero (bagian atas)" desc="Judul dibagi tiga agar bagian tengah bisa diberi warna aksen.">
        <TextField label="Badge" value={data.hero.badge} onChange={(v) => patch("hero", { badge: v })} />
        <div className="grid sm:grid-cols-3 gap-3">
          <TextField label="Judul — awal" value={data.hero.titleBefore} onChange={(v) => patch("hero", { titleBefore: v })} />
          <TextField label="Judul — aksen (warna)" value={data.hero.titleHighlight} onChange={(v) => patch("hero", { titleHighlight: v })} />
          <TextField label="Judul — akhir" value={data.hero.titleAfter} onChange={(v) => patch("hero", { titleAfter: v })} />
        </div>
        <AreaField label="Subjudul" value={data.hero.subtitle} onChange={(v) => patch("hero", { subtitle: v })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Tombol utama" value={data.hero.primaryCta} onChange={(v) => patch("hero", { primaryCta: v })} />
          <TextField label="Tombol kedua" value={data.hero.secondaryCta} onChange={(v) => patch("hero", { secondaryCta: v })} />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Poin kepercayaan 1" value={data.hero.trust1} onChange={(v) => patch("hero", { trust1: v })} />
          <TextField label="Poin kepercayaan 2" value={data.hero.trust2} onChange={(v) => patch("hero", { trust2: v })} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-forest-600 text-sm flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4" /> Foto hero
          </Label>
          <FileUpload
            accept="image/*"
            folder="hero"
            endpoint={UPLOAD}
            preview
            maxSizeMB={8}
            label="Ganti foto"
            currentUrl={data.hero.image}
            onUploaded={(url) => patch("hero", { image: url })}
            onClear={() => patch("hero", { image: DEFAULT_LANDING.hero.image })}
          />
        </div>
      </Section>

      {/* STATS */}
      <Section title="Label Statistik" desc="Angkanya otomatis dari database; hanya labelnya yang bisa diubah.">
        <div className="grid sm:grid-cols-2 gap-3">
          {data.statsLabels.map((s, i) => (
            <TextField key={i} label={`Label ${i + 1}`} value={s} onChange={(v) => setStat(i, v)} />
          ))}
        </div>
      </Section>

      {/* FEATURES */}
      <Section title="Fitur" desc="Ikon tiap kartu tetap; hanya judul & deskripsi yang bisa diubah.">
        <TextField label="Eyebrow" value={data.features.eyebrow} onChange={(v) => patch("features", { eyebrow: v })} />
        <TextField label="Judul section" value={data.features.title} onChange={(v) => patch("features", { title: v })} />
        <AreaField label="Subjudul" value={data.features.subtitle} onChange={(v) => patch("features", { subtitle: v })} />
        <div className="space-y-3">
          {data.features.items.map((f, i) => (
            <div key={i} className="rounded-xl border border-sand-200 p-3 space-y-2 bg-sand-50">
              <div className="text-xs font-semibold text-sand-500">Kartu {i + 1}</div>
              <TextField label="Judul" value={f.title} onChange={(v) => setFeatureItem(i, "title", v)} />
              <AreaField label="Deskripsi" value={f.desc} rows={2} onChange={(v) => setFeatureItem(i, "desc", v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* STEPS */}
      <Section title="Cara Kerja" desc="Tiga langkah alur pengguna.">
        <TextField label="Eyebrow" value={data.steps.eyebrow} onChange={(v) => patch("steps", { eyebrow: v })} />
        <TextField label="Judul section" value={data.steps.title} onChange={(v) => patch("steps", { title: v })} />
        <div className="space-y-3">
          {data.steps.items.map((s, i) => (
            <div key={i} className="rounded-xl border border-sand-200 p-3 space-y-2 bg-sand-50">
              <div className="grid grid-cols-[80px_1fr] gap-2">
                <TextField label="No." value={s.no} onChange={(v) => setStepItem(i, "no", v)} />
                <TextField label="Judul" value={s.title} onChange={(v) => setStepItem(i, "title", v)} />
              </div>
              <AreaField label="Deskripsi" value={s.desc} rows={2} onChange={(v) => setStepItem(i, "desc", v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* VIDEO */}
      <Section title="Video" desc="Unggah file video (.mp4). Kalau kosong, tampil placeholder 'segera hadir'.">
        <TextField label="Eyebrow" value={data.video.eyebrow} onChange={(v) => patch("video", { eyebrow: v })} />
        <TextField label="Judul section" value={data.video.title} onChange={(v) => patch("video", { title: v })} />
        <AreaField label="Subjudul" value={data.video.subtitle} onChange={(v) => patch("video", { subtitle: v })} />
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-forest-600 text-sm flex items-center gap-1.5">
              <ImageIcon className="w-4 h-4" /> Poster (thumbnail)
            </Label>
            <FileUpload
              accept="image/*"
              folder="video"
              endpoint={UPLOAD}
              preview
              maxSizeMB={8}
              label="Ganti poster"
              currentUrl={data.video.poster}
              onUploaded={(url) => patch("video", { poster: url })}
              onClear={() => patch("video", { poster: DEFAULT_LANDING.video.poster })}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-forest-600 text-sm flex items-center gap-1.5">
              <Film className="w-4 h-4" /> File video
            </Label>
            <FileUpload
              accept="video/*"
              folder="clip"
              endpoint={UPLOAD}
              maxSizeMB={100}
              label={data.video.url ? "Ganti video" : "Unggah video"}
              currentUrl={data.video.url || null}
              onUploaded={(url) => patch("video", { url })}
              onClear={() => patch("video", { url: "" })}
            />
            {!data.video.url && (
              <p className="text-xs text-sand-400">Belum ada video — placeholder akan tampil.</p>
            )}
          </div>
        </div>
      </Section>

      {/* AUDIENCE */}
      <Section title="Untuk Siapa" desc="Dua kartu: Orang Tua/Guru & Pakar.">
        <TextField label="Eyebrow" value={data.audience.eyebrow} onChange={(v) => patch("audience", { eyebrow: v })} />
        <TextField label="Judul section" value={data.audience.title} onChange={(v) => patch("audience", { title: v })} />
        <div className="grid md:grid-cols-2 gap-4">
          {(["parent", "expert"] as const).map((which) => (
            <div key={which} className="rounded-xl border border-sand-200 p-3 space-y-2 bg-sand-50">
              <div className="text-xs font-semibold text-sand-500">
                {which === "parent" ? "Kartu Orang Tua / Guru" : "Kartu Pakar"}
              </div>
              <TextField label="Judul" value={data.audience[which].title} onChange={(v) => setAudienceCard(which, "title", v)} />
              <AreaField label="Deskripsi" value={data.audience[which].desc} rows={2} onChange={(v) => setAudienceCard(which, "desc", v)} />
              {data.audience[which].bullets.map((b, i) => (
                <TextField key={i} label={`Poin ${i + 1}`} value={b} onChange={(v) => setBullet(which, i, v)} />
              ))}
              <TextField label="Teks tombol" value={data.audience[which].ctaLabel} onChange={(v) => setAudienceCard(which, "ctaLabel", v)} />
            </div>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section title="Ajakan (CTA bawah)">
        <TextField label="Judul" value={data.cta.title} onChange={(v) => patch("cta", { title: v })} />
        <AreaField label="Subjudul" value={data.cta.subtitle} onChange={(v) => patch("cta", { subtitle: v })} />
        <div className="grid sm:grid-cols-2 gap-3">
          <TextField label="Tombol utama" value={data.cta.primary} onChange={(v) => patch("cta", { primary: v })} />
          <TextField label="Tombol kedua" value={data.cta.secondary} onChange={(v) => patch("cta", { secondary: v })} />
        </div>
      </Section>

      {/* FOOTER */}
      <Section title="Footer">
        <TextField label="Tagline" value={data.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} />
      </Section>

      {/* Sticky save bar */}
      <div className="sticky bottom-4 flex justify-end">
        <div className="bg-white/90 backdrop-blur border border-sand-200 rounded-full shadow-lg px-2 py-2">
          {SaveButton}
        </div>
      </div>
    </div>
  );
}
