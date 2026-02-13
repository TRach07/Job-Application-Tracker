"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
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
} from "recharts";
import { startOfWeek, format, differenceInWeeks, addWeeks } from "date-fns";
import type { Locale as DateFnsLocale } from "date-fns";
import type { Application } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";

interface WeekData {
  week: string;
  count: number;
}

function computeWeeklyData(applications: Application[], dateLocale: DateFnsLocale): WeekData[] {
  if (applications.length === 0) return [];

  const dates = applications.map((app) => new Date(app.appliedAt));
  const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
  const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));

  const startWeek = startOfWeek(minDate, { weekStartsOn: 1 });
  const endWeek = startOfWeek(maxDate, { weekStartsOn: 1 });
  const totalWeeks = differenceInWeeks(endWeek, startWeek) + 1;

  const weekMap = new Map<string, number>();

  for (let i = 0; i < totalWeeks; i++) {
    const weekStart = addWeeks(startWeek, i);
    const key = format(weekStart, "dd MMM", { locale: dateLocale });
    weekMap.set(key, 0);
  }

  for (const app of applications) {
    const weekStart = startOfWeek(new Date(app.appliedAt), {
      weekStartsOn: 1,
    });
    const key = format(weekStart, "dd MMM", { locale: dateLocale });
    weekMap.set(key, (weekMap.get(key) ?? 0) + 1);
  }

  return Array.from(weekMap.entries()).map(([week, count]) => ({
    week,
    count,
  }));
}

export function TimelineChart() {
  const [data, setData] = useState<WeekData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { dateLocale } = useLocaleDate();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/applications");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const applications: Application[] = json.data;
        setData(computeWeeklyData(applications, dateLocale));
      } catch {
        setData([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [dateLocale]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t.analytics.timelineTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.timelineTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-sm text-muted-foreground">
            {t.analytics.timelineEmpty}
          </div>
        ) : (
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis
                  dataKey="week"
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }}
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
                />
                <Bar
                  dataKey="count"
                  name={t.analytics.timelineBarName}
                  fill="hsl(221, 83%, 53%)"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
