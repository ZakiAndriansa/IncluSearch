import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Users,
  MessageCircle,
  BookOpen,
  ClipboardList,
  Users2,
  CalendarDays,
  Play,
  ArrowRight,
  CheckCircle2,
  Star,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Search,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

// ── Feature list mirrors the real product menus (kept in sync with the sidebar) ──
const FEATURES = [
  {
    icon: Search,
    title: "Cari Pakar yang Cocok",
    desc: "Algoritma kecocokan mencocokkan kebutuhan anak dengan spesialisasi & pengalaman pakar — bukan sekadar daftar acak.",
    color: "text-forest-500",
    bg: "bg-forest-50",
  },
  {
    icon: MessageCircle,
    title: "Konsultasi Terjadwal",
    desc: "Ruang chat terbuka tepat pada tanggal & jam yang dijadwalkan, sehingga sesi selalu fokus dan tepat waktu.",
    color: "text-teal-dark",
    bg: "bg-teal-dark/5",
  },
  {
    icon: ClipboardList,
    title: "Asesmen Awal",
    desc: "Isi asesmen ringkas tentang kondisi anak untuk mendapatkan rekomendasi pakar yang paling relevan.",
    color: "text-olive-500",
    bg: "bg-olive-50",
  },
  {
    icon: BookOpen,
    title: "Knowledge Hub",
    desc: "Kumpulan artikel, video, modul, dan tautan tepercaya seputar pendampingan ABK dari para pakar.",
    color: "text-teal-dark",
    bg: "bg-teal-dark/5",
  },
  {
    icon: Users2,
    title: "Forum Komunitas",
    desc: "Terhubung dengan yayasan, sekolah, pusat terapi, dan kelompok dukungan di seluruh Indonesia.",
    color: "text-forest-500",
    bg: "bg-forest-50",
  },
  {
    icon: CalendarDays,
    title: "Kalender & Jadwal",
    desc: "Pantau semua sesi konsultasi dalam satu kalender rapi, lengkap dengan pengingat waktu sesi.",
    color: "text-olive-500",
    bg: "bg-olive-50",
  },
];

const STEPS = [
  {
    no: "01",
    title: "Daftar & Buat Asesmen",
    desc: "Buat akun gratis, lalu isi asesmen singkat tentang kebutuhan dan kondisi anak Anda.",
  },
  {
    no: "02",
    title: "Temukan Pakar Terbaik",
    desc: "Kami tampilkan pakar terverifikasi dengan skor kecocokan tertinggi untuk kebutuhan tersebut.",
  },
  {
    no: "03",
    title: "Konsultasi & Dampingi",
    desc: "Jadwalkan sesi, konsultasi lewat ruang chat terjadwal, dan dampingi tumbuh kembang anak.",
  },
];

export default async function LandingPage() {
  const session = await auth();
  // Logged-in users belong in the app, not the marketing page.
  if (session) redirect("/beranda");

  // Real figures from the database — no hardcoded marketing numbers.
  const [expertCount, familyCount, contentCount, ratingAgg] = await Promise.all([
    prisma.expertProfile.count({ where: { isVerified: true } }),
    prisma.user.count({ where: { role: "PARENT" } }),
    prisma.knowledgeContent.count(),
    prisma.expertProfile.aggregate({
      _avg: { rating: true },
      where: { isVerified: true, totalReviews: { gt: 0 } },
    }),
  ]);
  const avgRating = ratingAgg._avg.rating;

  // Numeric values so the counters can animate; render "—" when there's no data.
  const stats = [
    { value: expertCount, label: "Pakar Terverifikasi" },
    { value: familyCount, label: "Keluarga Bergabung" },
    { value: contentCount, label: "Konten Edukasi" },
    { value: avgRating ?? 0, decimals: 1, suffix: "/5", label: "Rating Kepuasan" },
  ];

  return (
    <div className="min-h-screen bg-sand-50 text-forest-500">
      <LandingNav />

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
              Platform Terpercaya untuk ABK
            </div>

            <h1 className="text-4xl sm:text-5xl xl:text-6xl font-serif font-bold leading-[1.1]">
              Bersama kita dukung{" "}
              <span className="text-olive-500">tumbuh kembang</span> anak yang
              luar biasa
            </h1>

            <p className="text-sand-700 text-lg leading-relaxed max-w-xl">
              Temukan pakar ortopedagogik terbaik, akses pengetahuan berkualitas,
              dan bergabung dengan komunitas yang peduli terhadap Anak
              Berkebutuhan Khusus — semua dalam satu tempat.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Button
                asChild
                size="lg"
                className="bg-forest-500 hover:bg-forest-600 text-white h-12 px-6 text-base transition-transform hover:-translate-y-0.5"
              >
                <Link href="/register">
                  Mulai Sekarang <ArrowRight className="w-4 h-4 ml-1.5" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                // outline memaksa teks putih saat hover (hover:text-accent-foreground);
                // kunci agar teks tetap forest di atas latar putih.
                className="h-12 px-6 text-base border-sand-300 text-forest-500 hover:bg-white hover:text-forest-600 hover:border-forest-300"
              >
                <a href="#cara-kerja">Pelajari Cara Kerja</a>
              </Button>
            </div>

            {/* Trust bullets */}
            <div className="flex flex-wrap gap-x-5 gap-y-2 pt-2 text-sm text-sand-600">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-olive-500" /> Gratis untuk mendaftar
              </span>
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-teal-dark" /> Pakar terverifikasi
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="relative animate-fade-in">
            <div className="relative aspect-[4/5] sm:aspect-[5/5] max-w-md mx-auto rounded-[2rem] overflow-hidden border border-sand-200 shadow-xl">
              <Image
                src="/landing/hero.jpg"
                alt="Pendampingan anak berkebutuhan khusus bersama pakar"
                fill
                sizes="(max-width: 1024px) 100vw, 480px"
                className="object-cover"
                priority
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
              <Sparkles className="w-4 h-4" /> Fitur Utama
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Semua yang Anda butuhkan untuk mendampingi
            </h2>
            <p className="text-sand-600 mt-3 text-lg">
              Dari menemukan pakar yang tepat hingga belajar mandiri — IncluSearch
              menyatukannya dalam satu alur yang sederhana.
            </p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.07} className="h-full">
                <div className="group h-full bg-white rounded-2xl border border-sand-200 p-6 transition-all hover:border-forest-300 hover:shadow-md hover:-translate-y-1">
                  <div
                    className={`w-12 h-12 rounded-xl ${f.bg} flex items-center justify-center mb-4 transition-transform group-hover:scale-110`}
                  >
                    <f.icon className={`w-6 h-6 ${f.color}`} />
                  </div>
                  <h3 className="font-serif font-semibold text-lg text-forest-500 mb-1.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-sand-600 leading-relaxed">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ───────────────── Cara Kerja ───────────────── */}
      {/* hijau muda (sebelumnya: bg-white border-sand-200) */}
      <section id="cara-kerja" className="scroll-mt-20 py-16 lg:py-20 bg-forest-50 border-y border-forest-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-olive-500 text-sm font-semibold mb-3">
              <HeartHandshake className="w-4 h-4" /> Cara Kerja
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Tiga langkah menuju pendampingan yang tepat
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {STEPS.map((s, i) => (
              <Reveal key={s.no} delay={i * 0.1} className="relative">
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
                {i < STEPS.length - 1 && (
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
              <Play className="w-4 h-4" /> Video Profil
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white">
              Kenali IncluSearch lebih dekat
            </h2>
            <p className="text-white/70 mt-3 text-lg">
              Tonton bagaimana kami menghubungkan keluarga dengan pakar yang tepat.
            </p>
          </Reveal>

          {/* Poster interaktif: klik → modal (Esc / klik luar untuk menutup) */}
          <Reveal delay={0.1}>
            <VideoPlayer />
          </Reveal>
        </div>
      </section>

      {/* ───────────────── Untuk Siapa ───────────────── */}
      {/* olive muda (sebelumnya: bg-white border-sand-200) */}
      <section id="untuk-siapa" className="scroll-mt-20 py-16 lg:py-20 bg-olive-50 border-t border-olive-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <Reveal className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 text-forest-500 text-sm font-semibold mb-3">
              <Users className="w-4 h-4" /> Untuk Siapa
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold">
              Dibuat untuk mereka yang peduli
            </h2>
          </Reveal>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Orang Tua / Guru */}
            <Reveal delay={0.05}>
              <div className="h-full rounded-3xl border border-sand-200 p-8 bg-white transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-forest-50 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-forest-500" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
                  Orang Tua &amp; Guru
                </h3>
                <p className="text-sm text-sand-600 leading-relaxed mb-4">
                  Dapatkan rekomendasi pakar yang sesuai, konsultasi terjadwal, dan
                  akses konten edukasi untuk mendampingi anak setiap hari.
                </p>
                <ul className="space-y-2 text-sm text-sand-700">
                  {[
                    "Rekomendasi pakar berbasis asesmen",
                    "Konsultasi lewat ruang chat terjadwal",
                    "Knowledge Hub & forum komunitas",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-olive-500 mt-0.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Button asChild className="mt-6 bg-forest-500 hover:bg-forest-600 text-white">
                  <Link href="/register">
                    Daftar sebagai Orang Tua <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
              </div>
            </Reveal>

            {/* Pakar */}
            <Reveal delay={0.12}>
              <div className="h-full rounded-3xl border border-sand-200 p-8 bg-white transition-all hover:shadow-md hover:-translate-y-1">
                <div className="w-12 h-12 rounded-xl bg-teal-dark/10 flex items-center justify-center mb-4">
                  <Star className="w-6 h-6 text-teal-dark" />
                </div>
                <h3 className="font-serif font-semibold text-xl text-forest-500 mb-2">
                  Pakar Ortopedagogik
                </h3>
                <p className="text-sm text-sand-600 leading-relaxed mb-4">
                  Jangkau keluarga yang membutuhkan keahlian Anda, atur jadwal dan
                  tarif, serta kelola konsultasi dengan mudah.
                </p>
                <ul className="space-y-2 text-sm text-sand-700">
                  {[
                    "Profil & jadwal yang dapat diatur sendiri",
                    "Kalender konsultasi & rekap penghasilan",
                    "Bagikan keahlian lewat Knowledge Hub",
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-dark mt-0.5 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
                <Button
                  asChild
                  variant="outline"
                  // kunci teks tetap teal saat hover (outline defaultnya jadi putih → nyaru)
                  className="mt-6 border-teal-dark/30 text-teal-dark hover:bg-teal-dark/5 hover:text-teal-dark hover:border-teal-dark/50"
                >
                  <Link href="/register">
                    Bergabung sebagai Pakar <ArrowRight className="w-4 h-4 ml-1.5" />
                  </Link>
                </Button>
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
                Siap memulai perjalanan bersama kami?
              </h2>
              <p className="text-white/70 text-lg">
                Bergabunglah dengan keluarga dan pakar lain yang telah mempercayai
                IncluSearch untuk mendampingi Anak Berkebutuhan Khusus.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                <Button
                  asChild
                  size="lg"
                  className="bg-white text-forest-500 hover:bg-sand-100 h-12 px-6 text-base transition-transform hover:-translate-y-0.5"
                >
                  <Link href="/register">
                    Daftar Gratis <ArrowRight className="w-4 h-4 ml-1.5" />
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
                  <Link href="/login">Sudah punya akun? Masuk</Link>
                </Button>
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
              Pendamping tumbuh kembang Anak Berkebutuhan Khusus.
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
