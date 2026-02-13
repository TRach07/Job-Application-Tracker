"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";
import type { AIInsight } from "@/types/follow-up";
import { useTranslation } from "@/hooks/use-translation";

const INSIGHT_CONFIG: Record<
  AIInsight["type"],
  { icon: typeof CheckCircle; colorClass: string; bgClass: string }
> = {
  positive: {
    icon: CheckCircle,
    colorClass: "text-emerald-500",
    bgClass: "bg-emerald-500/10",
  },
  warning: {
    icon: AlertTriangle,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
  suggestion: {
    icon: Lightbulb,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
};

function InsightSkeleton() {
  return (
    <div className="flex gap-3 rounded-lg border p-4">
      <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-32" />
      </div>
    </div>
  );
}

export function InsightsPanel() {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t, locale } = useTranslation();

  const fetchInsights = useCallback(async () => {
    try {
      const res = await fetch(`/api/ai/insights?locale=${locale}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors du chargement");
      setInsights(json.data?.insights ?? json.insights ?? []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    }
  }, [locale]);

  useEffect(() => {
    async function initialLoad() {
      setIsLoading(true);
      await fetchInsights();
      setIsLoading(false);
    }
    initialLoad();
  }, [fetchInsights]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchInsights();
    setIsRefreshing(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t.analytics.insightsTitle}</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={isRefreshing || isLoading}
        >
          <RefreshCw
            className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
          />
          {t.analytics.insightsRefresh}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <>
            <InsightSkeleton />
            <InsightSkeleton />
            <InsightSkeleton />
          </>
        ) : error ? (
          <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : insights.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            {t.analytics.insightsEmpty}
          </div>
        ) : (
          insights.map((insight, index) => {
            const config = INSIGHT_CONFIG[insight.type];
            const Icon = config.icon;

            return (
              <div
                key={index}
                className="flex gap-3 rounded-lg border p-4 transition-colors hover:bg-accent/50"
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
                >
                  <Icon className={`h-5 w-5 ${config.colorClass}`} />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="text-sm font-semibold text-foreground">
                    {insight.title}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {insight.description}
                  </p>
                  {insight.action && (
                    <p className="text-xs font-medium text-primary">
                      {insight.action}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
