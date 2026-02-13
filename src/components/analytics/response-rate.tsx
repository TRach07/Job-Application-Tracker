"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { Application } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";

const RESPONDED_STATUSES = [
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
];

const COLORS = {
  responded: "hsl(142, 71%, 45%)",
  notResponded: "hsl(215, 20%, 45%)",
};

export function ResponseRate() {
  const [rate, setRate] = useState<number>(0);
  const [chartData, setChartData] = useState<
    { name: string; value: number }[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/applications");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const applications: Application[] = json.data;
        const total = applications.length;

        if (total === 0) {
          setRate(0);
          setChartData([
            { name: t.analytics.withResponse, value: 0 },
            { name: t.analytics.withoutResponse, value: 1 },
          ]);
          return;
        }

        const responded = applications.filter((app) =>
          RESPONDED_STATUSES.includes(app.status)
        ).length;
        const notResponded = total - responded;
        const percentage = Math.round((responded / total) * 100);

        setRate(percentage);
        setChartData([
          { name: t.analytics.withResponse, value: responded },
          { name: t.analytics.withoutResponse, value: notResponded },
        ]);
      } catch {
        setRate(0);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [t]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.responseRateTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center gap-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <Skeleton className="h-12 w-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.responseRateTitle}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center gap-6">
        <div className="h-28 w-28">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={30}
                outerRadius={50}
                dataKey="value"
                strokeWidth={0}
              >
                <Cell fill={COLORS.responded} />
                <Cell fill={COLORS.notResponded} />
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
                itemStyle={{ color: "hsl(var(--popover-foreground))" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-4xl font-bold text-foreground">
            {rate}%
          </span>
          <span className="text-sm text-muted-foreground">
            {t.analytics.responseRateLabel}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
