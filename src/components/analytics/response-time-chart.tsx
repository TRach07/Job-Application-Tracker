"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { useTranslation } from "@/hooks/use-translation";
import { useAnalyticsUrl } from "./analytics-filters";

interface BucketData {
  bucket: string;
  count: number;
}

const BUCKET_COLORS = [
  "hsl(142, 71%, 45%)", // 0-3d - green (fast)
  "hsl(142, 50%, 55%)", // 4-7d - light green
  "hsl(36, 92%, 50%)",  // 8-14d - amber
  "hsl(24, 92%, 50%)",  // 15-30d - orange
  "hsl(0, 72%, 51%)",   // 30d+ - red (slow)
];

export function ResponseTimeChart() {
  const [data, setData] = useState<BucketData[]>([]);
  const [avgDays, setAvgDays] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const getUrl = useAnalyticsUrl();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(getUrl());
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setData(json.data.responseTimeDistribution || []);
        setAvgDays(json.data.avgResponseTimeDays ?? null);
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [getUrl]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.responseTimeTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  const hasData = data.some((d) => d.count > 0);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.analytics.responseTimeTitle}</CardTitle>
            <CardDescription>{t.analytics.responseTimeDesc}</CardDescription>
          </div>
          {avgDays !== null && (
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">{avgDays}d</div>
              <div className="text-xs text-muted-foreground">{t.analytics.responseTimeAvg}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {!hasData ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t.analytics.avgResponseTimeNoData}
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="bucket"
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={30}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  cursor={{ fill: "hsl(215, 20%, 50%, 0.1)" }}
                  formatter={(value) => [value as number, t.analytics.timelineBarName]}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={50}>
                  {data.map((_, index) => (
                    <Cell key={index} fill={BUCKET_COLORS[index] || BUCKET_COLORS[4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
