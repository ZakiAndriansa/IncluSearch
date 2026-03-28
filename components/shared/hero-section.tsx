import Link from "next/link";
import { Crown, Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  userName: string;
  isPremium: boolean;
  hasAssessment: boolean;
}

const GREETING_BY_HOUR = () => {
  const h = new Date().getHours();
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
};

export function HeroSection({ userName, isPremium, hasAssessment }: HeroSectionProps) {
  const firstName = userName.split(" ")[0] || "Bapak/Ibu";

  return (
    <div className="relative rounded-2xl overflow-hidden bg-forest-gradient p-6 lg:p-8">
      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-teal-light/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
      <div className="absolute bottom-0 left-20 w-48 h-48 bg-olive-300/10 rounded-full translate-y-1/2 blur-2xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between">
          <div>
            {isPremium && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-400/30 text-amber-300 text-xs font-semibold mb-3">
                <Crown className="w-3 h-3" />
                Anggota Premium
              </div>
            )}
            <h1 className="text-2xl lg:text-3xl font-serif font-bold text-white">
              {GREETING_BY_HOUR()},{" "}
              <span className="text-teal-light">{firstName}</span>!
            </h1>
            <p className="text-white/70 mt-2 text-sm lg:text-base max-w-lg">
              {hasAssessment
                ? "Asesmen anak Anda sudah tersimpan. Temukan pakar yang tepat hari ini."
                : "Mulai dengan membuat asesmen kebutuhan anak untuk rekomendasi pakar yang akurat."}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-6">
          <Button
            asChild
            className="bg-white text-forest-500 hover:bg-sand-100 font-semibold shadow-md tap-target"
          >
            <Link href="/cari-pakar">
              <Search className="w-4 h-4 mr-2" />
              Cari Pakar
            </Link>
          </Button>

          {!hasAssessment && (
            <Button
              asChild
              className="bg-teal-light text-forest-500 hover:bg-teal-light/90 font-semibold tap-target"
            >
              <Link href="/profil?tab=asesmen">
                <Plus className="w-4 h-4 mr-2" />
                Buat Asesmen
              </Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
