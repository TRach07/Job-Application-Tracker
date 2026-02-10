"use client";

import { useDroppable } from "@dnd-kit/core";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationCard as ApplicationCardType } from "@/types/application";
import { STATUS_CONFIG } from "@/constants/status";
import { ApplicationCardComponent } from "./application-card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: ApplicationStatus;
  applications: ApplicationCardType[];
}

export function KanbanColumn({ status, applications }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  });

  const config = STATUS_CONFIG[status];

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border bg-muted/30 transition-colors",
        isOver && "border-primary/50 bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between px-3 py-2 border-b">
        <div className="flex items-center gap-2">
          <div className={cn("h-2.5 w-2.5 rounded-full", config.color)} />
          <h3 className="text-sm font-semibold">{config.label}</h3>
        </div>
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs font-medium">
          {applications.length}
        </span>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="flex flex-col gap-2 min-h-[120px]">
          {applications.length === 0 ? (
            <div className="flex items-center justify-center h-[120px] text-xs text-muted-foreground border border-dashed rounded-md">
              Glissez une candidature ici
            </div>
          ) : (
            applications.map((application) => (
              <ApplicationCardComponent
                key={application.id}
                application={application}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
