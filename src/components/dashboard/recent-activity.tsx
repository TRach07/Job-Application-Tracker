"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns/formatDistanceToNow";
import { Briefcase } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/shared/status-badge";
import { EmptyState } from "@/components/shared/empty-state";
import type { ApplicationStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";

interface RecentApplication {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
}

function ActivitySkeleton() {
  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

export function RecentActivity() {
  const [applications, setApplications] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const { dateLocale } = useLocaleDate();

  useEffect(() => {
    async function fetchRecent() {
      try {
        const res = await fetch("/api/applications");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);

        const recent = (json.data as RecentApplication[]).slice(0, 5);
        setApplications(recent);
      } catch {
        setApplications([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecent();
  }, []);

  if (isLoading) {
    return <ActivitySkeleton />;
  }

  return (
    <Card className="bg-zinc-950 border-zinc-800">
      <CardHeader>
        <CardTitle className="text-zinc-50">
          {t.dashboard.recentActivityTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {applications.length === 0 ? (
          <EmptyState
            icon={Briefcase}
            title={t.dashboard.recentActivityEmpty}
            description={t.dashboard.recentActivityEmptyDesc}
          />
        ) : (
          <div className="space-y-4">
            {applications.map((app) => (
              <div
                key={app.id}
                className="flex items-center justify-between gap-4 rounded-lg border border-zinc-800 p-3 transition-colors hover:bg-zinc-900/50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-sm font-semibold text-zinc-300">
                    {app.company.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-50 truncate">
                      {app.company}
                    </p>
                    <p className="text-xs text-zinc-500 truncate">
                      {app.position}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <StatusBadge status={app.status} />
                  <span className="text-xs text-zinc-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(app.updatedAt), {
                      addSuffix: true,
                      locale: dateLocale,
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
