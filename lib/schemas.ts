import { z } from "zod";

// Shared assessment validation — used by both create (POST) and edit (PATCH)
// so the two endpoints can never drift apart.
export const assessmentSchema = z.object({
  childName: z.string().min(1),
  childAge: z.number().int().min(1).max(30),
  challengeType: z.enum([
    "LEARNING_DIFFICULTIES",
    "BEHAVIORAL_CHALLENGES",
    "COMMUNICATION_ISSUES",
    "SENSORY_PROCESSING",
    "SOCIAL_EMOTIONAL",
    "MULTIPLE_CHALLENGES",
  ]),
  challengeDetails: z.string().optional(),
  learningEnv: z.enum(["HOME", "SCHOOL", "BOTH", "THERAPY_CENTER"]),
  locationPref: z.enum(["ONLINE", "OFFLINE", "BOTH"]).default("ONLINE"),
  goals: z.array(z.string()).default([]),
  documentUrl: z.string().max(2000).optional().nullable(),
  documentName: z.string().max(255).optional().nullable(),
});

// PATCH accepts any subset of the same fields.
export const assessmentUpdateSchema = assessmentSchema.partial();

// ── Community (forum) ─────────────────────────────────────────────────────
export const communitySchema = z.object({
  name: z.string().min(2).max(160),
  description: z.string().min(10).max(4000),
  orgType: z.enum(["FOUNDATION", "SCHOOL", "THERAPY_CENTER", "SUPPORT_GROUP", "GOVERNMENT", "NGO"]),
  focusAreas: z
    .array(
      z.enum([
        "AUTISM",
        "ADHD",
        "DOWN_SYNDROME",
        "DYSLEXIA",
        "HEARING_IMPAIRMENT",
        "VISUAL_IMPAIRMENT",
        "CEREBRAL_PALSY",
        "INTELLECTUAL_DISABILITY",
        "MULTIPLE_DISABILITIES",
        "GENERAL_ABK",
      ])
    )
    .max(10)
    .default([]),
  region: z.string().min(1).max(120),
  province: z.string().min(1).max(120),
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(40).optional().nullable(),
  website: z.string().url().optional().nullable(),
  logoUrl: z.string().max(2000).optional().nullable(),
  memberCount: z.number().int().min(0).max(100_000_000).optional().default(0),
  isVerified: z.boolean().optional().default(false),
  isActive: z.boolean().optional().default(true),
});

export const communityUpdateSchema = communitySchema.partial();
