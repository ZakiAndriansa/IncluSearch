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
  specialization: number; // max 40
  challengeType: number;  // max 30
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
    // Broad match: expert has any overlap
    const anyMatch = expertSpecs.some((s) => targetSpecs.includes(s));
    if (!anyMatch && expertSpecs.length > 0) score += 5;
  }

  return { score: Math.min(score, 40), reasons };
}

/**
 * Score 0-30: direct challenge type mapping to expert profile
 * Checks expert bio keywords + specialization breadth for the challenge
 */
function scoreChallengeType(
  expertSpecs: SpecializationType[],
  challengeType: ChallengeType
): { score: number; reasons: string[] } {
  const targetSpecs = CHALLENGE_TO_SPEC_MAP[challengeType];
  const matchCount = expertSpecs.filter((s) => targetSpecs.includes(s)).length;
  const reasons: string[] = [];

  let score = 0;
  if (matchCount >= 2) {
    score = 30;
    reasons.push("Menangani berbagai aspek kondisi anak");
  } else if (matchCount === 1) {
    score = 20;
  } else if (expertSpecs.length >= 3) {
    score = 10;
    reasons.push("Pengalaman multi-disiplin");
  }

  return { score, reasons };
}

/**
 * Score 0-15: availability (at least 3 active slots = full score)
 */
function scoreAvailability(
  slots: { dayOfWeek: number; isActive: boolean }[],
  isAvailable: boolean
): { score: number; reasons: string[] } {
  if (!isAvailable) return { score: 0, reasons: ["Sedang tidak tersedia"] };

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
      const challenge = scoreChallengeType(expert.specializations, assessment.challengeType);
      const avail = scoreAvailability(expert.availabilitySlots, expert.isAvailable);
      const rating = scoreRating(expert.rating, expert.totalReviews);
      const location = scoreLocation(
        expert.locationType,
        assessment.locationPref as LocationType
      );

      const breakdown: MatchBreakdown = {
        specialization: spec.score,
        challengeType: challenge.score,
        availability: avail.score,
        rating: rating.score,
        location: location.score,
      };

      const totalScore =
        spec.score + challenge.score + avail.score + rating.score + location.score;

      const allReasons = [
        ...spec.reasons,
        ...challenge.reasons,
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

/**
 * Compute and upsert match scores for an assessment (called server-side).
 */
export function computeMatchScoreData(
  assessment: Assessment,
  experts: ExpertWithProfile[]
): Array<{
  assessmentId: string;
  expertId: string;
  score: number;
  reasons: string[];
  breakdown: MatchBreakdown;
}> {
  return matchExperts(assessment, experts, experts.length).map((r) => ({
    assessmentId: assessment.id,
    expertId: r.expertId,
    score: r.score,
    reasons: r.reasons,
    breakdown: r.breakdown,
  }));
}
