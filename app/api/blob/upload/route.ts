import { put } from "@vercel/blob";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

// Server-side upload to a PRIVATE Vercel Blob store. The browser posts the file
// here (same origin, no CORS); we upload it privately and return a PROXY url
// (/api/blob/view) so it can be displayed only to authenticated users.
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const form = await request.formData();
    const file = form.get("file");
    const folder = (form.get("folder") as string | null) ?? "uploads";

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
    }

    const allowed = ["application/pdf", "image/", "video/"];
    if (!allowed.some((a) => file.type === a || file.type.startsWith(a))) {
      return NextResponse.json({ error: "Tipe file tidak didukung" }, { status: 400 });
    }

    const safeFolder = folder.replace(/[^a-z0-9/_-]/gi, "");
    const blob = await put(`${safeFolder}/${file.name}`, file, {
      access: "private",
      addRandomSuffix: true,
    });

    // Store the proxy URL, not the raw private blob URL.
    const proxyUrl = `/api/blob/view?u=${encodeURIComponent(blob.url)}`;
    return NextResponse.json({ url: proxyUrl });
  } catch (error) {
    console.error("[BLOB UPLOAD]", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload gagal" },
      { status: 400 }
    );
  }
}
