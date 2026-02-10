import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";
import type {
  CreateApplicationInput,
  UpdateApplicationInput,
} from "@/types/application";

export async function getApplications(userId: string) {
  return prisma.application.findMany({
    where: { userId },
    include: {
      emails: { orderBy: { receivedAt: "desc" }, take: 1 },
      followUps: { where: { status: "DRAFT" }, take: 1 },
      _count: { select: { emails: true, followUps: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getApplicationById(id: string, userId: string) {
  return prisma.application.findFirst({
    where: { id, userId },
    include: {
      emails: { orderBy: { receivedAt: "desc" } },
      followUps: { orderBy: { createdAt: "desc" } },
      statusHistory: { orderBy: { changedAt: "desc" } },
    },
  });
}

export async function createApplication(
  userId: string,
  data: CreateApplicationInput
) {
  return prisma.application.create({
    data: {
      ...data,
      userId,
    },
  });
}

export async function updateApplication(
  id: string,
  userId: string,
  data: UpdateApplicationInput
) {
  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Application not found");
  }

  // Track status change
  if (data.status && data.status !== existing.status) {
    await prisma.statusChange.create({
      data: {
        applicationId: id,
        fromStatus: existing.status,
        toStatus: data.status,
      },
    });
  }

  return prisma.application.update({
    where: { id, userId },
    data,
  });
}

export async function deleteApplication(id: string, userId: string) {
  const existing = await prisma.application.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    throw new Error("Application not found");
  }

  return prisma.application.delete({ where: { id, userId } });
}

export async function getApplicationStats(userId: string) {
  const applications = await prisma.application.findMany({
    where: { userId },
    select: { status: true, appliedAt: true },
  });

  const total = applications.length;
  const byStatus = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  const activeStatuses: ApplicationStatus[] = [
    "APPLIED",
    "SCREENING",
    "INTERVIEW",
    "TECHNICAL",
    "OFFER",
  ];
  const active = applications.filter((a) =>
    activeStatuses.includes(a.status)
  ).length;

  const withResponse = applications.filter(
    (a) => a.status !== "APPLIED" && a.status !== "NO_RESPONSE"
  ).length;
  const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0;

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);

  const interviewsThisWeek = applications.filter(
    (a) =>
      (a.status === "INTERVIEW" || a.status === "TECHNICAL") &&
      a.appliedAt >= weekStart
  ).length;

  return {
    total,
    active,
    responseRate,
    interviewsThisWeek,
    byStatus,
  };
}
