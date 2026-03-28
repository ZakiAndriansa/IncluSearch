import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkConsultationQuota } from "@/lib/quota-checker";
import { BookingForm } from "@/components/booking/booking-form";
import { MIDTRANS_CLIENT_KEY } from "@/lib/payments";
import { Button } from "@/components/ui/button";
import { ClipboardList } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Booking Konsultasi" };

export default async function BookingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [expert, quota, activeAssessment] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { id: params.id, isVerified: true, isAvailable: true },
      include: {
        user: { select: { name: true, image: true } },
        availabilitySlots: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      },
    }),
    checkConsultationQuota(session.user.id),
    session.user.role === "PARENT"
      ? prisma.assessment.findFirst({
          where: { userId: session.user.id, isActive: true },
          select: { id: true },
        })
      : Promise.resolve(true),
  ]);

  if (!expert) notFound();

  // Gate: PARENT must have completed assessment
  if (session.user.role === "PARENT" && !activeAssessment) {
    return (
      <div className="max-w-md mx-auto mt-16 text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
          <ClipboardList className="w-8 h-8 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-serif font-bold text-forest-500 mb-2">
            Asesmen Diperlukan
          </h1>
          <p className="text-sm text-sand-500 leading-relaxed">
            Sebelum melakukan konsultasi, silakan isi asesmen kebutuhan anak terlebih dahulu.
            Ini membantu kami mencocokkan Anda dengan pakar yang tepat.
          </p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600 text-white gap-2">
          <Link href="/profil?tab=asesmen">
            <ClipboardList className="w-4 h-4" />
            Isi Asesmen Sekarang
          </Link>
        </Button>
        <p className="text-xs text-sand-400">
          Sudah mengisi?{" "}
          <Link href={`/cari-pakar/${params.id}`} className="text-forest-500 hover:underline">
            Kembali ke profil pakar
          </Link>
        </p>
      </div>
    );
  }

  return (
    <BookingForm
      expert={expert}
      quotaAllowed={quota.allowed}
      quotaMessage={quota.message}
      nextAvailableAt={quota.nextAvailableAt?.toISOString() ?? null}
      isPremium={session.user.isPremium}
      clientKey={MIDTRANS_CLIENT_KEY}
    />
  );
}
