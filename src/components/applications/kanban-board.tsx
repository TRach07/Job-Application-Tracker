"use client";

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCorners,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useApplications } from "@/hooks/use-applications";
import { useEmailSync } from "@/hooks/use-email-sync";
import { KANBAN_COLUMNS } from "@/constants/status";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationCard as ApplicationCardType } from "@/types/application";
import type { CreateApplicationInput } from "@/types/application";
import { KanbanColumn } from "./kanban-column";
import { ApplicationCardComponent } from "./application-card";
import { ApplicationForm } from "./application-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, Plus } from "lucide-react";
import { toast } from "sonner";
import { KanbanCardSkeleton } from "@/components/shared/loading-skeleton";

export function KanbanBoard() {
  const {
    applications,
    isLoading,
    createApplication,
    updateStatus,
    fetchApplications,
  } = useApplications();
  const { sync, isSyncing } = useEmailSync();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [activeCard, setActiveCard] = useState<ApplicationCardType | null>(
    null
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const card = applications.find((app) => app.id === active.id);
      if (card) {
        setActiveCard(card);
      }
    },
    [applications]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveCard(null);

      if (!over) return;

      const applicationId = active.id as string;
      const newStatus = over.id as ApplicationStatus;

      const currentApp = applications.find((app) => app.id === applicationId);
      if (!currentApp || currentApp.status === newStatus) return;

      try {
        await updateStatus(applicationId, newStatus);
        toast.success("Statut mis a jour");
      } catch {
        toast.error("Erreur lors de la mise a jour du statut");
      }
    },
    [applications, updateStatus]
  );

  const handleSync = useCallback(async () => {
    try {
      const result = await sync();
      toast.success(
        `Synchronisation terminee : ${result.emailsFound} emails trouves, ${result.emailsParsed} traites`
      );
      await fetchApplications();
    } catch {
      toast.error("Erreur lors de la synchronisation des emails");
    }
  }, [sync, fetchApplications]);

  const handleCreateApplication = useCallback(
    async (data: CreateApplicationInput) => {
      try {
        await createApplication(data);
        setIsFormOpen(false);
        toast.success("Candidature ajoutee avec succes");
      } catch {
        toast.error("Erreur lors de la creation de la candidature");
      }
    },
    [createApplication]
  );

  const getApplicationsForColumn = useCallback(
    (status: ApplicationStatus) => {
      return applications.filter((app) => app.status === status);
    },
    [applications]
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-9 w-48 bg-muted animate-pulse rounded-md" />
          <div className="flex gap-2">
            <div className="h-9 w-32 bg-muted animate-pulse rounded-md" />
            <div className="h-9 w-28 bg-muted animate-pulse rounded-md" />
          </div>
        </div>
        <div className="grid grid-cols-5 gap-4">
          {KANBAN_COLUMNS.map((status) => (
            <div key={status} className="space-y-2">
              <div className="h-8 w-full bg-muted animate-pulse rounded-md" />
              <KanbanCardSkeleton />
              <KanbanCardSkeleton />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight">Candidatures</h2>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? "Synchronisation..." : "Sync emails"}
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
             Ajouter
          </Button>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 min-h-[calc(100vh-12rem)]">
          {KANBAN_COLUMNS.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              applications={getApplicationsForColumn(status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <ApplicationCardComponent application={activeCard} isOverlay />
          ) : null}
        </DragOverlay>
      </DndContext>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle candidature</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour ajouter une nouvelle candidature.
            </DialogDescription>
          </DialogHeader>
          <ApplicationForm
            onSubmit={handleCreateApplication}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
