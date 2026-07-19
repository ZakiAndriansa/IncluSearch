import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

const CreateParentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  phone: z.string().max(30).optional().nullable(),
  isPremium: z.boolean().optional().default(false),
  image: z.string().max(2000).optional().nullable(),
});

// POST /api/admin/parents — admin creates a parent (orang tua) account.
export async function POST(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const data = CreateParentSchema.parse(await request.json());
    const hashed = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashed,
          role: "PARENT",
          phone: data.phone ?? null,
          isPremium: data.isPremium, // premiumExpiresAt stays null = unlimited while flagged
          image: data.image ?? null,
        },
      });
      await tx.consultationQuota.create({ data: { userId: created.id } });
      return created;
    });

    return NextResponse.json({ id: user.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    console.error("[ADMIN PARENT CREATE]", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
