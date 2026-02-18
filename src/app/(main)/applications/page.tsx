"use client";

import { KanbanBoard } from "@/components/applications/kanban-board";
import { ExportButtons } from "@/components/applications/export-buttons";
import { useTranslation } from "@/hooks/use-translation";

export default function ApplicationsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t.applications.title}</h1>
          <p className="text-muted-foreground">
            {t.applications.subtitle}
          </p>
        </div>
        <ExportButtons />
      </div>

      <KanbanBoard />
    </div>
  );
}
