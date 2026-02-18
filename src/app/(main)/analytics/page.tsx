"use client";

import { ResponseRate } from "@/components/analytics/response-rate";
import { FunnelChart } from "@/components/analytics/funnel-chart";
import { TimelineChart } from "@/components/analytics/timeline-chart";
import { StageDurationChart } from "@/components/analytics/stage-duration-chart";
import { CompanyTable } from "@/components/analytics/company-table";
import { SourceBreakdown } from "@/components/analytics/source-breakdown";
import { ResponseTimeChart } from "@/components/analytics/response-time-chart";
import { RejectionAnalysis } from "@/components/analytics/rejection-analysis";
import { InsightsPanel } from "@/components/analytics/insights-panel";
import {
  AnalyticsFilterProvider,
  AnalyticsFilterBar,
} from "@/components/analytics/analytics-filters";
import { useTranslation } from "@/hooks/use-translation";

export default function AnalyticsPage() {
  const { t } = useTranslation();

  return (
    <AnalyticsFilterProvider>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Analytics</h1>
          <p className="text-muted-foreground">
            {t.analytics.subtitle}
          </p>
        </div>

        <AnalyticsFilterBar />

        {/* Row 1: Response Rate + Conversion Funnel */}
        <div className="grid gap-6 md:grid-cols-2">
          <ResponseRate />
          <FunnelChart />
        </div>

        {/* Row 2: Timeline (full width with rolling average) */}
        <TimelineChart />

        {/* Row 3: Stage Duration + Response Time Distribution */}
        <div className="grid gap-6 md:grid-cols-2">
          <StageDurationChart />
          <ResponseTimeChart />
        </div>

        {/* Row 4: Source Breakdown + Rejection Analysis */}
        <div className="grid gap-6 md:grid-cols-2">
          <SourceBreakdown />
          <RejectionAnalysis />
        </div>

        {/* Row 5: Company Performance (full width) */}
        <CompanyTable />

        {/* Row 6: AI Insights (full width) */}
        <InsightsPanel />
      </div>
    </AnalyticsFilterProvider>
  );
}
