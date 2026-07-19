import type {
  Assessment,
  ExpertProfile,
  SpecializationType,
  ChallengeType,
  LocationType,
} from "@prisma/client";

// ─────────────────────────────────────────────────────────────────────────────
// Type Definitions
// ─────────────────────────────────────────────────────────────────────────────

export interface ExpertWithProfile extends ExpertProfile {
  availabilitySlots: { dayOfWeek: number; isActive: boolean }[];
}

export interface MatchResult {
  expertId: string;
  score: number; // 0-100
  percentage: string; // "85%"
  reasons: string[];
  breakdown: MatchBreakdown;
  expert: ExpertWithProfile;
}

interface MatchBreakdown {
  specialization: number; // max 40 — how well specializations fit the need
  experience: number;     // max 30 — expert seniority (independent signal)
  availability: number;   // max 15
  rating: number;         // max 10
  location: number;       // max 5
}

// ─────────────────────────────────────────────────────────────────────────────
// Mapping: ChallengeType → SpecializationType (closest match)
// ─────────────────────────────────────────────────────────────────────────────

const CHALLENGE_TO_SPEC_MAP: Record<ChallengeType, SpecializationType[]> = {
  LEARNING_DIFFICULTIES: ["LEARNING_DIFFICULTIES", "ADHD"],
  BEHAVIORAL_CHALLENGES: ["BEHAVIORAL_SUPPORT", "ADHD", "EMOTIONAL_REGULATION"],
  COMMUNICATION_ISSUES:  ["COMMUNICATION_DISORDERS", "AUTISM_SPECTRUM"],
  SENSORY_PROCESSING:    ["SENSORY_PROCESSING", "AUTISM_SPECTRUM"],
  SOCIAL_EMOTIONAL:      ["SOCIAL_SKILLS", "EMOTIONAL_REGULATION", "BEHAVIORAL_SUPPORT"],
  MULTIPLE_CHALLENGES:   [
    "LEARNING_DIFFICULTIES",
    "BEHAVIORAL_SUPPORT",
    "AUTISM_SPECTRUM",
    "ADHD",
  ],
};

const SPEC_LABELS: Record<SpecializationType, string> = {
  LEARNING_DIFFICULTIES: "Kesulitan Belajar",
  BEHAVIORAL_SUPPORT:    "Dukungan Perilaku",
  COMMUNICATION_DISORDERS: "Gangguan Komunikasi",
  SENSORY_PROCESSING:    "Pemrosesan Sensorik",
  AUTISM_SPECTRUM:       "Spektrum Autisme",
  ADHD:                  "ADHD",
  DOWN_SYNDROME:         "Down Syndrome",
  EMOTIONAL_REGULATION:  "Regulasi Emosi",
  SOCIAL_SKILLS:         "Keterampilan Sosial",
  MOTOR_DEVELOPMENT:     "Perkembangan Motorik",
};

// ─────────────────────────────────────────────────────────────────────────────
// Scoring Functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score 0-40: how well expert specializations match assessment needs
 * Primary match = full weight; secondary match = partial
 */
function scoreSpecialization(
  expertSpecs: SpecializationType[],
  challengeType: ChallengeType
): { score: number; reasons: string[] } {
  const targetSpecs = CHALLENGE_TO_SPEC_MAP[challengeType];
  const reasons: string[] = [];

  if (expertSpecs.length === 0) return { score: 0, reasons: [] };

  const primarySpec = targetSpecs[0];
  const secondarySpecs = targetSpecs.slice(1);

  let score = 0;

  if (expertSpecs.includes(primarySpec)) {
    score += 40;
    reasons.push(`Spesialis ${SPEC_LABELS[primarySpec]}`);
  } else {
    const secondaryMatches = expertSpecs.filter((s) =>
      secondarySpecs.includes(s)
    );
    if (secondaryMatches.length > 0) {
      score += 20 + Math.min(secondaryMatches.length - 1, 2) * 5;
      reasons.push(
        `Pengalaman ${secondaryMatches.map((s) => SPEC_LABELS[s]).join(", ")}`
      );
    }
    // (Removed a broken "broad match" bonus that awarded +5 to experts with NO
    //  overlap — inverted from its own comment. Non-matching experts get 0 here.)
  }

  return { score: Math.min(score, 40), reasons };
}

/**
 * Score 0-30: expert seniority.
 *
 * This is deliberately an INDEPENDENT signal from scoreSpecialization (which
 * already measures how well the expert's specializations fit the child's
 * needs). It scores on `yearsExperience` — a field that was previously not
 * used in matching at all — so the two dimensions no longer double-count the
 * same specialization overlap.
 */
function scoreExperience(
  yearsExperience: number
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let score: number;

  if (yearsExperience >= 10) {
    score = 30;
    reasons.push(`${yearsExperience} tahun pengalaman`);
  } else if (yearsExperience >= 7) {
    score = 25;
    reasons.push(`${yearsExperience} tahun pengalaman`);
  } else if (yearsExperience >= 5) {
    score = 20;
    reasons.push(`${yearsExperience} tahun pengalaman`);
  } else if (yearsExperience >= 3) {
    score = 14;
  } else if (yearsExperience >= 1) {
    score = 8;
  } else {
    score = 3; // new expert — small baseline
  }

  return { score, reasons };
}

/**
 * Score 0-15: availability (at least 3 active slots = full score).
 * Callers only pass experts that are already `isAvailable`, so that check is
 * handled upstream (see matchExperts).
 */
function scoreAvailability(
  slots: { dayOfWeek: number; isActive: boolean }[]
): { score: number; reasons: string[] } {
  const activeSlots = slots.filter((s) => s.isActive).length;
  const reasons: string[] = [];

  let score = 0;
  if (activeSlots >= 5) {
    score = 15;
    reasons.push("Jadwal sangat fleksibel");
  } else if (activeSlots >= 3) {
    score = 10;
    reasons.push("Jadwal cukup tersedia");
  } else if (activeSlots >= 1) {
    score = 6;
  }

  return { score, reasons };
}

/**
 * Score 0-10: normalized expert rating
 */
function scoreRating(
  rating: number,
  totalReviews: number
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  if (totalReviews === 0) return { score: 5, reasons: [] }; // neutral for new experts

  // Bayesian-like adjustment: penalize low review count
  const confidence = Math.min(totalReviews / 10, 1);
  const normalizedRating = ((rating / 5) * 10) * confidence + 5 * (1 - confidence);
  const score = Math.round(Math.min(normalizedRating, 10));

  if (rating >= 4.5 && totalReviews >= 10) {
    reasons.push(`Rating ${rating.toFixed(1)} dari ${totalReviews} ulasan`);
  }

  return { score, reasons };
}

/**
 * Score 0-5: location preference alignment
 */
function scoreLocation(
  expertLocation: LocationType,
  preferredLocation: LocationType
): { score: number; reasons: string[] } {
  if (expertLocation === "BOTH") return { score: 5, reasons: ["Tersedia online & offline"] };
  if (expertLocation === preferredLocation) return { score: 5, reasons: [] };
  return { score: 2, reasons: [] }; // partial — can negotiate
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Matching Function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Score all experts against a given assessment and return the top N matches.
 */
export function matchExperts(
  assessment: Assessment,
  experts: ExpertWithProfile[],
  topN: number = 5
): MatchResult[] {
  const results: MatchResult[] = experts
    .filter((e) => e.isAvailable)
    .map((expert) => {
      const spec = scoreSpecialization(expert.specializations, assessment.challengeType);
      const experience = scoreExperience(expert.yearsExperience);
      const avail = scoreAvailability(expert.availabilitySlots);
      const rating = scoreRating(expert.rating, expert.totalReviews);
      const location = scoreLocation(
        expert.locationType,
        assessment.locationPref as LocationType
      );

      const breakdown: MatchBreakdown = {
        specialization: spec.score,
        experience: experience.score,
        availability: avail.score,
        rating: rating.score,
        location: location.score,
      };

      const totalScore =
        spec.score + experience.score + avail.score + rating.score + location.score;

      const allReasons = [
        ...spec.reasons,
        ...experience.reasons,
        ...avail.reasons,
        ...rating.reasons,
        ...location.reasons,
      ].filter(Boolean);

      return {
        expertId: expert.id,
        score: totalScore,
        percentage: `${totalScore}%`,
        reasons: allReasons,
        breakdown,
        expert,
      };
    });

  return results
    .sort((a, b) => b.score - a.score)
    .slice(0, topN);
}
