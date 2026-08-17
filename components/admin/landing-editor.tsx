"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Loader2,
  Save,
  Eye,
  X,
  ImageIcon,
  Film,
  Sparkles,
  BarChart3,
  LayoutGrid,
  ListOrdered,
  Users,
  Megaphone,
  PanelBottom,
  ArrowRight,
  ShieldCheck,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { FileUpload } from "@/components/shared/file-upload";
import { DEFAULT_LANDING, FEATURE_META, type LandingData } from "@/lib/landing";

const UPLOAD = "/api/admin/landing/upload";

// ── Section accents (each section gets a distinct brand colour) ──────
type AccentKey = "forest" | "olive" | "teal" | "amber" | "sand";
const ACCENT: Record<
  AccentKey,
  { tile: string; icon: string; head: string; border: string; active: string }
> = {
  forest: { tile: "bg-forest-50", icon: "text-forest-500", head: "bg-forest-50/40", border: "border-forest-100", active: "bg-forest-50 text-forest-600 border-forest-200" },
  olive: { tile: "bg-olive-50", icon: "text-olive-500", head: "bg-olive-50/50", border: "border-olive-100", active: "bg-olive-50 text-olive-600 border-olive-200" },
  teal: { tile: "bg-teal-dark/10", icon: "text-teal-dark", head: "bg-teal-dark/5", border: "border-teal-dark/15", active: "bg-teal-dark/5 text-teal-dark border-teal-dark/25" },
  amber: { tile: "bg-amber-50", icon: "text-amber-500", head: "bg-amber-50/50", border: "border-amber-100", active: "bg-amber-50 text-amber-600 border-amber-200" },
  sand: { tile: "bg-sand-100", icon: "text-sand-600", head: "bg-sand-50", border: "border-sand-200", active: "bg-sand-100 text-sand-700 border-sand-300" },
};

const SECTIONS: { id: string; label: string; icon: React.ElementType; accent: AccentKey }[] = [
  { id: "sec-hero", label: "Hero", icon: Sparkles, accent: "forest" },
  { id: "sec-stats", label: "Statistik", icon: BarChart3, accent: "amber" },
  { id: "sec-features", label: "Fitur", icon: LayoutGrid, accent: "teal" },
  { id: "sec-steps", label: "Cara Kerja", icon: ListOrdered, accent: "olive" },
  { id: "sec-video", label: "Video", icon: Film, accent: "forest" },
  { id: "sec-audience", label: "Untuk Siapa", icon: Users, accent: "teal" },
  { id: "sec-cta", label: "CTA", icon: Megaphone, accent: "olive" },
  { id: "sec-footer", label: "Footer", icon: PanelBottom, accent: "sand" },
];

// ── Field helpers ────────────────────────────────────────────────────
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
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">{label}</Label>
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
      <Label className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">{label}</Label>
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
  id,
  title,
  desc,
  icon: Icon,
  accent,
  children,
}: {
  id: string;
  title: string;
  desc?: string;
  icon: React.ElementType;
  accent: AccentKey;
  children: React.ReactNode;
}) {
  const a = ACCENT[accent];
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-2xl border border-sand-200 overflow-hidden shadow-sm">
      <div className={`flex items-center gap-3 px-5 py-4 border-b ${a.border} ${a.head}`}>
        <div className={`w-9 h-9 rounded-xl ${a.tile} flex items-center justify-center flex-shrink-0`}>
          <Icon className={`w-5 h-5 ${a.icon}`} />
        </div>
        <div className="min-w-0">
          <h2 className="font-serif font-semibold text-forest-500 leading-tight">{title}</h2>
          {desc && <p className="text-xs text-sand-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <div className="p-5 sm:p-6 space-y-4">{children}</div>
    </section>
  );
}

// Media card with a large preview + upload button.
function MediaField({
  kind,
  value,
  folder,
  changeLabel,
  emptyLabel,
  aspect = "aspect-video",
  onUploaded,
  onClear,
}: {
  kind: "image" | "video";
  value: string;
  folder: string;
  changeLabel: string;
  emptyLabel: string;
  aspect?: string;
  onUploaded: (url: string) => void;
  onClear: () => void;
}) {
  return (
    <div className="rounded-xl border border-sand-200 bg-sand-50 overflow-hidden">
      <div className={`relative ${aspect} bg-gradient-to-br from-sand-100 to-sand-200 flex items-center justify-center`}>
        {value ? (
          kind === "video" ? (
            <video src={value} controls className="w-full h-full object-contain bg-black" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="pratinjau" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="flex flex-col items-center gap-1 text-sand-400 text-xs">
            {kind === "video" ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
            {emptyLabel}
          </div>
        )}
      </div>
      <div className="p-2.5 flex items-center gap-3">
        <FileUpload
          accept={kind === "video" ? "video/*" : "image/*"}
          folder={folder}
          endpoint={UPLOAD}
          preview={false}
          maxSizeMB={kind === "video" ? 100 : 8}
          label={changeLabel}
          currentUrl={null}
          onUploaded={(url) => onUploaded(url)}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-xs text-sand-500 hover:text-red-500 inline-flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" /> Hapus
          </button>
        )}
      </div>
    </div>
  );
}

export function LandingEditor({ initial }: { initial: LandingData }) {
  const router = useRouter();
  const { toast } = useToast();
  const [data, setData] = useState<LandingData>(initial);
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState(SECTIONS[0].id);

  const dirty = useMemo(
    () => JSON.stringify(data) !== JSON.stringify(initial),
    [data, initial]
  );

  // Scroll-spy for the section navigator.
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

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
    setData((d) => ({
      ...d,
      features: {
        ...d.features,
        items: d.features.items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)),
      },
    }));

  const setStepItem = (i: number, key: "no" | "title" | "desc", v: string) =>
    setData((d) => ({
      ...d,
      steps: {
        ...d.steps,
        items: d.steps.items.map((it, idx) => (idx === i ? { ...it, [key]: v } : it)),
      },
    }));

  const setAudienceCard = (
    which: "parent" | "expert",
    key: "title" | "desc" | "ctaLabel" | "ctaHref",
    v: string
  ) =>
    setData((d) => ({
      ...d,
      audience: { ...d.audience, [which]: { ...d.audience[which], [key]: v } },
    }));

  const setBullet = (which: "parent" | "expert", i: number, v: string) =>
    setData((d) => ({
      ...d,
      audience: {
        ...d.audience,
        [which]: {
          ...d.audience[which],
          bullets: d.audience[which].bullets.map((b, idx) => (idx === i ? v : b)),
        },
      },
    }));

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

  const SaveBtn = (
    <Button onClick={save} disabled={saving || !dirty} className="bg-forest-500 hover:bg-forest-600 text-white disabled:opacity-60">
      {saving ? <Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> : <Save className="w-4 h-4 mr-1.5" />}
      {dirty ? "Simpan Perubahan" : "Tersimpan"}
    </Button>
  );

  return (
    <div className="pb-24">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 -mx-1 px-1 py-3 bg-sand-50/90 backdrop-blur border-b border-sand-200 mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-forest-500">Kelola Landing Page</h1>
            <p className="text-sand-500 text-sm mt-0.5">Ubah semua teks, foto, dan video halaman utama.</p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`hidden sm:inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full border ${
                dirty
                  ? "bg-amber-50 text-amber-600 border-amber-200"
                  : "bg-forest-50 text-forest-600 border-forest-100"
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-forest-400"}`} />
              {dirty ? "Belum disimpan" : "Tersimpan"}
            </span>
            <Button asChild variant="outline" className="border-sand-300 text-forest-500 hover:bg-sand-50">
              <Link href="/" target="_blank">
                <Eye className="w-4 h-4 mr-1.5" /> Lihat
              </Link>
            </Button>
            {SaveBtn}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[190px_1fr] gap-6">
        {/* Section navigator */}
        <aside className="hidden lg:block">
          <nav className="sticky top-36 space-y-1">
            {SECTIONS.map((s) => {
              const a = ACCENT[s.accent];
              const isActive = active === s.id;
              return (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm border transition-colors ${
                    isActive ? a.active : "border-transparent text-sand-600 hover:bg-white hover:text-forest-500"
                  }`}
                >
                  <s.icon className="w-4 h-4 flex-shrink-0" />
                  {s.label}
                </a>
              );
            })}
          </nav>
        </aside>

        {/* Form + live preview */}
        <div className="min-w-0 space-y-5">
          {/* ── Live hero preview ── */}
          <div className="rounded-2xl border border-forest-100 overflow-hidden shadow-sm">
            <div className="flex items-center gap-2 px-4 py-2 bg-forest-50/60 border-b border-forest-100">
              <Eye className="w-4 h-4 text-forest-500" />
              <span className="text-xs font-semibold uppercase tracking-wide text-forest-500">
                Pratinjau Hero
              </span>
              <span className="text-[11px] text-sand-400">— ikut berubah saat kamu ketik</span>
            </div>
            <div className="relative bg-gradient-to-b from-forest-50/60 to-sand-50 p-5 grid sm:grid-cols-[1fr_150px] gap-4 items-center">
              <div className="space-y-2.5 min-w-0">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-600 text-[11px] font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-olive-500" />
                  {data.hero.badge || "Badge"}
                </span>
                <h3 className="font-serif font-bold text-forest-500 text-xl sm:text-2xl leading-tight">
                  {data.hero.titleBefore}
                  <span className="text-olive-500">{data.hero.titleHighlight}</span>
                  {data.hero.titleAfter}
                </h3>
                <p className="text-sand-600 text-sm line-clamp-2">{data.hero.subtitle}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="inline-flex items-center gap-1 rounded-lg bg-forest-500 text-white text-xs px-3 py-1.5">
                    {data.hero.primaryCta || "Tombol"} <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="inline-flex items-center rounded-lg border border-sand-300 text-forest-500 text-xs px-3 py-1.5">
                    {data.hero.secondaryCta || "Tombol"}
                  </span>
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[11px] text-sand-500">
                  <span className="inline-flex items-center gap-1"><ShieldCheck className="w-3 h-3 text-olive-500" />{data.hero.trust1}</span>
                  <span className="inline-flex items-center gap-1"><Star className="w-3 h-3 text-teal-dark" />{data.hero.trust2}</span>
                </div>
              </div>
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden border border-sand-200 shadow-sm hidden sm:block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.hero.image} alt="pratinjau hero" className="absolute inset-0 w-full h-full object-cover" />
              </div>
            </div>
          </div>

          {/* ── HERO ── */}
          <Section id="sec-hero" icon={Sparkles} accent="forest" title="Hero (bagian atas)" desc="Judul dibagi tiga agar bagian tengah bisa diberi warna aksen.">
            <TextField label="Badge" value={data.hero.badge} onChange={(v) => patch("hero", { badge: v })} />
            <div className="grid sm:grid-cols-3 gap-3">
              <TextField label="Judul — awal" value={data.hero.titleBefore} onChange={(v) => patch("hero", { titleBefore: v })} />
              <TextField label="Judul — aksen" value={data.hero.titleHighlight} onChange={(v) => patch("hero", { titleHighlight: v })} />
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
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">Foto hero</Label>
              <MediaField
                kind="image"
                folder="hero"
                aspect="aspect-[16/10]"
                changeLabel="Ganti foto"
                emptyLabel="Belum ada foto"
                value={data.hero.image}
                onUploaded={(url) => patch("hero", { image: url })}
                onClear={() => patch("hero", { image: DEFAULT_LANDING.hero.image })}
              />
            </div>
          </Section>

          {/* ── STATS ── */}
          <Section id="sec-stats" icon={BarChart3} accent="amber" title="Label Statistik" desc="Angkanya otomatis dari database; hanya labelnya yang bisa diubah.">
            <div className="grid sm:grid-cols-2 gap-3">
              {data.statsLabels.map((s, i) => (
                <TextField key={i} label={`Label ${i + 1}`} value={s} onChange={(v) => setStat(i, v)} />
              ))}
            </div>
          </Section>

          {/* ── FEATURES ── */}
          <Section id="sec-features" icon={LayoutGrid} accent="teal" title="Fitur" desc="Ikon tiap kartu tetap; hanya judul & deskripsi yang bisa diubah.">
            <TextField label="Eyebrow" value={data.features.eyebrow} onChange={(v) => patch("features", { eyebrow: v })} />
            <TextField label="Judul section" value={data.features.title} onChange={(v) => patch("features", { title: v })} />
            <AreaField label="Subjudul" value={data.features.subtitle} onChange={(v) => patch("features", { subtitle: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              {data.features.items.map((f, i) => {
                const meta = FEATURE_META[i] ?? FEATURE_META[FEATURE_META.length - 1];
                const Icon = meta.icon;
                return (
                  <div key={i} className="rounded-xl border border-sand-200 p-3 space-y-2 bg-sand-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center`}>
                        <Icon className={`w-4 h-4 ${meta.color}`} />
                      </div>
                      <span className="text-xs font-semibold text-sand-500">Kartu {i + 1}</span>
                    </div>
                    <TextField label="Judul" value={f.title} onChange={(v) => setFeatureItem(i, "title", v)} />
                    <AreaField label="Deskripsi" value={f.desc} rows={2} onChange={(v) => setFeatureItem(i, "desc", v)} />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── STEPS ── */}
          <Section id="sec-steps" icon={ListOrdered} accent="olive" title="Cara Kerja" desc="Tiga langkah alur pengguna.">
            <TextField label="Eyebrow" value={data.steps.eyebrow} onChange={(v) => patch("steps", { eyebrow: v })} />
            <TextField label="Judul section" value={data.steps.title} onChange={(v) => patch("steps", { title: v })} />
            <div className="space-y-3">
              {data.steps.items.map((s, i) => (
                <div key={i} className="rounded-xl border border-sand-200 p-3 bg-sand-50 flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-olive-50 text-olive-600 font-serif font-bold flex items-center justify-center flex-shrink-0">
                    {s.no || i + 1}
                  </div>
                  <div className="flex-1 space-y-2 min-w-0">
                    <div className="grid grid-cols-[70px_1fr] gap-2">
                      <TextField label="No." value={s.no} onChange={(v) => setStepItem(i, "no", v)} />
                      <TextField label="Judul" value={s.title} onChange={(v) => setStepItem(i, "title", v)} />
                    </div>
                    <AreaField label="Deskripsi" value={s.desc} rows={2} onChange={(v) => setStepItem(i, "desc", v)} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* ── VIDEO ── */}
          <Section id="sec-video" icon={Film} accent="forest" title="Video" desc="Unggah file video (.mp4). Kalau kosong, tampil placeholder 'segera hadir'.">
            <TextField label="Eyebrow" value={data.video.eyebrow} onChange={(v) => patch("video", { eyebrow: v })} />
            <TextField label="Judul section" value={data.video.title} onChange={(v) => patch("video", { title: v })} />
            <AreaField label="Subjudul" value={data.video.subtitle} onChange={(v) => patch("video", { subtitle: v })} />
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">Poster (thumbnail)</Label>
                <MediaField
                  kind="image"
                  folder="video"
                  changeLabel="Ganti poster"
                  emptyLabel="Belum ada poster"
                  value={data.video.poster}
                  onUploaded={(url) => patch("video", { poster: url })}
                  onClear={() => patch("video", { poster: DEFAULT_LANDING.video.poster })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-semibold uppercase tracking-wide text-sand-500">File video</Label>
                <MediaField
                  kind="video"
                  folder="clip"
                  changeLabel={data.video.url ? "Ganti video" : "Unggah video"}
                  emptyLabel="Belum ada video"
                  value={data.video.url}
                  onUploaded={(url) => patch("video", { url })}
                  onClear={() => patch("video", { url: "" })}
                />
              </div>
            </div>
          </Section>

          {/* ── AUDIENCE ── */}
          <Section id="sec-audience" icon={Users} accent="teal" title="Untuk Siapa" desc="Dua kartu: Orang Tua/Guru & Pakar.">
            <TextField label="Eyebrow" value={data.audience.eyebrow} onChange={(v) => patch("audience", { eyebrow: v })} />
            <TextField label="Judul section" value={data.audience.title} onChange={(v) => patch("audience", { title: v })} />
            <div className="grid md:grid-cols-2 gap-4">
              {(["parent", "expert"] as const).map((which) => {
                const Icon = which === "parent" ? Users : Star;
                const tone = which === "parent" ? "bg-forest-50 text-forest-500" : "bg-teal-dark/10 text-teal-dark";
                return (
                  <div key={which} className="rounded-xl border border-sand-200 p-3 space-y-2 bg-sand-50">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tone}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-semibold text-sand-500">
                        {which === "parent" ? "Kartu Orang Tua / Guru" : "Kartu Pakar"}
                      </span>
                    </div>
                    <TextField label="Judul" value={data.audience[which].title} onChange={(v) => setAudienceCard(which, "title", v)} />
                    <AreaField label="Deskripsi" value={data.audience[which].desc} rows={2} onChange={(v) => setAudienceCard(which, "desc", v)} />
                    {data.audience[which].bullets.map((b, i) => (
                      <TextField key={i} label={`Poin ${i + 1}`} value={b} onChange={(v) => setBullet(which, i, v)} />
                    ))}
                    <TextField label="Teks tombol" value={data.audience[which].ctaLabel} onChange={(v) => setAudienceCard(which, "ctaLabel", v)} />
                    <TextField
                      label="Link tombol — kosongkan untuk sembunyikan"
                      value={data.audience[which].ctaHref}
                      placeholder="/register · https://wa.me/62… · mailto:…"
                      onChange={(v) => setAudienceCard(which, "ctaHref", v)}
                    />
                  </div>
                );
              })}
            </div>
          </Section>

          {/* ── CTA ── */}
          <Section id="sec-cta" icon={Megaphone} accent="olive" title="Ajakan (CTA bawah)">
            <TextField label="Judul" value={data.cta.title} onChange={(v) => patch("cta", { title: v })} />
            <AreaField label="Subjudul" value={data.cta.subtitle} onChange={(v) => patch("cta", { subtitle: v })} />
            <div className="grid sm:grid-cols-2 gap-3">
              <TextField label="Tombol utama" value={data.cta.primary} onChange={(v) => patch("cta", { primary: v })} />
              <TextField label="Tombol kedua" value={data.cta.secondary} onChange={(v) => patch("cta", { secondary: v })} />
            </div>
          </Section>

          {/* ── FOOTER ── */}
          <Section id="sec-footer" icon={PanelBottom} accent="sand" title="Footer">
            <TextField label="Tagline" value={data.footer.tagline} onChange={(v) => patch("footer", { tagline: v })} />
          </Section>
        </div>
      </div>

      {/* Floating save (mobile-friendly) */}
      <div className="sticky bottom-4 flex justify-end mt-4">
        <div className="bg-white/90 backdrop-blur border border-sand-200 rounded-full shadow-lg px-2 py-2">
          {SaveBtn}
        </div>
      </div>
    </div>
  );
}
