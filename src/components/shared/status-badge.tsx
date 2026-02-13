"use client";

import { ApplicationStatus } from "@prisma/client";
import { STATUS_CONFIG, getStatusLabel } from "@/constants/status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/use-translation";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="secondary"
      className={cn(config.bgColor, config.textColor, "font-medium", className)}
    >
      {getStatusLabel(status, t)}
    </Badge>
  );
}
