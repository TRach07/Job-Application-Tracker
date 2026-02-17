import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

export interface Notification {
  id: string;
  type: "stale_application" | "upcoming_interview" | "follow_up_reminder";
  priority: "high" | "medium" | "low";
  applicationId: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  daysSince: number;
  message: string;
  createdAt: string;
}

/**
 * Generates notifications for a user based on their application data.
 * No persistent storage — computed on the fly from application state.
 */
export async function getNotifications(userId: string): Promise<Notification[]> {
  const now = new Date();
  const notifications: Notification[] = [];

  // --- 1. Stale applications: no update in 7+ days, still active ---
  const sevenDaysAgo = new Date(now);
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const staleApps = await prisma.application.findMany({
    where: {
      userId,
      status: { in: ["APPLIED", "SCREENING"] },
      updatedAt: { lt: sevenDaysAgo },
    },
    select: {
      id: true,
      company: true,
      position: true,
      status: true,
      updatedAt: true,
      appliedAt: true,
    },
    orderBy: { updatedAt: "asc" },
  });

  for (const app of staleApps) {
    const daysSince = Math.floor(
      (now.getTime() - app.updatedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    notifications.push({
      id: `stale-${app.id}`,
      type: "stale_application",
      priority: daysSince >= 14 ? "high" : "medium",
      applicationId: app.id,
      company: app.company,
      position: app.position,
      status: app.status,
      daysSince,
      message: "",
      createdAt: app.updatedAt.toISOString(),
    });
  }

  // --- 2. Upcoming interviews: nextActionAt within 3 days ---
  const threeDaysFromNow = new Date(now);
  threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

  const upcomingApps = await prisma.application.findMany({
    where: {
      userId,
      status: { in: ["INTERVIEW", "TECHNICAL"] },
      nextActionAt: {
        gte: now,
        lte: threeDaysFromNow,
      },
    },
    select: {
      id: true,
      company: true,
      position: true,
      status: true,
      nextActionAt: true,
      updatedAt: true,
    },
    orderBy: { nextActionAt: "asc" },
  });

  for (const app of upcomingApps) {
    const daysUntil = Math.ceil(
      (app.nextActionAt!.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    notifications.push({
      id: `interview-${app.id}`,
      type: "upcoming_interview",
      priority: daysUntil <= 1 ? "high" : "medium",
      applicationId: app.id,
      company: app.company,
      position: app.position,
      status: app.status,
      daysSince: daysUntil,
      message: "",
      createdAt: app.updatedAt.toISOString(),
    });
  }

  // --- 3. Follow-up reminders: APPLIED 14+ days with no follow-up at all ---
  const fourteenDaysAgo = new Date(now);
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const needFollowUp = await prisma.application.findMany({
    where: {
      userId,
      status: "APPLIED",
      appliedAt: { lt: fourteenDaysAgo },
      followUps: { none: {} },
    },
    select: {
      id: true,
      company: true,
      position: true,
      status: true,
      appliedAt: true,
      updatedAt: true,
    },
    orderBy: { appliedAt: "asc" },
  });

  for (const app of needFollowUp) {
    const daysSince = Math.floor(
      (now.getTime() - app.appliedAt.getTime()) / (1000 * 60 * 60 * 24)
    );
    notifications.push({
      id: `followup-${app.id}`,
      type: "follow_up_reminder",
      priority: daysSince >= 21 ? "high" : "low",
      applicationId: app.id,
      company: app.company,
      position: app.position,
      status: app.status,
      daysSince,
      message: "",
      createdAt: app.appliedAt.toISOString(),
    });
  }

  // Sort: high priority first, then medium, then low
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  notifications.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return notifications;
}
