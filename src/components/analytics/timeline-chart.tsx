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
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import { useTranslation } from "@/hooks/use-translation";
import { useAnalyticsUrl } from "./analytics-filters";

interface WeekData {
  week: string;
  count: number;
  avg: number | null;
}

export function TimelineChart() {
  const [data, setData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const getUrl = useAnalyticsUrl();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(getUrl());
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        setData(json.data.timeline || []);
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
          <CardTitle>{t.analytics.timelineTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.timelineTitle}</CardTitle>
        <CardDescription>{t.analytics.timelineDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((d) => d.count === 0) ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            {t.analytics.timelineEmpty}
          </div>
        ) : (
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
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
                />
                <Legend
                  verticalAlign="top"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "hsl(215, 20%, 65%)", paddingBottom: 8 }}
                />
                <Bar
                  dataKey="count"
                  name={t.analytics.timelineBarName}
                  fill="hsl(221, 83%, 53%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
                <Line
                  dataKey="avg"
                  name={t.analytics.timelineAvgName}
                  type="monotone"
                  stroke="hsl(36, 92%, 50%)"
                  strokeWidth={2}
                  dot={false}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
