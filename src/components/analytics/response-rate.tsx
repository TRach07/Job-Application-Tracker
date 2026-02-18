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
import { useTranslation } from "@/hooks/use-translation";
import { useAnalyticsUrl } from "./analytics-filters";

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
  const getUrl = useAnalyticsUrl();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(getUrl());
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const { responseRate, total, statusDistribution } = json.data;
        const withResponse = Object.entries(statusDistribution as Record<string, number>)
          .filter(([s]) => s !== "APPLIED" && s !== "NO_RESPONSE")
          .reduce((sum, [, c]) => sum + c, 0);
        const withoutResponse = total - withResponse;

        setRate(responseRate);
        setChartData([
          { name: t.analytics.withResponse, value: withResponse },
          { name: t.analytics.withoutResponse, value: withoutResponse || (total === 0 ? 1 : 0) },
        ]);
      } catch {
        setRate(0);
        setChartData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getUrl]);

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
