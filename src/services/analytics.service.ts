import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

// Pipeline order for stage duration computation
const PIPELINE_ORDER: ApplicationStatus[] = [
  "APPLIED", "SCREENING", "INTERVIEW", "TECHNICAL", "OFFER", "ACCEPTED",
];

export async function getAnalytics(userId: string, locale: string = "fr") {
  const applications = await prisma.application.findMany({
    where: { userId },
    include: {
      statusHistory: { orderBy: { changedAt: "asc" } },
      _count: { select: { emails: true, followUps: true } },
    },
    orderBy: { appliedAt: "asc" },
  });

  const total = applications.length;
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";

  // --- Response rate ---
  const withResponse = applications.filter(
    (a) => a.status !== "APPLIED" && a.status !== "NO_RESPONSE"
  ).length;
  const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0;

  // --- Funnel with conversion rates ---
  const funnelCounts = {
    applied: applications.length,
    screening: applications.filter((a) =>
      ["SCREENING", "INTERVIEW", "TECHNICAL", "OFFER", "ACCEPTED"].includes(a.status)
    ).length,
    interview: applications.filter((a) =>
      ["INTERVIEW", "TECHNICAL", "OFFER", "ACCEPTED"].includes(a.status)
    ).length,
    offer: applications.filter((a) =>
      ["OFFER", "ACCEPTED"].includes(a.status)
    ).length,
    accepted: applications.filter((a) => a.status === "ACCEPTED").length,
  };

  const funnelStages = Object.keys(funnelCounts) as (keyof typeof funnelCounts)[];
  const funnel = funnelStages.map((stage, i) => {
    const count = funnelCounts[stage];
    const prevCount = i > 0 ? funnelCounts[funnelStages[i - 1]] : count;
    const conversionRate = prevCount > 0 ? Math.round((count / prevCount) * 100) : 0;
    return { stage, count, conversionRate };
  });

  // --- Status distribution ---
  const statusDistribution = applications.reduce(
    (acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // --- Timeline: last 12 weeks ---
  const twelveWeeksAgo = new Date();
  twelveWeeksAgo.setDate(twelveWeeksAgo.getDate() - 84);

  const timeline: Array<{ week: string; count: number; avg: number | null }> = [];
  const weekCounts: number[] = [];
  for (let i = 0; i < 12; i++) {
    const weekStart = new Date(twelveWeeksAgo);
    weekStart.setDate(weekStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const count = applications.filter(
      (a) => a.appliedAt >= weekStart && a.appliedAt < weekEnd
    ).length;
    weekCounts.push(count);

    // 3-week rolling average
    let avg: number | null = null;
    if (weekCounts.length >= 3) {
      const last3 = weekCounts.slice(-3);
      avg = Math.round((last3.reduce((a, b) => a + b, 0) / 3) * 10) / 10;
    }

    timeline.push({
      week: weekStart.toLocaleDateString(intlLocale, { day: "numeric", month: "short" }),
      count,
      avg,
    });
  }

  // --- Company performance ---
  const byCompanyMap = applications.reduce(
    (acc, app) => {
      if (!acc[app.company]) {
        acc[app.company] = { total: 0, responded: 0, bestStatus: "APPLIED" as ApplicationStatus };
      }
      acc[app.company].total++;
      if (app.status !== "APPLIED" && app.status !== "NO_RESPONSE") {
        acc[app.company].responded++;
      }
      const currentOrder = PIPELINE_ORDER.indexOf(app.status);
      const bestOrder = PIPELINE_ORDER.indexOf(acc[app.company].bestStatus);
      if (currentOrder > bestOrder) {
        acc[app.company].bestStatus = app.status;
      }
      return acc;
    },
    {} as Record<string, { total: number; responded: number; bestStatus: ApplicationStatus }>
  );
  const byCompany = Object.entries(byCompanyMap)
    .map(([company, data]) => ({
      company,
      total: data.total,
      responded: data.responded,
      responseRate: data.total > 0 ? Math.round((data.responded / data.total) * 100) : 0,
      bestStatus: data.bestStatus,
    }))
    .sort((a, b) => b.total - a.total);

  // --- Average response time ---
  const responseTimes: number[] = [];
  for (const app of applications) {
    if (app.statusHistory.length > 0) {
      const firstChange = app.statusHistory[0]; // already sorted asc
      const diffMs = firstChange.changedAt.getTime() - app.appliedAt.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
      if (diffDays >= 0) responseTimes.push(diffDays);
    }
  }
  const avgResponseTimeDays = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : null;

  // Response time distribution buckets
  const responseTimeDistribution = [
    { bucket: "0-3d", count: 0 },
    { bucket: "4-7d", count: 0 },
    { bucket: "8-14d", count: 0 },
    { bucket: "15-30d", count: 0 },
    { bucket: "30d+", count: 0 },
  ];
  for (const days of responseTimes) {
    if (days <= 3) responseTimeDistribution[0].count++;
    else if (days <= 7) responseTimeDistribution[1].count++;
    else if (days <= 14) responseTimeDistribution[2].count++;
    else if (days <= 30) responseTimeDistribution[3].count++;
    else responseTimeDistribution[4].count++;
  }

  // --- Average duration per pipeline stage (days) ---
  const stageDurations: Record<string, number[]> = {};
  for (const app of applications) {
    if (app.statusHistory.length === 0) continue;

    // Build stage timeline: start at appliedAt with APPLIED, then each transition
    const transitions = [
      { status: "APPLIED" as ApplicationStatus, at: app.appliedAt },
      ...app.statusHistory.map((sc) => ({ status: sc.toStatus, at: sc.changedAt })),
    ];

    for (let i = 0; i < transitions.length - 1; i++) {
      const stage = transitions[i].status;
      // Only count forward pipeline stages
      if (!PIPELINE_ORDER.includes(stage)) continue;
      const daysInStage = Math.round(
        (transitions[i + 1].at.getTime() - transitions[i].at.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysInStage >= 0) {
        if (!stageDurations[stage]) stageDurations[stage] = [];
        stageDurations[stage].push(daysInStage);
      }
    }
  }
  const avgStageDurations = PIPELINE_ORDER
    .filter((s) => stageDurations[s]?.length)
    .map((stage) => ({
      stage,
      avgDays: Math.round(
        stageDurations[stage].reduce((a, b) => a + b, 0) / stageDurations[stage].length
      ),
      count: stageDurations[stage].length,
    }));

  // --- Source breakdown ---
  const sourceBreakdown = {
    manual: applications.filter((a) => a.source === "MANUAL").length,
    emailDetected: applications.filter((a) => a.source === "EMAIL_DETECTED").length,
  };

  // --- Rejection analysis: which stage leads to most rejections ---
  const rejectionsByStage: Record<string, number> = {};
  for (const app of applications) {
    for (const sc of app.statusHistory) {
      if (sc.toStatus === "REJECTED") {
        const from = sc.fromStatus;
        rejectionsByStage[from] = (rejectionsByStage[from] || 0) + 1;
      }
    }
  }

  return {
    total,
    responseRate,
    funnel,
    statusDistribution,
    timeline,
    byCompany,
    avgResponseTimeDays,
    responseTimeDistribution,
    avgStageDurations,
    sourceBreakdown,
    rejectionsByStage,
  };
}
