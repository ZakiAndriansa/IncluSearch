import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";

// Streams a PRIVATE blob to authenticated users only. Stored file URLs point
// here (/api/blob/view?u=<blobUrl>) so <img>/<a>/<video> work unchanged while
// the underlying files stay private.
export async function GET(request: Request): Promise<Response> {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const u = new URL(request.url).searchParams.get("u");
  if (!u) return new Response("Bad request", { status: 400 });

  try {
    const result = await get(u, { access: "private" });
    if (!result) return new Response("Not found", { status: 404 });

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[BLOB VIEW]", error);
    return new Response("Not found", { status: 404 });
  }
}
