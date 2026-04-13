import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { put, del } from "@vercel/blob";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;

  if (!file) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }

  // Validate file type
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Format file harus JPG, PNG, atau WebP" }, { status: 400 });
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return NextResponse.json({ error: "Ukuran file maksimal 2MB" }, { status: 400 });
  }

  try {
    // Delete old avatar if exists in blob storage
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { image: true },
    });

    if (currentUser?.image?.includes("vercel-storage.com")) {
      try {
        await del(currentUser.image);
      } catch {
        // Ignore delete errors for old avatars
      }
    }

    // Upload to Vercel Blob
    const ext = file.name.split(".").pop() || "jpg";
    const filename = `avatars/${session.user.id}-${Date.now()}.${ext}`;

    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });

    // Update user record
    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: blob.url },
    });

    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("[AVATAR UPLOAD]", err);
    return NextResponse.json({ error: "Gagal mengunggah foto" }, { status: 500 });
  }
}
