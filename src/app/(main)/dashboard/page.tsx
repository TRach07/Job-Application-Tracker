"use client";

import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ActionsRequired } from "@/components/dashboard/actions-required";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {t.dashboard.subtitle}
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <StatusChart />
        <ActionsRequired />
      </div>

      <RecentActivity />
    </div>
  );
}
