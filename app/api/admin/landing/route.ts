import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Uploaded media are stored as relative proxy paths (/api/landing/media?u=…) or
// static paths (/landing/…), so they are validated as plain bounded strings,
// not absolute URLs.
const media = z.string().max(2000);
const line = (max = 200) => z.string().max(max);

const landingSchema = z.object({
  hero: z.object({
    badge: line(120),
    titleBefore: line(200),
    titleHighlight: line(120),
    titleAfter: line(200),
    subtitle: line(600),
    primaryCta: line(60),
    secondaryCta: line(60),
    trust1: line(80),
    trust2: line(80),
    image: media,
  }),
  statsLabels: z.array(line(60)).length(4),
  features: z.object({
    eyebrow: line(60),
    title: line(200),
    subtitle: line(400),
    items: z.array(z.object({ title: line(120), desc: line(400) })).max(12),
  }),
  steps: z.object({
    eyebrow: line(60),
    title: line(200),
    items: z.array(z.object({ no: line(6), title: line(120), desc: line(400) })).max(8),
  }),
  video: z.object({
    eyebrow: line(60),
    title: line(200),
    subtitle: line(400),
    poster: media,
    url: media,
  }),
  audience: z.object({
    eyebrow: line(60),
    title: line(200),
    parent: z.object({
      title: line(120),
      desc: line(400),
      bullets: z.array(line(160)).max(8),
      ctaLabel: line(60),
    }),
    expert: z.object({
      title: line(120),
      desc: line(400),
      bullets: z.array(line(160)).max(8),
      ctaLabel: line(60),
    }),
  }),
  cta: z.object({
    title: line(200),
    subtitle: line(400),
    primary: line(60),
    secondary: line(60),
  }),
  footer: z.object({ tagline: line(200) }),
});

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const parsed = landingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Data tidak valid", issues: parsed.error.flatten() },
      { status: 400 }
    );
  }

  await prisma.landingContent.upsert({
    where: { id: "landing" },
    create: { id: "landing", data: parsed.data },
    update: { data: parsed.data },
  });

  // Refresh the public landing page so edits show immediately.
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
