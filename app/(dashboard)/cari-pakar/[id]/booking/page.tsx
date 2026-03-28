import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkConsultationQuota } from "@/lib/quota-checker";
import { BookingForm } from "@/components/booking/booking-form";
import { MIDTRANS_CLIENT_KEY } from "@/lib/payments";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Booking Konsultasi" };

export default async function BookingPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const [expert, quota] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { id: params.id, isVerified: true, isAvailable: true },
      include: {
        user: { select: { name: true, image: true } },
        availabilitySlots: { where: { isActive: true }, orderBy: { dayOfWeek: "asc" } },
      },
    }),
    checkConsultationQuota(session.user.id),
  ]);

  if (!expert) notFound();

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
