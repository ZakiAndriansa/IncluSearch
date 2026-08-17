import {
  Search,
  MessageCircle,
  ClipboardList,
  BookOpen,
  Users2,
  CalendarDays,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export interface LandingFeature {
  title: string;
  desc: string;
}

export interface LandingStep {
  no: string;
  title: string;
  desc: string;
}

export interface LandingAudienceCard {
  title: string;
  desc: string;
  bullets: string[];
  ctaLabel: string;
  /** Tombol tujuan bebas (path/URL/mailto/tel). Kosong → tombol disembunyikan. */
  ctaHref: string;
}

export interface LandingData {
  hero: {
    badge: string;
    titleBefore: string;
    titleHighlight: string;
    titleAfter: string;
    subtitle: string;
    primaryCta: string;
    secondaryCta: string;
    trust1: string;
    trust2: string;
    image: string;
  };
  statsLabels: [string, string, string, string];
  features: {
    eyebrow: string;
    title: string;
    subtitle: string;
    items: LandingFeature[];
  };
  steps: {
    eyebrow: string;
    title: string;
    items: LandingStep[];
  };
  video: {
    eyebrow: string;
    title: string;
    subtitle: string;
    poster: string;
    url: string; // "" → shows "segera hadir" placeholder
  };
  audience: {
    eyebrow: string;
    title: string;
    parent: LandingAudienceCard;
    expert: LandingAudienceCard;
  };
  cta: {
    title: string;
    subtitle: string;
    primary: string;
    secondary: string;
  };
  footer: {
    tagline: string;
  };
}

// ── Presentation-only metadata for the feature cards. Icons/colours live in
//    code (not editable); only the text of each item is editable via the CMS.
//    Extra items beyond this list fall back to the last entry's styling. ──
export const FEATURE_META = [
  { icon: Search, bg: "bg-forest-50", color: "text-forest-500" },
  { icon: MessageCircle, bg: "bg-teal-dark/5", color: "text-teal-dark" },
  { icon: ClipboardList, bg: "bg-olive-50", color: "text-olive-500" },
  { icon: BookOpen, bg: "bg-teal-dark/5", color: "text-teal-dark" },
  { icon: Users2, bg: "bg-forest-50", color: "text-forest-500" },
  { icon: CalendarDays, bg: "bg-olive-50", color: "text-olive-500" },
] as const;

// ── Defaults = the exact content shipped in code. An absent DB row renders
//    these, so behaviour is unchanged until an admin edits the content. ──
export const DEFAULT_LANDING: LandingData = {
  hero: {
    badge: "Platform Terpercaya untuk ABK",
    titleBefore: "Bersama kita dukung ",
    titleHighlight: "tumbuh kembang",
    titleAfter: " anak yang luar biasa",
    subtitle:
      "Temukan pakar ortopedagogik terbaik, akses pengetahuan berkualitas, dan bergabung dengan komunitas yang peduli terhadap Anak Berkebutuhan Khusus — semua dalam satu tempat.",
    primaryCta: "Mulai Sekarang",
    secondaryCta: "Pelajari Cara Kerja",
    trust1: "Gratis untuk mendaftar",
    trust2: "Pakar terverifikasi",
    image: "/landing/hero.jpg",
  },
  statsLabels: [
    "Pakar Terverifikasi",
    "Keluarga Bergabung",
    "Konten Edukasi",
    "Rating Kepuasan",
  ],
  features: {
    eyebrow: "Fitur Utama",
    title: "Semua yang Anda butuhkan untuk mendampingi",
    subtitle:
      "Dari menemukan pakar yang tepat hingga belajar mandiri — IncluSearch menyatukannya dalam satu alur yang sederhana.",
    items: [
      {
        title: "Cari Pakar yang Cocok",
        desc: "Algoritma kecocokan mencocokkan kebutuhan anak dengan spesialisasi & pengalaman pakar — bukan sekadar daftar acak.",
      },
      {
        title: "Konsultasi Terjadwal",
        desc: "Ruang chat terbuka tepat pada tanggal & jam yang dijadwalkan, sehingga sesi selalu fokus dan tepat waktu.",
      },
      {
        title: "Asesmen Awal",
        desc: "Isi asesmen ringkas tentang kondisi anak untuk mendapatkan rekomendasi pakar yang paling relevan.",
      },
      {
        title: "Knowledge Hub",
        desc: "Kumpulan artikel, video, modul, dan tautan tepercaya seputar pendampingan ABK dari para pakar.",
      },
      {
        title: "Forum Komunitas",
        desc: "Terhubung dengan yayasan, sekolah, pusat terapi, dan kelompok dukungan di seluruh Indonesia.",
      },
      {
        title: "Kalender & Jadwal",
        desc: "Pantau semua sesi konsultasi dalam satu kalender rapi, lengkap dengan pengingat waktu sesi.",
      },
    ],
  },
  steps: {
    eyebrow: "Cara Kerja",
    title: "Tiga langkah menuju pendampingan yang tepat",
    items: [
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
    ],
  },
  video: {
    eyebrow: "Video Profil",
    title: "Kenali IncluSearch lebih dekat",
    subtitle: "Tonton bagaimana kami menghubungkan keluarga dengan pakar yang tepat.",
    poster: "/landing/video-poster.jpg",
    url: "",
  },
  audience: {
    eyebrow: "Untuk Siapa",
    title: "Dibuat untuk mereka yang peduli",
    parent: {
      title: "Orang Tua & Guru",
      desc: "Dapatkan rekomendasi pakar yang sesuai, konsultasi terjadwal, dan akses konten edukasi untuk mendampingi anak setiap hari.",
      bullets: [
        "Rekomendasi pakar berbasis asesmen",
        "Konsultasi lewat ruang chat terjadwal",
        "Knowledge Hub & forum komunitas",
      ],
      ctaLabel: "Daftar sebagai Orang Tua",
      ctaHref: "/register",
    },
    expert: {
      title: "Pakar Ortopedagogik",
      desc: "Jangkau keluarga yang membutuhkan keahlian Anda, atur jadwal dan tarif, serta kelola konsultasi dengan mudah.",
      bullets: [
        "Profil & jadwal yang dapat diatur sendiri",
        "Kalender konsultasi & rekap penghasilan",
        "Bagikan keahlian lewat Knowledge Hub",
      ],
      ctaLabel: "Bergabung sebagai Pakar",
      // Kosong secara default: tidak ada ajakan daftar pakar di landing sampai
      // admin mengisi tujuannya via CMS.
      ctaHref: "",
    },
  },
  cta: {
    title: "Siap memulai perjalanan bersama kami?",
    subtitle:
      "Bergabunglah dengan keluarga dan pakar lain yang telah mempercayai IncluSearch untuk mendampingi Anak Berkebutuhan Khusus.",
    primary: "Daftar Gratis",
    secondary: "Sudah punya akun? Masuk",
  },
  footer: {
    tagline: "Pendamping tumbuh kembang Anak Berkebutuhan Khusus.",
  },
};

// Deep-merge stored (possibly partial/legacy) content over the defaults so new
// fields always resolve. Arrays are replaced wholesale when present.
export function mergeLanding(
  base: LandingData,
  over?: Partial<LandingData> | null
): LandingData {
  if (!over) return base;
  return {
    hero: { ...base.hero, ...over.hero },
    statsLabels: over.statsLabels ?? base.statsLabels,
    features: {
      ...base.features,
      ...over.features,
      items: over.features?.items ?? base.features.items,
    },
    steps: {
      ...base.steps,
      ...over.steps,
      items: over.steps?.items ?? base.steps.items,
    },
    video: { ...base.video, ...over.video },
    audience: {
      ...base.audience,
      ...over.audience,
      parent: {
        ...base.audience.parent,
        ...over.audience?.parent,
        bullets: over.audience?.parent?.bullets ?? base.audience.parent.bullets,
      },
      expert: {
        ...base.audience.expert,
        ...over.audience?.expert,
        bullets: over.audience?.expert?.bullets ?? base.audience.expert.bullets,
      },
    },
    cta: { ...base.cta, ...over.cta },
    footer: { ...base.footer, ...over.footer },
  };
}
