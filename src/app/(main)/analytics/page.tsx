import { ResponseRate } from "@/components/analytics/response-rate";
import { TimelineChart } from "@/components/analytics/timeline-chart";
import { InsightsPanel } from "@/components/analytics/insights-panel";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">
          Statistiques et insights sur vos candidatures
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
