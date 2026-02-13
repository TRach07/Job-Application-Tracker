"use client";

import { ResponseRate } from "@/components/analytics/response-rate";
import { TimelineChart } from "@/components/analytics/timeline-chart";
import { InsightsPanel } from "@/components/analytics/insights-panel";
import { useTranslation } from "@/hooks/use-translation";

export default function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          {t.analytics.subtitle}
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ResponseRate />
        <TimelineChart />
      </div>

      <InsightsPanel />
    </div>
  );
}
