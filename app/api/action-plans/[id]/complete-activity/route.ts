import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH: Toggle activity completion
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { activityId, completed } = body;

  if (!activityId) {
    return NextResponse.json({ error: "activityId required" }, { status: 400 });
  }

  // Verify ownership
  const plan = await prisma.actionPlan.findFirst({
    where: { id: params.id, userId: session.user.id },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  const activity = await prisma.actionPlanActivity.update({
    where: { id: activityId },
    data: {
      isCompleted: completed ?? true,
      completedAt: completed ? new Date() : null,
    },
  });

  return NextResponse.json({ activity });
}
