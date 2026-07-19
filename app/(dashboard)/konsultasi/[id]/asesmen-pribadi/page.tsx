import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PersonalAssessmentForm } from "@/components/pakar/personal-assessment-form";
import { PersonalAssessmentView } from "@/components/consultation/personal-assessment-view";
import { PA_FIELD_NAMES } from "@/lib/personal-assessment";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Asesmen Pribadi" };

export default async function PersonalAssessmentPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  if (!session) redirect("/login");

  const consultation = await prisma.consultation.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      parentId: true,
      expert: { select: { userId: true } },
    },
  });
  if (!consultation) notFound();

  const isExpert = consultation.expert.userId === session.user.id;
  const isParent = consultation.parentId === session.user.id;
  if (!isExpert && !isParent) notFound();

  const [pa, childAssessment] = await Promise.all([
    prisma.personalAssessment.findUnique({ where: { consultationId: params.id } }),
    prisma.assessment.findFirst({
      where: { userId: consultation.parentId, isActive: true },
      select: { childName: true },
    }),
  ]);

  // Normalise the 9 fields into a plain record.
  const data: Record<string, string | null> = {};
  for (const name of PA_FIELD_NAMES) {
    data[name] = (pa as Record<string, unknown> | null)?.[name] as string | null ?? null;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link
        href={`/konsultasi/${params.id}`}
        className="inline-flex items-center gap-1.5 text-sm text-sand-500 hover:text-forest-500"
      >
        <ArrowLeft className="w-4 h-4" />
        Kembali ke Konsultasi
      </Link>

      {isExpert ? (
        <PersonalAssessmentForm
          consultationId={params.id}
          childName={childAssessment?.childName}
          initial={data}
          initialStatus={(pa?.status as "DRAFT" | "SUBMITTED") ?? "DRAFT"}
        />
      ) : pa && pa.status === "SUBMITTED" ? (
        <PersonalAssessmentView data={data} childName={childAssessment?.childName} />
      ) : (
        <div className="bg-white rounded-2xl border border-sand-200 p-8 text-center">
          <div className="text-4xl mb-3">📝</div>
          <h3 className="font-semibold text-forest-500 mb-1">Asesmen Belum Tersedia</h3>
          <p className="text-sand-500 text-sm">
            Pakar belum mengirimkan hasil asesmen pribadi untuk anak Anda.
          </p>
        </div>
      )}
    </div>
  );
}
