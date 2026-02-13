"use client";

import { useEffect, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG, getStatusLabel } from "@/constants/status";
import type { ApplicationStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";
import type { TranslationDictionary } from "@/i18n/types";

const STATUS_HEX_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: "#64748b",
  SCREENING: "#3b82f6",
  INTERVIEW: "#8b5cf6",
  TECHNICAL: "#f59e0b",
  OFFER: "#10b981",
  ACCEPTED: "#22c55e",
  REJECTED: "#ef4444",
  WITHDRAWN: "#6b7280",
  NO_RESPONSE: "#71717a",
};

interface ChartDataPoint {
  name: string;
  value: number;
  status: ApplicationStatus;
}

interface ApplicationData {
  status: ApplicationStatus;
}

function buildChartData(applications: ApplicationData[], t: TranslationDictionary): ChartDataPoint[] {
  const counts: Partial<Record<ApplicationStatus, number>> = {};

  for (const app of applications) {
    counts[app.status] = (counts[app.status] || 0) + 1;
  }

  return Object.entries(counts)
    .map(([status, value]) => ({
      name: getStatusLabel(status as ApplicationStatus, t),
      value: value as number,
      status: status as ApplicationStatus,
    }))
    .sort(
      (a, b) =>
        STATUS_CONFIG[a.status].order - STATUS_CONFIG[b.status].order
    );
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; payload: ChartDataPoint }[];
  t: TranslationDictionary;
}

function CustomTooltip({ active, payload, t }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const data = payload[0];
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 shadow-md">
      <p className="text-sm font-medium text-zinc-50">{data.name}</p>
      <p className="text-sm text-zinc-400">
        {data.value} {data.value > 1 ? t.dashboard.statusChartTooltipPlural : t.dashboard.statusChartTooltip}
      </p>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <Skeleton className="h-5 w-48" />
      </CardHeader>
      <CardContent className="flex items-center justify-center">
        <Skeleton className="h-[300px] w-[300px] rounded-full" />
      </CardContent>
    </Card>
  );
}

export function StatusChart() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/applications");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        const data = buildChartData(json.data, t);
        setChartData(data);
      } catch {
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [t]);

  if (isLoading) {
    return <ChartSkeleton />;
  }

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-50">
          {t.dashboard.statusChartTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[300px]">
            <p className="text-sm text-zinc-500">
              {t.dashboard.statusChartEmpty}
            </p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry) => (
                  <Cell
                    key={entry.status}
                    fill={STATUS_HEX_COLORS[entry.status]}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip t={t} />} />
              <Legend
                verticalAlign="bottom"
                formatter={(value: string) => (
                  <span className="text-sm text-zinc-400">{value}</span>
                )}
              />
              <text
                x="50%"
                y="47%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-zinc-50 text-3xl font-bold"
              >
                {total}
              </text>
              <text
                x="50%"
                y="56%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-zinc-500 text-xs"
              >
                {t.common.total}
              </text>
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
