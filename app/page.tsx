import Link from "next/link";
import Image from "next/image";
import {
  Users,
  Play,
  ArrowRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLandingData } from "@/lib/landing.server";
import { FEATURE_META } from "@/lib/landing";
import { Button } from "@/components/ui/button";
import { LandingNav } from "@/components/landing/landing-nav";
import { Reveal } from "@/components/landing/reveal";
import { CountUp } from "@/components/landing/count-up";
import { VideoPlayer } from "@/components/landing/video-player";
import { BackToTop } from "@/components/landing/back-to-top";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "IncluSearch — Pendamping Tumbuh Kembang Anak Berkebutuhan Khusus",
  },
  description:
    "Temukan pakar ortopedagogik terverifikasi, akses Knowledge Hub, dan bergabung dengan komunitas peduli ABK. Konsultasi terjadwal, asesmen, dan pendampingan dalam satu platform.",
};

export default async function LandingPage() {
  const session = await auth();
  // The welcome page stays accessible even when signed in — the nav & CTAs
  // adapt so it's clear the user is still logged in.
  const loggedIn = !!session;

  // Editable content (from the admin CMS, merged over code defaults) +
  // real figures from the database — no hardcoded marketing numbers.
  const [content, expertCount, familyCount, contentCount, ratingAgg] = await Promise.all([
    getLandingData(),
    prisma.expertProfile.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.knowledgeContent.count(),
    prisma.expertProfile.aggregate({
      _avg: { rating: true },
      where: { isVerified: true, totalReviews: { gt: 0 } },
    }),
  ]);
  const avgRating = ratingAgg._avg.rating;

  // Numeric values so the counters can animate; labels are editable.
  const stats = [
    { value: expertCount, label: content.statsLabels[0] },
    { value: familyCount, label: content.statsLabels[1] },
    { value: contentCount, label: content.statsLabels[2] },
    { value: avgRating ?? 0, decimals: 1, suffix: "/5", label: content.statsLabels[3] },
  ];

  // Tautan eksternal (http/https) dibuka di tab baru; path internal / mailto / tel tetap.
  const extProps = (href: string) =>
    /^https?:\/\//.test(href) ? { target: "_blank" as const, rel: "noopener noreferrer" } : {};

  return (
    <div className="min-h-screen bg-sand-50 text-forest-500">
      <LandingNav loggedIn={loggedIn} />

      {/* ───────────────── Hero ───────────────── */}
      {/* wash hijau muda → sand (sebelumnya: tanpa gradient) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-forest-50/70 via-sand-50 to-sand-50">
        {/* soft brand glows */}
        <div className="absolute inset-0 -z-10 opacity-60">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-light/20 blur-3xl" />
          <div className="absolute top-40 -right-24 w-96 h-96 rounded-full bg-olive-200/40 blur-3xl" />
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 lg:py-20 grid lg:grid-cols-2 gap-10 lg:gap-14 items-center">
          {/* Copy */}
          <div className="space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-600 text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-olive-500 animate-pulse" />
              {content.hero.badge}
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold leading-[1.1]">
              {content.hero.titleBefore}
              <span className="text-olive-500">{content.hero.titleHighlight}</span>
              {content.hero.titleAfter}
            </h1>

            <p className="text-sand-700 text-lg leading-relaxed max-w-xl">
              {content.hero.subtitle}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="bg-forest-500 hover:bg-forest-600 text-white h-12 px-6 text-base transition-transform hover:-translate-y-0.5"
              >
                {loggedIn ? (
                  <Link href="/beranda">
                    Buka Beranda <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                ) : (
                  <Link href="/register">
                    {content.hero.primaryCta} <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                )}
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                // outline memaksa teks putih saat hover (hover:text-accent-foreground);
                // kunci agar teks tetap forest di atas latar putih.
                className="h-12 px-6 text-base border-sand-300 text-forest-500 hover:bg-white hover:text-forest-600 hover:border-forest-300"
              >
                <a href="#cara-kerja">{content.hero.secondaryCta}</a>
              </Button>
            </div>

            {/* Trust bullets */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm text-sand-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-olive-500" /> {content.hero.trust1}
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-dark" /> {content.hero.trust2}
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in">
            <div className="relative aspect-[4/5] sm:aspect-[5/5] max-w-md mx-auto rounded-[2rem] overflow-hidden border border-sand-200 shadow-xl">
              {/* Editable media (default static or /api/landing/media proxy) → plain <img> */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={content.hero.image}
                alt="Pendampingan anak berkebutuhan khusus bersama pakar"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-900/40 via-transparent to-transparent" />
            </div>

            {/* Floating rating card */}
            <div className="absolute -bottom-4 -left-2 sm:left-4 glass-card rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 transition-transform hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-forest-500 leading-none">
                  {avgRating ? avgRating.toFixed(1) : "5.0"}
                </div>
                <div className="text-xs text-sand-500 mt-0.5">Rating pakar</div>
              </div>
            </div>

            {/* Floating experts card */}
            <div className="absolute -top-3 -right-1 sm:right-2 glass-card rounded-2xl px-4 py-3 shadow-lg flex items-center gap-3 transition-transform hover:scale-105">
              <div className="w-10 h-10 rounded-xl bg-forest-50 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-forest-500" />
              </div>
              <div>
                <div className="text-lg font-bold text-forest-500 leading-none">
                  {expertCount > 0 ? expertCount : "—"}
                </div>
                <div className="text-xs text-sand-500 mt-0.5">Pakar siap bantu</div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats strip — angka menghitung naik saat masuk layar */}
        <Reveal className="max-w-6xl mx-auto px-4 sm:px-6 pb-14">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white rounded-3xl border border-sand-200 p-6 sm:p-8 shadow-sm">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl sm:text-4xl font-serif font-bold text-forest-500">
                  {s.value > 0 ? (
                    <CountUp
                      value={s.value}
                      decimals={s.decimals ?? 0}
                      suffix={s.suffix ?? ""}
                    />
                  ) : (
                    "—"
                  )}
                </div>
                <div className="text-xs sm:text-sm text-sand-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ───────────────── Fitur ───────────────── */}
      {/* band sand hangat (sebelumnya: tanpa bg / sand-50 dari page) */}
      <section id="fitur" className="scroll-mt-20 py-16 lg:py-20 bg-sand-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-teal-dark text-sm font-semibold mb-3">
              <Sparkles className="w-4 h-4" /> {content.features.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">{content.features.title}</h2>
            <p className="text-sand-600 mt-3 text-lg">{content.features.subtitle}</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {content.features.items.map((f, i) => {
              const meta = FEATURE_META[i] ?? FEATURE_META[FEATURE_META.length - 1];
              const Icon = meta.icon;
              return (
                <Reveal key={i} delay={i * 0.07} className="h-full">
                  <div className="group h-full bg-white rounded-2xl border border-sand-200 p-6 transition-all hover:border-forest-300 hover:shadow-md hover:-translate-y-1">
                    <div
                      className={`w-12 h-12 rounded-xl ${meta.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                    >
                      <Icon className={`w-6 h-6 ${meta.color}`} />
                    </div>
                    <h3 className="font-serif font-semibold text-lg text-forest-500 mb-1.5">
                      {f.title}
                    </h3>
                    <p className="text-sm text-sand-600 leading-relaxed">{f.desc}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ───────────────── Cara Kerja ───────────────── */}
      {/* hijau muda (sebelumnya: bg-white border-sand-200) */}
      <section id="cara-kerja" className="scroll-mt-20 py-16 lg:py-20 bg-forest-50 border-y border-forest-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-olive-500 text-sm font-semibold mb-3">
              <HeartHandshake className="w-4 h-4" /> {content.steps.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">{content.steps.title}</h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {content.steps.items.map((s, i) => (
              <Reveal key={i} delay={i * 0.1} className="relative">
                {/* kartu putih agar menonjol di atas band hijau (sebelumnya: bg-sand-50) */}
                <div className="group bg-white rounded-2xl border border-sand-200 p-6 h-full transition-all hover:shadow-md hover:-translate-y-1">
                  <div className="text-5xl font-serif font-bold text-forest-100 mb-3 transition-colors group-hover:text-olive-200">
                    {s.no}
                  </div>
                  <h3 className="font-serif font-semibold text-lg text-forest-500 mb-1.5">
                    {s.title}
                  </h3>
                  <p className="text-sm text-sand-600 leading-relaxed">{s.desc}</p>
                </div>
                {i < content.steps.items.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-1/2 -right-3 -translate-y-1/2 w-6 h-6 text-sand-300" />
                )}
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Video ───────────────── */}
      {/* section gelap bertema untuk kontras (sebelumnya: tanpa bg, teks gelap) */}
      <section id="video" className="scroll-mt-20 py-16 lg:py-20 bg-forest-gradient">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-10">
            <div className="inline-flex items-center gap-2 text-teal-light text-sm font-semibold mb-3">
              <Play className="w-4 h-4" /> {content.video.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              {content.video.title}
            </h2>
            <p className="text-white/70 mt-3 text-lg">{content.video.subtitle}</p>
          </Reveal>

          {/* Poster interaktif: klik → modal (memutar video jika ada) */}
          <Reveal delay={0.1}>
            <VideoPlayer poster={content.video.poster} src={content.video.url} />
          </Reveal>
        </div>
      </section>

      {/* ───────────────── Untuk Siapa ───────────────── */}
      {/* olive muda (sebelumnya: bg-white border-sand-200) */}
      <section id="untuk-siapa" className="scroll-mt-20 py-16 lg:py-20 bg-olive-50 border-t border-olive-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-forest-500 text-sm font-semibold mb-3">
              <Users className="w-4 h-4" /> {content.audience.eyebrow}
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">{content.audience.title}</h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Orang Tua / Guru */}
            <Reveal delay={0.05}>
              <div className="h-full rounded-3xl border border-sand-200 p-8 bg-white transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-forest-500" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
                  {content.audience.parent.title}
                </h3>
                <p className="text-sm text-sand-600 leading-relaxed mb-4">
                  {content.audience.parent.desc}
                </p>
                <ul className="space-y-2 text-sm text-sand-700">
                  {content.audience.parent.bullets.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-olive-500 mt-0.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                {content.audience.parent.ctaHref && (
                  <Button asChild className="mt-6 bg-forest-500 hover:bg-forest-600 text-white">
                    <a href={content.audience.parent.ctaHref} {...extProps(content.audience.parent.ctaHref)}>
                      {content.audience.parent.ctaLabel} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </a>
                  </Button>
                )}
              </div>
            </Reveal>

            {/* Pakar */}
            <Reveal delay={0.12}>
              <div className="h-full rounded-3xl border border-sand-200 p-8 bg-white transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-teal-dark/10 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-teal-dark" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
                  {content.audience.expert.title}
                </h3>
                <p className="text-sm text-sand-600 leading-relaxed mb-4">
                  {content.audience.expert.desc}
                </p>
                <ul className="space-y-2 text-sm text-sand-700">
                  {content.audience.expert.bullets.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-dark mt-0.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                {content.audience.expert.ctaHref && (
                  <Button
                    asChild
                    variant="outline"
                    // kunci teks tetap teal saat hover (outline defaultnya jadi putih → nyaru)
                    className="mt-6 border-teal-dark/30 text-teal-dark hover:bg-teal-dark/5 hover:text-teal-dark hover:border-teal-dark/50"
                  >
                    <a href={content.audience.expert.ctaHref} {...extProps(content.audience.expert.ctaHref)}>
                      {content.audience.expert.ctaLabel} <ArrowRight className="w-4 h-4 ml-1.5" />
                    </a>
                  </Button>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ───────────────── CTA ───────────────── */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="relative overflow-hidden rounded-[2.5rem] bg-forest-gradient px-6 py-14 sm:px-14 sm:py-16 text-center">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-10 w-64 h-64 rounded-full bg-teal-light blur-3xl" />
              <div className="absolute bottom-0 right-10 w-72 h-72 rounded-full bg-olive-400 blur-3xl" />
            </div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
                {content.cta.title}
              </h2>
              <p className="text-white/70 text-lg">{content.cta.subtitle}</p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                {loggedIn ? (
                  <Button
                    asChild
                    size="lg"
                    className="bg-white text-forest-500 hover:bg-sand-100 h-12 px-6 text-base transition-transform hover:-translate-y-0.5"
                  >
                    <Link href="/beranda">
                      Buka Beranda <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </Button>
                ) : (
                  <>
                    <Button
                      asChild
                      size="lg"
                      className="bg-white text-forest-500 hover:bg-sand-100 h-12 px-6 text-base transition-transform hover:-translate-y-0.5"
                    >
                      <Link href="/register">
                        {content.cta.primary} <ArrowRight className="w-4 h-4 ml-1.5" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="lg"
                      variant="outline"
                      // outline membawa `bg-background` (terang) + `hover:text-accent-foreground`,
                      // jadi kita override eksplisit agar teks selalu kontras:
                      // normal = transparan + teks putih, hover = latar putih + teks forest.
                      className="h-12 px-6 text-base bg-transparent border-2 border-white/60 text-white hover:bg-white hover:text-forest-500"
                    >
                      <Link href="/login">{content.cta.secondary}</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ───────────────── Footer ───────────────── */}
      <footer className="border-t border-sand-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center sm:items-start gap-2">
            <Image
              src="/logo.png"
              alt="IncluSearch"
              width={140}
              height={48}
              className="h-9 w-auto object-contain"
            />
            <p className="text-sm text-sand-500 max-w-xs text-center sm:text-left">
              {content.footer.tagline}
            </p>
          </div>
          <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-sand-600">
            <a href="#fitur" className="hover:text-forest-500 transition-colors">Fitur</a>
            <a href="#cara-kerja" className="hover:text-forest-500 transition-colors">Cara Kerja</a>
            <Link href="/login" className="hover:text-forest-500 transition-colors">Masuk</Link>
            <Link href="/register" className="hover:text-forest-500 transition-colors">Daftar</Link>
          </nav>
        </div>
        <div className="border-t border-sand-100 py-4">
          <p className="text-center text-xs text-sand-400">
            © 2026 IncluSearch. Hak cipta dilindungi.
          </p>
        </div>
      </footer>

      {/* Tombol kembali ke atas (muncul setelah scroll) */}
      <BackToTop />
    </div>
  );
}
