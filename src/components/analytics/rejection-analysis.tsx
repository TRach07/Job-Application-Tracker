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
import { useTranslation } from "@/hooks/use-translation";

interface RejectionData {
  stage: string;
  stageLabel: string;
  count: number;
  percentage: number;
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

export function RejectionAnalysis() {
  const [data, setData] = useState<RejectionData[]>([]);
  const [totalRejections, setTotalRejections] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const { t, locale } = useTranslation();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(`/api/analytics?locale=${locale}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const rejections: Record<string, number> = json.data.rejectionsByStage || {};
        const total = Object.values(rejections).reduce((sum, c) => sum + c, 0);
        setTotalRejections(total);

        const sorted = Object.entries(rejections)
          .map(([stage, count]) => ({
            stage,
            stageLabel: STAGE_LABELS[stage]?.(t) ?? stage,
            count,
            percentage: total > 0 ? Math.round((count / total) * 100) : 0,
          }))
          .sort((a, b) => b.count - a.count);

        setData(sorted);
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
          <CardTitle>{t.analytics.rejectionTitle}</CardTitle>
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
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t.analytics.rejectionTitle}</CardTitle>
            <CardDescription>{t.analytics.rejectionDesc}</CardDescription>
          </div>
          {totalRejections > 0 && (
            <div className="text-right">
              <div className="text-2xl font-bold text-red-400">{totalRejections}</div>
              <div className="text-xs text-muted-foreground">{t.common.total}</div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-48 items-center justify-center text-sm text-muted-foreground">
            {t.analytics.rejectionNoData}
          </div>
        ) : (
          <div className="space-y-3">
            {data.map((item) => (
              <div key={item.stage} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-foreground">{item.stageLabel}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">{item.count}</span>
                    <span className="text-xs text-muted-foreground">({item.percentage}%)</span>
                  </div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: STAGE_COLORS[item.stage] || "hsl(0, 72%, 51%)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
