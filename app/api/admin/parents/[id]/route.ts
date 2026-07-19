import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const UpdateParentSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().max(30).optional().nullable(),
  isPremium: z.boolean().optional(),
  image: z.string().max(2000).optional().nullable(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = UpdateParentSchema.parse(await request.json());

    const target = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true },
    });
    if (!target || target.role !== "PARENT") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.user.update({ where: { id: params.id }, data });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[ADMIN PARENT PATCH]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const target = await prisma.user.findUnique({
    where: { id: params.id },
    select: { role: true, _count: { select: { consultationsAsParent: true, payments: true } } },
  });
  if (!target || target.role !== "PARENT") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Block deletion when there's real history (consultations/payments) to keep records intact.
  if (target._count.consultationsAsParent > 0 || target._count.payments > 0) {
    return NextResponse.json(
      { error: "Tidak bisa dihapus: akun ini masih punya riwayat konsultasi/pembayaran." },
      { status: 409 }
    );
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      return NextResponse.json(
        { error: "Tidak bisa dihapus karena masih terkait data lain." },
        { status: 409 }
      );
    }
    console.error("[ADMIN PARENT DELETE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
