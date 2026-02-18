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
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "@/hooks/use-translation";
import { useAnalyticsUrl } from "./analytics-filters";
import type { ApplicationStatus } from "@prisma/client";

interface CompanyData {
  company: string;
  total: number;
  responded: number;
  responseRate: number;
  bestStatus: ApplicationStatus;
}

export function CompanyTable() {
  const [data, setData] = useState<CompanyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const getUrl = useAnalyticsUrl();

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(getUrl());
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json.data.byCompany || []);
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
          <CardTitle>{t.analytics.companyTableTitle}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.analytics.companyTableTitle}</CardTitle>
        <CardDescription>{t.analytics.companyTableDesc}</CardDescription>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            {t.common.noData}
          </div>
        ) : (
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {/* Header row */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-2 pb-1 border-b border-border">
              <div className="col-span-4">{t.analytics.companyTableCompany}</div>
              <div className="col-span-2 text-center">{t.common.total}</div>
              <div className="col-span-3 text-center">{t.analytics.responseRateTitle}</div>
              <div className="col-span-3 text-center">{t.analytics.companyTableBestStage}</div>
            </div>
            {data.map((row) => (
              <div
                key={row.company}
                className="grid grid-cols-12 gap-2 items-center px-2 py-1.5 rounded hover:bg-accent/50 transition-colors"
              >
                <div className="col-span-4 text-sm font-medium text-foreground truncate" title={row.company}>
                  {row.company}
                </div>
                <div className="col-span-2 text-center">
                  <Badge variant="secondary" className="text-xs">
                    {row.total}
                  </Badge>
                </div>
                <div className="col-span-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-muted">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${row.responseRate}%`,
                          backgroundColor: row.responseRate >= 50
                            ? "hsl(142, 71%, 45%)"
                            : row.responseRate > 0
                              ? "hsl(36, 92%, 50%)"
                              : "hsl(215, 20%, 40%)",
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-8 text-right">{row.responseRate}%</span>
                  </div>
                </div>
                <div className="col-span-3 flex justify-center">
                  <StatusBadge status={row.bestStatus} />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
