import { Clock, Crown, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { checkConsultationQuota, formatQuotaCountdown } from "@/lib/quota-checker";

interface QuotaStatusCardProps {
  userId: string;
  isPremium: boolean;
}

export async function QuotaStatusCard({ userId, isPremium }: QuotaStatusCardProps) {
  const quota = await checkConsultationQuota(userId);

  if (isPremium) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Crown className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-amber-700">
            Konsultasi Premium
          </span>
        </div>
        <p className="text-xs text-amber-600">
          Anda dapat melakukan konsultasi tanpa batas sebagai anggota Premium.
        </p>
        <Link
          href="/cari-pakar"
          className="inline-block mt-3 text-xs font-semibold text-amber-700 hover:text-amber-800 underline underline-offset-2"
        >
          Cari pakar sekarang →
        </Link>
      </div>
    );
  }

  if (quota.allowed) {
    return (
      <div className="rounded-xl border border-forest-100 bg-forest-50 p-4">
        <div className="flex items-center gap-2 mb-1">
          <CheckCircle className="w-4 h-4 text-forest-500" />
          <span className="text-sm font-semibold text-forest-500">
            Kuota Konsultasi Tersedia
          </span>
        </div>
        <p className="text-xs text-forest-400">
          Anda dapat melakukan 1 konsultasi gratis sekarang.
        </p>
        <Link
          href="/cari-pakar"
          className="inline-block mt-3 text-xs font-semibold text-forest-500 hover:text-forest-600 underline underline-offset-2"
        >
          Mulai konsultasi →
        </Link>
      </div>
    );
  }

  const countdown = formatQuotaCountdown(quota);

  return (
    <div className="rounded-xl border border-sand-300 bg-white p-4">
      <div className="flex items-center gap-2 mb-1">
        <AlertCircle className="w-4 h-4 text-sand-500" />
        <span className="text-sm font-semibold text-sand-700">
          Kuota Habis
        </span>
      </div>
      <p className="text-xs text-sand-500 mb-2">
        Konsultasi gratis berikutnya tersedia dalam:
      </p>
      <div className="flex items-center gap-2 bg-sand-100 rounded-lg px-3 py-2">
        <Clock className="w-4 h-4 text-teal-dark" />
        <span className="text-sm font-bold text-forest-500">{countdown}</span>
      </div>
      <Link
        href="/profil?tab=premium"
        className="inline-block mt-3 text-xs font-semibold text-amber-600 hover:text-amber-700 underline underline-offset-2"
      >
        Upgrade Premium untuk konsultasi tak terbatas →
      </Link>
    </div>
  );
}
