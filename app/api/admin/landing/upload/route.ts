import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Admin-only upload for landing media. Files go to the PRIVATE blob store, but
// we return a PUBLIC proxy url (/api/landing/media) so guests can see them on
// the landing page. The proxy whitelists whatever is actually stored in the
// landing content, so this route only "publishes" once the admin saves.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string | null) ?? "landing";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    if (!(file.type.startsWith("image/") || file.type.startsWith("video/"))) {
      return NextResponse.json(
        { error: "Hanya gambar atau video yang didukung" },
        { status: 400 }
      );
    }

    const safeFolder = `landing/${folder}`.replace(/[^a-z0-9/_-]/gi, "");
    const blob = await put(`${safeFolder}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    const url = `/api/landing/media?u=${encodeURIComponent(blob.url)}`;
    return NextResponse.json({ url });
  } catch (error) {
    console.error("[LANDING UPLOAD]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal" },
      { status: 400 }
    );
  }
}
