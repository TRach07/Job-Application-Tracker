"use client";

import { useEffect, useState } from "react";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { ActionsRequired } from "@/components/dashboard/actions-required";
import { OnboardingBanner } from "@/components/dashboard/onboarding-banner";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardPage() {
  const { t } = useTranslation();
  const [hasApplications, setHasApplications] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/applications")
      .then((r) => r.json())
      .then((json) => setHasApplications((json.data?.length ?? 0) > 0))
      .catch(() => setHasApplications(true));
  }, []);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {t.dashboard.subtitle}
        </p>
      </div>

      {hasApplications === false && <OnboardingBanner />}

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <StatusChart />
        <ActionsRequired />
      </div>

      <RecentActivity />
    </div>
  );
}
