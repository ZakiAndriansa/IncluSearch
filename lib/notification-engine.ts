/**
 * Smart Notification Engine
 * Role-aware: generates different notifications for PARENT vs EXPERT
 * Called on dashboard load to check and create relevant notifications
 */

import { prisma } from "@/lib/prisma";

type NotifType = "JOURNAL_REMINDER" | "ACTION_PLAN_REMINDER" | "CONSULTATION_REMINDER" | "INSIGHT_READY" | "PREMIUM_EXPIRED" | "ACHIEVEMENT" | "SYSTEM";

interface NotifPayload {
  type: NotifType;
  title: string;
  message: string;
  actionUrl?: string;
}

export async function generateNotifications(userId: string) {
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isPremium: true,
      premiumExpiresAt: true,
      hasOnboarded: true,
      createdAt: true,
    },
  });

  if (!user) return;

  // Get existing notifications to avoid duplicates (last 24h)
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const recentNotifs = await prisma.notification.findMany({
    where: { userId, createdAt: { gte: yesterday } },
    select: { type: true },
  });
  const recentTypes = new Set(recentNotifs.map((n: { type: string }) => n.type));

  const notifications: NotifPayload[] = [];

  // ═══════════════════════════════════════════
  // PARENT-ONLY NOTIFICATIONS
  // ═══════════════════════════════════════════
  if (user.role === "PARENT") {
    // 1. Journal Reminder (after 2 PM if no journal today)
    if (!recentTypes.has("JOURNAL_REMINDER") && now.getHours() >= 14) {
      const todayJournal = await prisma.dailyJournal.findFirst({
        where: { userId, date: today },
      });

      if (!todayJournal) {
        notifications.push({
          type: "JOURNAL_REMINDER",
          title: "Jangan lupa isi jurnal hari ini",
          message: "Catat mood, pencapaian, dan perkembangan anak Anda hari ini. Hanya butuh 2 menit!",
          actionUrl: "/jurnal",
        });
      }
    }

    // 2. Action Plan Reminder
    if (!recentTypes.has("ACTION_PLAN_REMINDER")) {
      const activePlan = await prisma.actionPlan.findFirst({
        where: { userId, isActive: true },
        include: {
          activities: { select: { isCompleted: true } },
          assessment: { select: { childName: true } },
        },
      });

      if (activePlan) {
        const remaining = activePlan.activities.filter((a: { isCompleted: boolean }) => !a.isCompleted).length;
        if (remaining > 0) {
          const childName = activePlan.assessment?.childName || "anak";
          notifications.push({
            type: "ACTION_PLAN_REMINDER",
            title: `${remaining} aktivitas belum selesai`,
            message: `Action plan ${childName} masih punya ${remaining} aktivitas yang belum dicek. Yuk lanjutkan!`,
            actionUrl: "/action-plan",
          });
        }
      }
    }

    // 3. Parent Consultation Reminder (tomorrow)
    if (!recentTypes.has("CONSULTATION_REMINDER")) {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const tomorrowConsultation = await prisma.consultation.findFirst({
        where: {
          parentId: userId,
          scheduledAt: { gte: tomorrow, lt: dayAfter },
          status: { in: ["SCHEDULED", "IN_PROGRESS"] },
        },
        include: { expert: { include: { user: { select: { name: true } } } } },
      });

      if (tomorrowConsultation) {
        const expertName = tomorrowConsultation.expert.user.name || "pakar";
        const time = new Intl.DateTimeFormat("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(tomorrowConsultation.scheduledAt));

        notifications.push({
          type: "CONSULTATION_REMINDER",
          title: "Konsultasi besok!",
          message: `Jangan lupa, Anda ada jadwal konsultasi dengan ${expertName} besok pukul ${time}.`,
          actionUrl: `/konsultasi/${tomorrowConsultation.id}`,
        });
      }
    }

    // 4. Insight Ready
    if (!recentTypes.has("INSIGHT_READY")) {
      const assessmentWithoutInsight = await prisma.assessment.findFirst({
        where: { userId, isActive: true, insight: null },
        select: { id: true, childName: true },
      });

      if (assessmentWithoutInsight) {
        notifications.push({
          type: "INSIGHT_READY",
          title: "Insight asesmen siap dilihat!",
          message: `Hasil analisis untuk ${assessmentWithoutInsight.childName} sudah tersedia. Lihat insight dan rekomendasi sekarang.`,
          actionUrl: `/profil/asesmen/${assessmentWithoutInsight.id}/insight`,
        });
      }
    }

    // 5. Premium Expiring
    if (!recentTypes.has("PREMIUM_EXPIRED") && user.isPremium && user.premiumExpiresAt) {
      const daysUntilExpiry = Math.ceil(
        (user.premiumExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        notifications.push({
          type: "PREMIUM_EXPIRED",
          title: `Premium berakhir dalam ${daysUntilExpiry} hari`,
          message: "Perpanjang langganan untuk tetap menikmati semua fitur premium tanpa gangguan.",
          actionUrl: "/profil?tab=premium",
        });
      } else if (daysUntilExpiry <= 0) {
        notifications.push({
          type: "PREMIUM_EXPIRED",
          title: "Langganan Premium telah berakhir",
          message: "Perpanjang sekarang untuk kembali mengakses fitur premium.",
          actionUrl: "/profil?tab=premium",
        });
      }
    }

    // 6. Journal Streak Achievement
    if (!recentTypes.has("ACHIEVEMENT")) {
      const last7Days = new Date(today);
      last7Days.setDate(last7Days.getDate() - 7);

      const journalCount = await prisma.dailyJournal.count({
        where: { userId, date: { gte: last7Days } },
      });

      if (journalCount >= 7) {
        notifications.push({
          type: "ACHIEVEMENT",
          title: "Streak 7 Hari! Hebat!",
          message: "Anda sudah konsisten menulis jurnal selama 7 hari berturut-turut. Terus semangat!",
          actionUrl: "/jurnal",
        });
      } else if (journalCount >= 3) {
        const has3DayNotif = await prisma.notification.findFirst({
          where: { userId, type: "ACHIEVEMENT", title: { contains: "3 Hari" } },
        });
        if (!has3DayNotif) {
          notifications.push({
            type: "ACHIEVEMENT",
            title: "Streak 3 Hari! Bagus!",
            message: "Sudah 3 hari berturut-turut menulis jurnal. Konsistensi Anda luar biasa!",
            actionUrl: "/jurnal",
          });
        }
      }
    }
  }

  // ═══════════════════════════════════════════
  // EXPERT-ONLY NOTIFICATIONS
  // ═══════════════════════════════════════════
  if (user.role === "EXPERT") {
    const expertProfile = await prisma.expertProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (expertProfile) {
      // 1. Expert Consultation Reminder (tomorrow's sessions)
      if (!recentTypes.has("CONSULTATION_REMINDER")) {
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayAfter = new Date(tomorrow);
        dayAfter.setDate(dayAfter.getDate() + 1);

        const tomorrowSessions = await prisma.consultation.findMany({
          where: {
            expertId: expertProfile.id,
            scheduledAt: { gte: tomorrow, lt: dayAfter },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
          include: { parent: { select: { name: true } } },
        });

        if (tomorrowSessions.length > 0) {
          const names = tomorrowSessions.map((s: { parent: { name: string | null } }) => s.parent.name || "Orangtua").slice(0, 3);
          const extra = tomorrowSessions.length > 3 ? ` +${tomorrowSessions.length - 3} lainnya` : "";
          notifications.push({
            type: "CONSULTATION_REMINDER",
            title: `${tomorrowSessions.length} konsultasi besok`,
            message: `Anda punya jadwal dengan ${names.join(", ")}${extra} besok. Pastikan Anda siap!`,
            actionUrl: "/konsultasi",
          });
        }
      }

      // 2. New Booking Notification (consultations created in last 24h)
      if (!recentTypes.has("SYSTEM")) {
        const newBookings = await prisma.consultation.findMany({
          where: {
            expertId: expertProfile.id,
            status: "SCHEDULED",
            createdAt: { gte: yesterday },
          },
          include: { parent: { select: { name: true } } },
        });

        if (newBookings.length > 0) {
          const name = newBookings[0].parent.name || "Orangtua";
          notifications.push({
            type: "SYSTEM",
            title: newBookings.length === 1
              ? `Booking baru dari ${name}`
              : `${newBookings.length} booking baru`,
            message: newBookings.length === 1
              ? `${name} telah memesan konsultasi dengan Anda. Lihat jadwal untuk detail.`
              : `${newBookings.length} orangtua telah memesan konsultasi. Lihat jadwal untuk detail.`,
            actionUrl: "/konsultasi",
          });
        }
      }

      // 3. New Review Notification
      if (!recentTypes.has("ACHIEVEMENT")) {
        const newReviews = await prisma.expertReview.findMany({
          where: {
            expertId: expertProfile.id,
            createdAt: { gte: yesterday },
          },
          select: { rating: true, reviewerId: true },
        });

        if (newReviews.length > 0) {
          const reviewer = await prisma.user.findUnique({
            where: { id: newReviews[0].reviewerId },
            select: { name: true },
          });
          notifications.push({
            type: "ACHIEVEMENT",
            title: `Ulasan baru dari ${reviewer?.name || "Orangtua"}`,
            message: `Anda mendapat ulasan ${newReviews[0].rating}/5 bintang. Lihat ulasan lengkapnya.`,
            actionUrl: "/profil?tab=statistik",
          });
        }
      }

      // 4. Today's Schedule Summary (morning reminder)
      if (!recentTypes.has("JOURNAL_REMINDER") && now.getHours() >= 7 && now.getHours() < 12) {
        const tomorrow2 = new Date(today);
        tomorrow2.setDate(tomorrow2.getDate() + 1);

        const todaySessions = await prisma.consultation.count({
          where: {
            expertId: expertProfile.id,
            scheduledAt: { gte: today, lt: tomorrow2 },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
        });

        if (todaySessions > 0) {
          notifications.push({
            type: "JOURNAL_REMINDER", // reuse type to avoid duplicate
            title: `${todaySessions} konsultasi hari ini`,
            message: `Anda memiliki ${todaySessions} sesi konsultasi yang dijadwalkan hari ini. Semangat!`,
            actionUrl: "/konsultasi",
          });
        }
      }
    }
  }

  // Create notifications in bulk
  if (notifications.length > 0) {
    await prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
      })),
    });
  }

  return notifications.length;
}
