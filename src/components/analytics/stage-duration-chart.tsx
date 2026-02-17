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
  LabelList,
} from "recharts";
import { useTranslation } from "@/hooks/use-translation";

interface StageDuration {
  stage: string;
  avgDays: number;
  count: number;
}

const STAGE_LABELS: Record<string, (t: ReturnType<typeof useTranslation>["t"]) => string> = {
  APPLIED: (t) => t.analytics.funnelApplied,
  SCREENING: (t) => t.analytics.funnelScreening,
  INTERVIEW: (t) => t.analytics.funnelInterview,
  TECHNICAL: (t) => t.status.technical,
  OFFER: (t) => t.analytics.funnelOffer,
};

const STAGE_COLORS: Record<string, string> = {
  APPLIED: "hsl(221, 83%, 53%)",
  SCREENING: "hsl(262, 83%, 58%)",
  INTERVIEW: "hsl(36, 92%, 50%)",
  TECHNICAL: "hsl(45, 93%, 47%)",
  OFFER: "hsl(142, 71%, 45%)",
};

export function StageDurationChart() {
  const [data, setData] = useState<StageDuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?locale=${locale}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const durations: Array<{ stage: string; avgDays: number; count: number }> =
          json.data.avgStageDurations || [];
        setData(
          durations.map((d) => ({
            stage: STAGE_LABELS[d.stage]?.(t) ?? d.stage,
            avgDays: d.avgDays,
            count: d.count,
          }))
        );
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [t, locale]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.stageDurationTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.stageDurationTitle}</CardTitle>
        <CardDescription>{t.analytics.stageDurationDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t.analytics.avgResponseTimeNoData}
          </div>
        ) : (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 10, right: 40 }}>
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  unit="d"
                />
                <YAxis
                  type="category"
                  dataKey="stage"
                  width={90}
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  formatter={(value) => [`${value}d`, t.analytics.stageDurationTitle]}
                  labelStyle={{ color: "hsl(var(--popover-foreground))" }}
                  cursor={{ fill: "hsl(215, 20%, 50%, 0.1)" }}
                />
                <Bar dataKey="avgDays" maxBarSize={24} radius={[0, 4, 4, 0]}>
                  {data.map((entry, index) => {
                    const originalStage = Object.entries(STAGE_LABELS).find(
                      ([, fn]) => fn(t) === entry.stage
                    )?.[0];
                    return (
                      <Cell
                        key={index}
                        fill={STAGE_COLORS[originalStage || ""] || "hsl(215, 20%, 50%)"}
                      />
                    );
                  })}
                  <LabelList
                    dataKey="avgDays"
                    position="right"
                    formatter={(v) => `${v}d`}
                    style={{ fill: "hsl(215, 20%, 75%)", fontSize: 11 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
