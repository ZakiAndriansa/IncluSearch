/**
 * Seed a consultation scheduled for TODAY with payment PAID and chat room ready.
 * Usage: npx tsx prisma/seed-today.ts [parent-email]
 *
 * If no email provided, uses the first USER-role account in the DB.
 */

import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const targetEmail = process.argv[2];

  // Get or create parent user
  let parent = targetEmail
    ? await prisma.user.findUnique({ where: { email: targetEmail } })
    : await prisma.user.findFirst({ where: { role: UserRole.PARENT } });

  if (!parent) {
    const password = await bcrypt.hash("User@123456", 12);
    parent = await prisma.user.create({
      data: {
        email: "orang_tua@ortoconnect.id",
        name: "Orang Tua Test",
        password,
        role: UserRole.PARENT,
      },
    });
    await prisma.consultationQuota.create({ data: { userId: parent.id } });
    console.log(`Created parent: ${parent.email} / User@123456`);
  } else {
    console.log(`Using parent: ${parent.email}`);
  }

  // Get first available expert
  const expert = await prisma.expertProfile.findFirst({
    where: { isAvailable: true },
    include: { user: { select: { name: true } } },
  });

  if (!expert) {
    console.error("No expert found. Run `npx prisma db seed` first.");
    process.exit(1);
  }

  console.log(`Using expert: ${expert.user.name}`);

  // Schedule for 1 hour from now today
  const scheduledAt = new Date();
  scheduledAt.setHours(scheduledAt.getHours() + 1, 0, 0, 0);

  const orderId = `CON-TODAY-${Date.now()}`;

  // Create chat room
  const chatRoom = await prisma.chatRoom.create({ data: {} });

  // Create consultation (already SCHEDULED with chat room)
  const consultation = await prisma.consultation.create({
    data: {
      parentId: parent.id,
      expertId: expert.id,
      scheduledAt,
      durationMins: 60,
      totalAmount: expert.hourlyRate,
      status: "SCHEDULED",
      paidAt: new Date(),
      chatRoomId: chatRoom.id,
    },
  });

  // Create payment (already PAID)
  await prisma.payment.create({
    data: {
      userId: parent.id,
      consultationId: consultation.id,
      type: "CONSULTATION",
      amount: expert.hourlyRate,
      midtransOrderId: orderId,
      status: "PAID",
      paidAt: new Date(),
    },
  });

  console.log("─────────────────────────────────────────");
  console.log("✅ Consultation created!");
  console.log(`   ID        : ${consultation.id}`);
  console.log(`   Jadwal    : ${scheduledAt.toLocaleString("id-ID")}`);
  console.log(`   Pakar     : ${expert.user.name}`);
  console.log(`   Chat room : ${chatRoom.id}`);
  console.log(`   URL       : /konsultasi/${consultation.id}`);
  console.log("─────────────────────────────────────────");
  if (!targetEmail && parent.email === "orang_tua@ortoconnect.id") {
    console.log("Login: orang_tua@ortoconnect.id / User@123456");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
