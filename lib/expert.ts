import { prisma } from "@/lib/prisma";

/**
 * Return the current user's ExpertProfile, creating a minimal (unverified) one
 * the first time an EXPERT-role user manages their profile. Experts start
 * unverified — an admin verifies them before they appear in listings.
 */
export async function getOrCreateExpertProfile(userId: string) {
  const existing = await prisma.expertProfile.findUnique({ where: { userId } });
  if (existing) return existing;
  return prisma.expertProfile.create({
    data: { userId, bio: "", hourlyRate: 0 },
  });
}

export const DAY_LABELS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
] as const;
