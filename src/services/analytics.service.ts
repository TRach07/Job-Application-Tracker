import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

export async function getAnalytics(userId: string, locale: string = "fr") {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      statusHistory: true,
      _count: { select: { emails: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  // Response rate
  const total = applications.length;
  const withResponse = applications.filter(
    (a) => a.status !== "APPLIED" && a.status !== "NO_RESPONSE"
  ).length;
  const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0;

  // Funnel
  const funnel = {
    applied: applications.length,
    screening: applications.filter((a) =>
      ["SCREENING", "INTERVIEW", "TECHNICAL", "OFFER", "ACCEPTED"].includes(
        a.status
      )
    ).length,
    interview: applications.filter((a) =>
      ["INTERVIEW", "TECHNICAL", "OFFER", "ACCEPTED"].includes(a.status)
    ).length,
    offer: applications.filter((a) =>
      ["OFFER", "ACCEPTED"].includes(a.status)
    ).length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
  };

  // Status distribution
  const statusDistribution = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<ApplicationStatus, number>
  );

  // Timeline: applications per week (last 12 weeks)
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const timeline: Array<{ week: string; count: number }> = [];
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(twelveWeeksAgo);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = applications.filter(
      (a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd
    ).length;

    timeline.push({
      week: weekStart.toLocaleDateString(locale === "en" ? "en-US" : "fr-FR", {
        day: "numeric",
        month: "short",
      }),
      count,
    });
  }

  // Company response rates
  const byCompany = applications.reduce(
    (acc, app) => {
      if (!acc[app.company]) {
        acc[app.company] = { total: 0, responded: 0 };
      }
      acc[app.company].total++;
      if (app.status !== "APPLIED" && app.status !== "NO_RESPONSE") {
        acc[app.company].responded++;
      }
      return acc;
    },
    {} as Record<string, { total: number; responded: number }>
  );

  return {
    total,
    responseRate,
    funnel,
    statusDistribution,
    timeline,
    byCompany,
  };
}
