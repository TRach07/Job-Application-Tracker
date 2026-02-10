import { ApplicationStatus } from "@prisma/client";
import { STATUS_CONFIG } from "@/constants/status";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <Badge
      variant="secondary"
      className={cn(config.bgColor, config.textColor, "font-medium", className)}
    >
      {config.label}
    </Badge>
  );
}
