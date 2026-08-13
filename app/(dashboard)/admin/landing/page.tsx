import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getLandingData } from "@/lib/landing.server";
import { LandingEditor } from "@/components/admin/landing-editor";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Kelola Landing Page" };

export default async function AdminLandingPage() {
  const session = await auth();
  if (!session || session.user.role !== "ADMIN") redirect("/");

  const data = await getLandingData();

  return (
    <div className="max-w-3xl mx-auto animate-fade-in">
      <LandingEditor initial={data} />
    </div>
  );
}
