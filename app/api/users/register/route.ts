import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { z } from "zod";

// Pendaftaran publik TIDAK menerima `role`: apa pun yang dikirim klien
// diabaikan dan akun selalu dibuat sebagai PARENT. Akun PAKAR hanya dibuat
// oleh admin (pakar tetap bisa login, tapi tidak bisa sign up sebagai pakar).
const RegisterSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  email: z.string().email("Email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = RegisterSchema.parse(body);

    // Check duplicate email
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Email sudah terdaftar" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: data.name,
          email: data.email,
          password: hashedPassword,
          role: "PARENT", // selalu PARENT — pakar hanya dibuat admin
        },
      });

      // Initialize quota record
      await tx.consultationQuota.create({
        data: { userId: newUser.id },
      });

      return newUser;
    });

    return NextResponse.json(
      { message: "Akun berhasil dibuat", userId: user.id },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    // Unique-constraint violation (email) — covers the race between the
    // findUnique check above and create(). Report as 409, not 500.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "Email sudah terdaftar" }, { status: 409 });
    }
    console.error("[REGISTER]", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server" },
      { status: 500 }
    );
  }
}
