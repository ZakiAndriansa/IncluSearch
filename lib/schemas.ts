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
