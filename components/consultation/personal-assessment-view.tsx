import { PA_SECTIONS, PA_QUESTIONS, paFieldName } from "@/lib/personal-assessment";

interface PersonalAssessmentViewProps {
  data: Record<string, string | null>;
  childName?: string | null;
}

export function PersonalAssessmentView({ data, childName }: PersonalAssessmentViewProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif font-bold text-lg text-forest-500">
          Asesmen Pribadi{childName ? ` — ${childName}` : ""}
        </h2>
        <p className="text-sand-500 text-sm">Hasil penilaian dari pakar.</p>
      </div>

      {PA_SECTIONS.map((section) => (
        <section key={section.key} className="bg-white rounded-2xl border border-sand-200 p-5 space-y-3">
          <h3 className="font-semibold text-forest-500">{section.label}</h3>
          {PA_QUESTIONS.map((q) => {
            const value = data[paFieldName(section.key, q.key)];
            return (
              <div key={q.key} className="space-y-0.5">
                <div className="text-xs font-medium text-sand-500">{q.label}</div>
                <p className="text-sm text-forest-600 whitespace-pre-wrap">
                  {value?.trim() ? value : <span className="text-sand-400">—</span>}
                </p>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
