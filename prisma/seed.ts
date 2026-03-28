import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const adminPassword = await bcrypt.hash("Admin@123456", 12);
  const admin = await prisma.user.upsert({
    where: { email: "admin@ortoconnect.id" },
    update: {},
    create: {
      email: "admin@ortoconnect.id",
      name: "Admin OrtoPedagogik",
      password: adminPassword,
      role: "ADMIN",
    },
  });
  await prisma.consultationQuota.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  // Sample expert users
  const expertData = [
    {
      name: "Dr. Siti Rahayu, M.Pd",
      email: "siti.rahayu@ortoconnect.id",
      specializations: ["LEARNING_DIFFICULTIES", "ADHD"],
      bio: "Spesialis ortopedagogik dengan pengalaman lebih dari 12 tahun mendampingi anak-anak dengan kesulitan belajar dan ADHD.",
      hourlyRate: 350000,
      rating: 4.9,
      totalReviews: 87,
      yearsExperience: 12,
      city: "Jakarta",
      province: "DKI Jakarta",
    },
    {
      name: "Budi Santoso, S.Pd, M.Si",
      email: "budi.santoso@ortoconnect.id",
      specializations: ["AUTISM_SPECTRUM", "COMMUNICATION_DISORDERS"],
      bio: "Terapis wicara dan komunikasi dengan spesialisasi Spektrum Autisme. Menggunakan pendekatan ABA dan PECS.",
      hourlyRate: 300000,
      rating: 4.8,
      totalReviews: 64,
      yearsExperience: 8,
      city: "Bandung",
      province: "Jawa Barat",
    },
    {
      name: "Dewi Lestari, M.Psi",
      email: "dewi.lestari@ortoconnect.id",
      specializations: ["BEHAVIORAL_SUPPORT", "EMOTIONAL_REGULATION", "SOCIAL_SKILLS"],
      bio: "Psikolog klinis anak yang berfokus pada manajemen perilaku dan perkembangan emosi anak.",
      hourlyRate: 400000,
      rating: 4.9,
      totalReviews: 112,
      yearsExperience: 15,
      city: "Surabaya",
      province: "Jawa Timur",
    },
    {
      name: "Andi Pratama, M.Ed",
      email: "andi.pratama@ortoconnect.id",
      specializations: ["SENSORY_PROCESSING", "MOTOR_DEVELOPMENT"],
      bio: "Terapis okupasi dengan keahlian dalam pemrosesan sensorik dan perkembangan motorik anak.",
      hourlyRate: 280000,
      rating: 4.7,
      totalReviews: 45,
      yearsExperience: 6,
      city: "Online",
      province: "Yogyakarta",
      locationType: "BOTH" as const,
    },
  ];

  // Test
  for (const expert of expertData) {
    const password = await bcrypt.hash("Expert@123456", 12);
    const user = await prisma.user.upsert({
      where: { email: expert.email },
      update: {},
      create: {
        email: expert.email,
        name: expert.name,
        password,
        role: "EXPERT",
      },
    });

    await prisma.consultationQuota.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    await prisma.expertProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specializations: expert.specializations as any,
        bio: expert.bio,
        hourlyRate: expert.hourlyRate,
        rating: expert.rating,
        totalReviews: expert.totalReviews,
        yearsExperience: expert.yearsExperience,
        city: expert.city,
        province: expert.province,
        locationType: (expert as any).locationType ?? "ONLINE",
        isVerified: true,
        isAvailable: true,
        availabilitySlots: {
          create: [1, 2, 3, 4, 5].map((day) => ({
            dayOfWeek: day,
            startTime: "09:00",
            endTime: "17:00",
          })),
        },
      },
    });
  }

  // Knowledge content
  const articles = [
    {
      title: "Memahami Disleksia: Panduan Lengkap untuk Orang Tua",
      slug: "memahami-disleksia-panduan-orang-tua",
      excerpt: "Disleksia adalah gangguan belajar yang mempengaruhi kemampuan membaca dan menulis. Pelajari cara mendukung anak Anda.",
      content: "<p>Disleksia adalah kondisi neurologis yang mempengaruhi kemampuan membaca, menulis, dan mengeja...</p>",
      type: "ARTICLE" as const,
      category: "LEARNING_DIFFICULTIES" as const,
      isPremium: false,
      readTimeMins: 8,
    },
    {
      title: "Teknik Manajemen Perilaku untuk Anak ADHD",
      slug: "teknik-manajemen-perilaku-anak-adhd",
      excerpt: "Strategi praktis yang terbukti efektif untuk membantu anak ADHD mengatur perilaku dan fokus di rumah maupun sekolah.",
      content: "<p>ADHD (Attention Deficit Hyperactivity Disorder) adalah kondisi yang mempengaruhi kemampuan anak...</p>",
      type: "ARTICLE" as const,
      category: "BEHAVIORAL_SUPPORT" as const,
      isPremium: false,
      readTimeMins: 10,
    },
    {
      title: "Video: Terapi Sensori untuk Anak dengan SPD",
      slug: "video-terapi-sensori-anak-spd",
      excerpt: "Panduan video komprehensif tentang teknik terapi sensori yang dapat dilakukan di rumah.",
      content: null,
      type: "VIDEO" as const,
      category: "SENSORY_PROCESSING" as const,
      isPremium: true,
      videoUrl: "https://example.com/video/terapi-sensori",
      readTimeMins: 45,
    },
    {
      title: "Komunikasi AAC: Alternatif dan Augmentatif",
      slug: "komunikasi-aac-alternatif-augmentatif",
      excerpt: "Mengenal sistem komunikasi AAC untuk membantu anak-anak dengan gangguan komunikasi.",
      type: "MODULE" as const,
      category: "COMMUNICATION_DISORDERS" as const,
      isPremium: true,
      readTimeMins: 30,
    },
    {
      title: "10 Tips Parenting untuk Orang Tua Anak Autisme",
      slug: "tips-parenting-anak-autisme",
      excerpt: "Kiat-kiat praktis dari para pakar untuk mendampingi anak dengan spektrum autisme sehari-hari.",
      type: "ARTICLE" as const,
      category: "PARENTING_TIPS" as const,
      isPremium: false,
      readTimeMins: 6,
    },
  ];

  for (const article of articles) {
    await prisma.knowledgeContent.upsert({
      where: { slug: article.slug },
      update: {},
      create: {
        ...article,
        content: (article as any).content ?? null,
        videoUrl: (article as any).videoUrl ?? null,
        publishedAt: new Date(),
        viewCount: Math.floor(Math.random() * 5000) + 100,
      },
    });
  }

  // Communities
  const communities = [
    {
      name: "Yayasan Autisme Indonesia",
      slug: "yayasan-autisme-indonesia",
      description: "Organisasi terkemuka yang mendukung anak dan keluarga dengan autisme di seluruh Indonesia.",
      focusAreas: ["AUTISM", "GENERAL_ABK"] as any[],
      orgType: "FOUNDATION" as const,
      region: "Nasional",
      province: "DKI Jakarta",
      contactEmail: "info@autisme.or.id",
      website: "https://autisme.or.id",
      memberCount: 12500,
      isVerified: true,
    },
    {
      name: "Komunitas ADHD Indonesia",
      slug: "komunitas-adhd-indonesia",
      description: "Wadah dukungan bagi orang tua, guru, dan individu dengan ADHD untuk berbagi pengalaman.",
      focusAreas: ["ADHD"] as any[],
      orgType: "SUPPORT_GROUP" as const,
      region: "Nasional",
      province: "DKI Jakarta",
      contactEmail: "adhd.indonesia@gmail.com",
      memberCount: 8200,
      isVerified: true,
    },
    {
      name: "Sekolah Luar Biasa Pelita Bangsa",
      slug: "slb-pelita-bangsa-bandung",
      description: "Sekolah khusus ABK dengan kurikulum adaptif dan tenaga pengajar berpengalaman.",
      focusAreas: ["GENERAL_ABK", "INTELLECTUAL_DISABILITY"] as any[],
      orgType: "SCHOOL" as const,
      region: "Bandung",
      province: "Jawa Barat",
      contactEmail: "slbpelitabangsa@edu.id",
      contactPhone: "+62-22-1234567",
      memberCount: 250,
      isVerified: true,
    },
    {
      name: "Pusat Terapi Tumbuh Kembang Anak Surabaya",
      slug: "pusat-terapi-tumbuh-kembang-surabaya",
      description: "Pusat terapi terpadu dengan layanan OT, speech therapy, dan psikologi anak.",
      focusAreas: ["AUTISM", "CEREBRAL_PALSY", "DOWN_SYNDROME"] as any[],
      orgType: "THERAPY_CENTER" as const,
      region: "Surabaya",
      province: "Jawa Timur",
      contactPhone: "+62-31-9876543",
      memberCount: 420,
      isVerified: false,
    },
  ];

  for (const community of communities) {
    await prisma.community.upsert({
      where: { slug: community.slug },
      update: {},
      create: community,
    });
  }

  console.log("✅ Seeding completed!");
  console.log("─────────────────────────────────");
  console.log("Admin:    admin@ortoconnect.id / Admin@123456");
  console.log("Expert 1: siti.rahayu@ortoconnect.id / Expert@123456");
  console.log("─────────────────────────────────");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
