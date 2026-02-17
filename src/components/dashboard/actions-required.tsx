"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  AlertTriangle,
  Send,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useTranslation } from "@/hooks/use-translation";
import type { ApplicationStatus } from "@prisma/client";

interface Notification {
  id: string;
  type: "stale_application" | "upcoming_interview" | "follow_up_reminder";
  priority: "high" | "medium" | "low";
  applicationId: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  daysSince: number;
}

const TYPE_CONFIG = {
  stale_application: {
    icon: Clock,
    colorClass: "text-amber-500",
    bgClass: "bg-amber-500/10",
  },
  upcoming_interview: {
    icon: AlertTriangle,
    colorClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
  },
  follow_up_reminder: {
    icon: Send,
    colorClass: "text-violet-500",
    bgClass: "bg-violet-500/10",
  },
} as const;

const PRIORITY_BORDER = {
  high: "border-l-red-500",
  medium: "border-l-amber-500",
  low: "border-l-border",
} as const;

function ActionsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </CardContent>
    </Card>
  );
}

export function ActionsRequired() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const router = useRouter();

  useEffect(() => {
    async function fetchActions() {
      try {
        const res = await fetch("/api/notifications");
        const json = await res.json();
        if (res.ok) {
          setNotifications(json.data ?? []);
        }
      } catch {
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchActions();
  }, []);

  if (isLoading) {
    return <ActionsSkeleton />;
  }

  const getLabel = (n: Notification): string => {
    switch (n.type) {
      case "stale_application":
        return t.notifications.staleMessage
          .replace("{company}", n.company)
          .replace("{days}", String(n.daysSince));
      case "upcoming_interview":
        return t.notifications.interviewMessage
          .replace("{company}", n.company)
          .replace("{days}", String(n.daysSince));
      case "follow_up_reminder":
        return t.notifications.followUpMessage
          .replace("{company}", n.company)
          .replace("{days}", String(n.daysSince));
    }
  };

  const getActionLabel = (n: Notification): string => {
    switch (n.type) {
      case "stale_application":
        return t.dashboard.actionView;
      case "upcoming_interview":
        return t.dashboard.actionPrepare;
      case "follow_up_reminder":
        return t.dashboard.actionFollowUp;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-card-foreground">
            {t.dashboard.actionsTitle}
          </CardTitle>
          {notifications.length > 0 && (
            <span className="text-xs text-muted-foreground">
              {notifications.length} {t.dashboard.actionsPending}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CheckCircle2 className="mb-3 h-10 w-10 text-emerald-500 opacity-60" />
            <p className="text-sm font-medium text-foreground">
              {t.dashboard.actionsAllClear}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {t.dashboard.actionsAllClearDesc}
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {notifications.slice(0, 8).map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;

              return (
                <div
                  key={n.id}
                  className={`flex items-center gap-3 rounded-lg border border-border border-l-[3px] ${PRIORITY_BORDER[n.priority]} p-3 transition-colors hover:bg-accent/50`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
                  >
                    <Icon className={`h-4 w-4 ${config.colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.company} — {n.position}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {getLabel(n)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0 text-xs gap-1"
                    onClick={() => router.push(`/applications/${n.applicationId}`)}
                  >
                    {getActionLabel(n)}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
