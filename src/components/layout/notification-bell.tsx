"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Clock, AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTranslation } from "@/hooks/use-translation";
import { useRouter } from "next/navigation";
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

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { t } = useTranslation();
  const router = useRouter();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      const json = await res.json();
      if (res.ok) {
        setNotifications(json.data ?? []);
      }
    } catch {
      // Silently fail — bell just shows 0
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNotifications, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const count = notifications.length;

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

  const handleClick = (n: Notification) => {
    router.push(`/applications/${n.applicationId}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          {!isLoading && count > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto p-0">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">{t.notifications.title}</h3>
          <p className="text-xs text-muted-foreground">
            {count === 0
              ? t.notifications.empty
              : t.notifications.count.replace("{count}", String(count))}
          </p>
        </div>
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Bell className="mb-2 h-8 w-8 opacity-30" />
            <p className="text-sm">{t.notifications.empty}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {notifications.map((n) => {
              const config = TYPE_CONFIG[n.type];
              const Icon = config.icon;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className="flex w-full gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50"
                >
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bgClass}`}
                  >
                    <Icon className={`h-4 w-4 ${config.colorClass}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {n.company} — {n.position}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getLabel(n)}
                    </p>
                  </div>
                  {n.priority === "high" && (
                    <span className="shrink-0 mt-1 h-2 w-2 rounded-full bg-red-500" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
