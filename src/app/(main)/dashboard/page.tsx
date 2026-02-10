import { StatsCards } from "@/components/dashboard/stats-cards";
import { StatusChart } from "@/components/dashboard/status-chart";
import { RecentActivity } from "@/components/dashboard/recent-activity";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Vue d&apos;ensemble de vos candidatures
        </p>
      </div>

      <StatsCards />

      <div className="grid gap-6 md:grid-cols-2">
        <StatusChart />
        <RecentActivity />
      </div>
    </div>
  );
}
