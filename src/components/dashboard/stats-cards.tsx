"use client";

import { useEffect, useState } from "react";
import { Activity, TrendingUp, Calendar, Bell, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import type { ApplicationStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  appliedAt: string;
  followUps?: { status: string }[];
  _count?: { followUps: number };
}

interface Stats {
  active: number;
  responseRate: number;
  interviews: number;
  pendingFollowUps: number;
  avgResponseTimeDays: number | null;
}

const ACTIVE_STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
];

function computeStats(applications: ApplicationData[]): Stats {
  const total = applications.length;

  const active = applications.filter((a) =>
    ACTIVE_STATUSES.includes(a.status)
  ).length;

  const withResponse = applications.filter(
    (a) => a.status !== "APPLIED" && a.status !== "NO_RESPONSE"
  ).length;
  const responseRate = total > 0 ? Math.round((withResponse / total) * 100) : 0;

  const interviews = applications.filter(
    (a) => a.status === "INTERVIEW" || a.status === "TECHNICAL"
  ).length;

  const pendingFollowUps = applications.reduce((count, a) => {
    if (a.followUps && a.followUps.length > 0) {
      return count + a.followUps.filter((f) => f.status === "DRAFT").length;
    }
    return count;
  }, 0);

  return { active, responseRate, interviews, pendingFollowUps, avgResponseTimeDays: null };
}

function StatsCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-32" />
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchStats() {
      try {
        const [appsRes, analyticsRes] = await Promise.all([
          fetch("/api/applications"),
          fetch("/api/analytics"),
        ]);
        const appsJson = await appsRes.json();
        if (!appsRes.ok) throw new Error(appsJson.error);

        const computed = computeStats(appsJson.data);

        const analyticsJson = analyticsRes.ok ? await analyticsRes.json() : null;
        computed.avgResponseTimeDays = analyticsJson?.data?.avgResponseTimeDays ?? null;

        setStats(computed);
      } catch {
        setStats({ active: 0, responseRate: 0, interviews: 0, pendingFollowUps: 0, avgResponseTimeDays: null });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const STAT_CARDS = [
    {
      key: "active" as const,
      title: t.dashboard.statsActiveTitle,
      icon: Activity,
      format: (v: number) => `${v}`,
      description: t.dashboard.statsActiveDesc,
      iconColor: "text-blue-500",
    },
    {
      key: "responseRate" as const,
      title: t.dashboard.statsResponseRateTitle,
      icon: TrendingUp,
      format: (v: number) => `${v}%`,
      description: t.dashboard.statsResponseRateDesc,
      iconColor: "text-emerald-500",
    },
    {
      key: "interviews" as const,
      title: t.dashboard.statsInterviewsTitle,
      icon: Calendar,
      format: (v: number) => `${v}`,
      description: t.dashboard.statsInterviewsDesc,
      iconColor: "text-violet-500",
    },
    {
      key: "pendingFollowUps" as const,
      title: t.dashboard.statsPendingFollowUpsTitle,
      icon: Bell,
      format: (v: number) => `${v}`,
      description: t.dashboard.statsPendingFollowUpsDesc,
      iconColor: "text-amber-500",
    },
    {
      key: "avgResponseTimeDays" as const,
      title: t.dashboard.statsAvgResponseTitle,
      icon: Clock,
      format: (v: number | null) => v === null ? t.analytics.avgResponseTimeNoData : `${v}d`,
      description: t.dashboard.statsAvgResponseDesc,
      iconColor: "text-orange-500",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {STAT_CARDS.map((card) => {
        const Icon = card.icon;
        const value = stats ? stats[card.key] : null;

        return (
          <Card key={card.key} className="bg-zinc-950 border-zinc-800">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-zinc-400">
                {card.title}
              </CardTitle>
              <Icon className={`h-4 w-4 ${card.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-zinc-50">
                {card.format(value as never)}
              </div>
              <p className="text-xs text-zinc-500 mt-1">
                {card.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
