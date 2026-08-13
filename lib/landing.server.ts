import { prisma } from "@/lib/prisma";
import { DEFAULT_LANDING, mergeLanding, type LandingData } from "@/lib/landing";

/**
 * Landing content merged over the code defaults. An absent DB row (fresh
 * install) returns the defaults unchanged.
 */
export async function getLandingData(): Promise<LandingData> {
  const row = await prisma.landingContent.findUnique({
    where: { id: "landing" },
  });
  return mergeLanding(DEFAULT_LANDING, (row?.data as Partial<LandingData>) ?? null);
}
