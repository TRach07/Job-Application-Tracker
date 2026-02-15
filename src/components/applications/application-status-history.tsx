"use client";

import type { StatusChange } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import { Clock } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";

interface ApplicationStatusHistoryProps {
  statusHistory: StatusChange[];
}

export function ApplicationStatusHistory({
  statusHistory,
}: ApplicationStatusHistoryProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocaleDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          {t.applicationDetail.statusHistoryTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {statusHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t.applicationDetail.statusHistoryEmpty}
          </p>
        ) : (
          <div className="space-y-3">
            {statusHistory.map((change) => {
              const changeDate = new Date(
                change.changedAt
              ).toLocaleDateString(intlLocale, {
                day: "numeric",
                month: "short",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <div
                  key={change.id}
                  className="flex items-start gap-3 text-sm"
                >
                  <div className="flex flex-col items-center gap-1">
                    <StatusBadge status={change.fromStatus} />
                    <span className="text-xs text-muted-foreground">
                      &darr;
                    </span>
                    <StatusBadge status={change.toStatus} />
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    {changeDate}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
