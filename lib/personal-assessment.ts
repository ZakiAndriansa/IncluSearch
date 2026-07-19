// Shared structure for the expert's personal assessment (3 sections × 3 questions).

export const PA_SECTIONS = [
  {
    key: "cognitive",
    label: "Kognitif",
    desc: "Kemampuan berpikir, memori, bahasa, dan pemecahan masalah.",
  },
  {
    key: "social",
    label: "Sosial-Afektif",
    desc: "Emosi, interaksi sosial, empati, dan regulasi diri.",
  },
  {
    key: "psychomotor",
    label: "Psiko-Motorik",
    desc: "Koordinasi, motorik halus & kasar, dan keterampilan fisik.",
  },
] as const;

export const PA_QUESTIONS = [
  { key: "Strength", label: "Apa kelebihan anak?" },
  { key: "Weakness", label: "Apa kekurangan anak?" },
  { key: "Need", label: "Apa kebutuhan anak?" },
] as const;

// All 9 field names, e.g. "cognitiveStrength".
export type PAField = `${(typeof PA_SECTIONS)[number]["key"]}${(typeof PA_QUESTIONS)[number]["key"]}`;

export function paFieldName(sectionKey: string, questionKey: string): PAField {
  return `${sectionKey}${questionKey}` as PAField;
}

export const PA_FIELD_NAMES: PAField[] = PA_SECTIONS.flatMap((s) =>
  PA_QUESTIONS.map((q) => paFieldName(s.key, q.key))
);
