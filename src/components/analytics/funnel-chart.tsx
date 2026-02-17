"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";

interface FunnelStage {
  stage: string;
  count: number;
  conversionRate: number;
}

const STAGE_KEYS = ["applied", "screening", "interview", "offer", "accepted"] as const;

const BAR_COLORS = [
  "hsl(221, 83%, 53%)",  // applied - blue
  "hsl(262, 83%, 58%)",  // screening - violet
  "hsl(36, 92%, 50%)",   // interview - amber
  "hsl(142, 71%, 45%)",  // offer - green
  "hsl(142, 76%, 36%)",  // accepted - dark green
];

export function FunnelChart() {
  const [data, setData] = useState<FunnelStage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useTranslation();

  const stageLabels: Record<string, string> = {
    applied: t.analytics.funnelApplied,
    screening: t.analytics.funnelScreening,
    interview: t.analytics.funnelInterview,
    offer: t.analytics.funnelOffer,
    accepted: t.analytics.funnelAccepted,
  };

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?locale=${locale}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const funnel: Array<{ stage: string; count: number; conversionRate: number }> = json.data.funnel;
        setData(funnel.map((f) => ({
          stage: stageLabels[f.stage] || f.stage,
          count: f.count,
          conversionRate: f.conversionRate,
        })));
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
          <CardTitle>{t.analytics.funnelTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-72 w-full" />
        </CardContent>
      </Card>
    );
  }

  const maxCount = Math.max(...data.map((d) => d.count), 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.funnelTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 || data.every((d) => d.count === 0) ? (
          <div className="flex h-72 items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((stage, i) => {
              const widthPct = Math.max((stage.count / maxCount) * 100, 4);
              return (
                <div key={STAGE_KEYS[i]}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-zinc-300">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-zinc-100">{stage.count}</span>
                      {i > 0 && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${
                          stage.conversionRate >= 50
                            ? "bg-emerald-500/15 text-emerald-400"
                            : stage.conversionRate >= 25
                              ? "bg-amber-500/15 text-amber-400"
                              : "bg-red-500/15 text-red-400"
                        }`}>
                          {stage.conversionRate}%
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-8 w-full rounded bg-zinc-800/50">
                    <div
                      className="h-full rounded transition-all duration-500"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: BAR_COLORS[i],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
