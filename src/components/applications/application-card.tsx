"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { useRouter } from "next/navigation";
import type { ApplicationCard } from "@/types/application";
import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent } from "@/components/ui/card";
import { Building, MapPin, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocaleDate } from "@/hooks/use-locale-date";

interface ApplicationCardComponentProps {
  application: ApplicationCard;
  isOverlay?: boolean;
}

export function ApplicationCardComponent({
  application,
  isOverlay = false,
}: ApplicationCardComponentProps) {
  const router = useRouter();

  const { intlLocale } = useLocaleDate();

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: application.id,
    });

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
      }
    : undefined;

  const formattedDate = new Date(application.appliedAt).toLocaleDateString(
    intlLocale,
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  );

  const handleClick = () => {
    if (!isDragging) {
      router.push(`/applications/${application.id}`);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={cn(
        "cursor-grab active:cursor-grabbing transition-shadow hover:shadow-md",
        isDragging && "opacity-50",
        isOverlay && "shadow-lg rotate-2 scale-105"
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Building className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <span className="font-semibold text-sm leading-tight truncate">
            {application.company}
          </span>
        </div>

        <p className="text-sm text-muted-foreground truncate pl-6">
          {application.position}
        </p>

        {application.location && (
          <div className="flex items-center gap-2 pl-6">
            <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              {application.location}
            </span>
          </div>
        )}

        <div className="flex items-center gap-2 pl-6">
          <Calendar className="h-3 w-3 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">
            {formattedDate}
          </span>
        </div>

        <div className="pl-6">
          <StatusBadge status={application.status} />
        </div>
      </CardContent>
    </Card>
  );
}
