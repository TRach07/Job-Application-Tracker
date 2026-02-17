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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";
import type { PieLabelRenderProps } from "recharts";
import { useTranslation } from "@/hooks/use-translation";

interface SourceData {
  name: string;
  value: number;
  color: string;
}

const COLORS = {
  manual: "hsl(221, 83%, 53%)",
  emailDetected: "hsl(142, 71%, 45%)",
};

export function SourceBreakdown() {
  const [data, setData] = useState<SourceData[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?locale=${locale}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const source = json.data.sourceBreakdown || { manual: 0, emailDetected: 0 };
        const totalCount = source.manual + source.emailDetected;
        setTotal(totalCount);

        setData([
          {
            name: t.analytics.sourceManual,
            value: source.manual,
            color: COLORS.manual,
          },
          {
            name: t.analytics.sourceEmail,
            value: source.emailDetected,
            color: COLORS.emailDetected,
          },
        ]);
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [locale]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.sourceTitle}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <Skeleton className="h-48 w-48 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.sourceTitle}</CardTitle>
        <CardDescription>{t.analytics.sourceDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  dataKey="value"
                  strokeWidth={0}
                  label={(props: PieLabelRenderProps) =>
                    `${props.name ?? ""} ${((Number(props.percent) || 0) * 100).toFixed(0)}%`
                  }
                  labelLine={false}
                >
                  {data.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    borderColor: "hsl(var(--border))",
                    borderRadius: "var(--radius)",
                    color: "hsl(var(--popover-foreground))",
                  }}
                  itemStyle={{ color: "hsl(var(--popover-foreground))" }}
                  formatter={(value) => [value as number, t.common.total]}
                />
                <Legend
                  verticalAlign="bottom"
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: "hsl(215, 20%, 65%)" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
