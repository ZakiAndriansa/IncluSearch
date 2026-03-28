import Link from "next/link";
import { ClipboardList, ArrowRight, CheckCircle2 } from "lucide-react";

interface AssessmentCTAProps {
  hasAssessment: boolean;
  assessmentId?: string;
  childName?: string | null;
}

export function AssessmentCTA({ hasAssessment, assessmentId, childName }: AssessmentCTAProps) {
  if (hasAssessment) {
    return (
      <div className="rounded-xl border border-forest-100 bg-forest-50 p-4">
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle2 className="w-4 h-4 text-forest-500" />
          <span className="text-sm font-semibold text-forest-500">
            Asesmen Aktif
          </span>
        </div>
        <p className="text-xs text-forest-400">
          Asesmen untuk <strong>{childName ?? "anak Anda"}</strong> sudah tersimpan dan digunakan untuk rekomendasi pakar.
        </p>
        <Link
          href="/profil?tab=asesmen"
          className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-forest-500 hover:text-forest-600 underline underline-offset-2"
        >
          Kelola asesmen
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-teal-dark/30 bg-teal-dark/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <ClipboardList className="w-4 h-4 text-teal-dark" />
        <span className="text-sm font-semibold text-teal-dark">
          Buat Asesmen Kebutuhan
        </span>
      </div>
      <p className="text-xs text-sand-600 leading-relaxed">
        Isi asesmen singkat untuk mendapatkan rekomendasi pakar yang paling tepat untuk anak Anda.
      </p>
      <Link
        href="/profil?tab=asesmen"
        className="inline-flex items-center gap-1 mt-3 text-xs font-semibold text-teal-dark hover:text-teal-dark/80 underline underline-offset-2"
      >
        Buat asesmen sekarang
        <ArrowRight className="w-3 h-3" />
      </Link>
    </div>
  );
}
