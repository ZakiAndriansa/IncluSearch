/**
 * Tambah konsultasi dengan Dr. Siti Rahayu hari ini jam 23:00 - 01:00 (120 menit)
 * Usage: npx tsx prisma/seed-siti.ts [parent-email]
 */
import { PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  const parent = targetEmail
    ? await prisma.user.findUnique({ where: { email: targetEmail } })
    : await prisma.user.findFirst({ where: { role: UserRole.PARENT } });

  if (!parent) {
    console.error("Tidak ada user PARENT. Jalankan: npx prisma db seed");
    process.exit(1);
  }

  const siti = await prisma.user.findUnique({
    where: { email: "siti.rahayu@ortoconnect.id" },
    include: { expertProfile: true },
  });

  if (!siti?.expertProfile) {
    console.error("Dr. Siti tidak ditemukan. Jalankan: npx prisma db seed");
    process.exit(1);
  }

  const scheduledAt = new Date();
  scheduledAt.setHours(23, 0, 0, 0);

  const chatRoom = await prisma.chatRoom.create({ data: {} });

  const consultation = await prisma.consultation.create({
    data: {
      parentId: parent.id,
      expertId: siti.expertProfile.id,
      scheduledAt,
      durationMins: 120,
      totalAmount: siti.expertProfile.hourlyRate * 2,
      status: "SCHEDULED",
      paidAt: new Date(),
      chatRoomId: chatRoom.id,
    },
  });

  await prisma.payment.create({
    data: {
      userId: parent.id,
      consultationId: consultation.id,
      type: "CONSULTATION",
      amount: siti.expertProfile.hourlyRate * 2,
      midtransOrderId: `CON-SITI-${Date.now()}`,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  console.log("✅ Konsultasi Dr. Siti dibuat!");
  console.log("─────────────────────────────────────────");
  console.log(`   Parent    : ${parent.email}`);
  console.log(`   Expert    : Dr. Siti Rahayu`);
  console.log(`   Jadwal    : 23:00 - 01:00 (120 menit)`);
  console.log(`   URL       : /konsultasi/${consultation.id}`);
  console.log("─────────────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
