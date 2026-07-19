import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// DELETE — admin undoes a recorded payout (e.g. entered by mistake).
export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.payout.delete({ where: { id: params.id } }).catch(() => null);
  return NextResponse.json({ success: true });
}
