import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/assessments/[id]/activate
 * Deactivates all other assessments for this user, then activates the selected one.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const assessment = await prisma.assessment.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!assessment) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.$transaction([
    // Deactivate all assessments for this user
    prisma.assessment.updateMany({
      where: { userId: session.user.id },
      data: { isActive: false },
    }),
    // Activate the selected one
    prisma.assessment.update({
      where: { id: params.id },
      data: { isActive: true },
    }),
  ]);

  return NextResponse.json({ success: true });
}
