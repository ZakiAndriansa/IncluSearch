import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Cari Bu Siti
  const siti = await prisma.user.findFirst({
    where: { name: { contains: "Siti", mode: "insensitive" } },
    include: { expertProfile: { include: { availabilitySlots: true } } },
  });

  if (!siti?.expertProfile) {
    console.log("Bu Siti tidak ditemukan!");
    return;
  }

  console.log("Expert ID:", siti.expertProfile.id);
  console.log("Slots saat ini:", siti.expertProfile.availabilitySlots);

  // Hapus semua slot lama, buat ulang untuk semua hari (0-6)
  await prisma.availabilitySlot.deleteMany({
    where: { expertProfileId: siti.expertProfile.id },
  });

  const days = [0, 1, 2, 3, 4, 5, 6]; // Min-Sab
  await prisma.availabilitySlot.createMany({
    data: days.map((day) => ({
      expertProfileId: siti.expertProfile!.id,
      dayOfWeek: day,
      startTime: "00:00",
      endTime: "23:59",
      isActive: true,
    })),
  });

  console.log("Slot Bu Siti berhasil diperbarui untuk semua hari 00:00-23:59");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
