import { get } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { getLandingData } from "@/lib/landing.server";

// Public proxy for landing media held in the PRIVATE blob store. To avoid being
// an open proxy to the whole store, it only serves raw blob urls that are
// referenced by the current landing content (whitelist). Admins may also
// preview an upload before it is saved (not yet whitelisted).
function rawFromProxy(v?: string): string | null {
  if (!v) return null;
  const m = v.match(/\/api\/landing\/media\?u=(.+)$/);
  return m ? decodeURIComponent(m[1]) : null;
}

export async function GET(request: Request): Promise<Response> {
  const raw = new URL(request.url).searchParams.get("u");
  if (!raw) return new Response("Bad request", { status: 400 });

  const data = await getLandingData();
  const whitelist = [data.hero.image, data.video.poster, data.video.url]
    .map(rawFromProxy)
    .filter(Boolean) as string[];
  const isWhitelisted = whitelist.includes(raw);

  if (!isWhitelisted) {
    // Allow admins to preview a freshly-uploaded (not-yet-saved) asset.
    const session = await auth();
    if (session?.user.role !== "ADMIN") {
      return new Response("Not found", { status: 404 });
    }
  }

  try {
    const result = await get(raw, { access: "private" });
    if (!result) return new Response("Not found", { status: 404 });

    return new Response(result.stream, {
      headers: {
        "Content-Type": result.blob.contentType ?? "application/octet-stream",
        "Cache-Control": isWhitelisted
          ? "public, max-age=3600, s-maxage=86400"
          : "private, no-store",
      },
    });
  } catch (error) {
    console.error("[LANDING MEDIA]", error);
    return new Response("Not found", { status: 404 });
  }
}
