"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
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
import { KANBAN_COLUMNS, ARCHIVE_STATUSES } from "@/constants/status";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationCard as ApplicationCardType } from "@/types/application";
import type { CreateApplicationInput } from "@/types/application";
import { KanbanColumn } from "./kanban-column";
import { ApplicationCardComponent } from "./application-card";
import { ApplicationForm } from "./application-form";
import { EmailReviewPanel } from "@/components/emails/email-review-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { RefreshCw, Plus, MailCheck, Search, X, Archive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { KanbanCardSkeleton } from "@/components/shared/loading-skeleton";
import { useTranslation } from "@/hooks/use-translation";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

export function KanbanBoard() {
  const {
    applications,
    isLoading,
    createApplication,
    updateStatus,
    fetchApplications,
  } = useApplications();
  const { sync, isSyncing, errorCode: syncErrorCode } = useEmailSync();
  const { t } = useTranslation();

  const [isFormOpen, setIsFormOpen] = useState(false);
  useKeyboardShortcuts({ onNewApplication: () => setIsFormOpen(true) });
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [pendingReviewCount, setPendingReviewCount] = useState(0);
  const [activeCard, setActiveCard] = useState<ApplicationCardType | null>(
    null
  );

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);

  // Fetch pending review count on mount
  useEffect(() => {
    fetch("/api/emails/review")
      .then((res) => res.json())
      .then((json) => {
        if (json.data) setPendingReviewCount(json.data.length);
      })
      .catch(() => {});
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Filter applications based on search query
  const filteredApplications = useMemo(() => {
    if (!searchQuery.trim()) return applications;

    const query = searchQuery.toLowerCase();
    return applications.filter(
      (app) =>
        app.company.toLowerCase().includes(query) ||
        app.position.toLowerCase().includes(query) ||
        (app.location && app.location.toLowerCase().includes(query))
    );
  }, [applications, searchQuery]);

  const hasActiveFilters = searchQuery.trim().length > 0;

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
        toast.success(t.errors.statusUpdated);
      } catch {
        toast.error(t.errors.statusUpdateError);
      }
    },
    [applications, updateStatus, t]
  );

  const handleSync = useCallback(async () => {
    try {
      const result = await sync();
      const parts = [];
      if (result.emailsFound > 0)
        parts.push(`${result.emailsFound} emails`);
      if (result.emailsFiltered > 0)
        parts.push(`${result.emailsFiltered} filtered`);
      if (result.emailsParsed > 0)
        parts.push(`${result.emailsParsed} parsed`);
      if (result.parseErrors > 0)
        parts.push(`${result.parseErrors} errors`);
      if (result.pendingReviewCount > 0)
        parts.push(`${result.pendingReviewCount} pending review`);

      if (parts.length > 0) {
        const hasErrors = result.parseErrors > 0;
        const toastFn = hasErrors ? toast.warning : toast.success;
        toastFn(`${t.errors.syncSuccess}: ${parts.join(", ")}`);
      } else {
        toast.success(t.errors.syncSuccessNoEmails);
      }

      setPendingReviewCount(result.pendingReviewCount || 0);

      if (result.pendingReviewCount > 0) {
        setIsReviewOpen(true);
      }

      await fetchApplications();
    } catch {
      if (syncErrorCode === "TOKEN_REVOKED" || syncErrorCode === "NO_TOKEN" || syncErrorCode === "REFRESH_FAILED") {
        toast.error(t.errors.syncAuthRevoked, {
          action: {
            label: t.errors.reconnectGoogle,
            onClick: () => window.location.href = "/api/auth/signin",
          },
        });
      } else if (syncErrorCode === "RATE_LIMITED") {
        toast.warning(t.errors.syncRateLimited);
      } else {
        toast.error(t.errors.syncError);
      }
    }
  }, [sync, fetchApplications, syncErrorCode, t]);

  const handleCreateApplication = useCallback(
    async (data: CreateApplicationInput) => {
      try {
        await createApplication(data);
        setIsFormOpen(false);
        toast.success(t.errors.applicationCreated);
      } catch {
        toast.error(t.errors.applicationCreateError);
      }
    },
    [createApplication, t]
  );

  const handleReviewOpenChange = useCallback(
    (open: boolean) => {
      setIsReviewOpen(open);
      if (!open) {
        fetch("/api/emails/review")
          .then((res) => res.json())
          .then((json) => {
            if (json.data) setPendingReviewCount(json.data.length);
          })
          .catch(() => {});
      }
    },
    []
  );

  const getApplicationsForColumn = useCallback(
    (status: ApplicationStatus) => {
      return filteredApplications.filter((app) => app.status === status);
    },
    [filteredApplications]
  );

  const columnsToShow = showArchived
    ? [...KANBAN_COLUMNS, ...ARCHIVE_STATUSES]
    : KANBAN_COLUMNS;

  // Count archived applications
  const archivedCount = useMemo(
    () =>
      filteredApplications.filter((app) =>
        ARCHIVE_STATUSES.includes(app.status)
      ).length,
    [filteredApplications]
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
      <div className="flex items-center justify-end">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsReviewOpen(true)}
          >
            <MailCheck className="h-4 w-4" />
            {t.applications.verificationButton}
            {pendingReviewCount > 0 && (
              <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                {pendingReviewCount}
              </Badge>
            )}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
          >
            <RefreshCw
              className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`}
            />
            {isSyncing ? t.applications.syncingButton : t.applications.syncButton}
          </Button>
          <Button size="sm" onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4" />
            {t.applications.addButton}
          </Button>
        </div>
      </div>

      {/* Search bar and filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t.applications.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <Button
          variant={showArchived ? "secondary" : "outline"}
          size="sm"
          onClick={() => setShowArchived(!showArchived)}
          className="shrink-0"
        >
          <Archive className="h-4 w-4" />
          {t.applications.showArchived}
          {archivedCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {archivedCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSearchQuery("")}
            className="shrink-0 text-muted-foreground"
          >
            <X className="h-4 w-4" />
            {t.applications.clearFilters}
          </Button>
        )}
      </div>

      {/* No results message */}
      {hasActiveFilters && filteredApplications.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-10 w-10 text-muted-foreground mb-3" />
          <h3 className="font-semibold">{t.applications.noResults}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t.applications.noResultsDesc}
          </p>
        </div>
      )}

      {/* Kanban board */}
      {(!hasActiveFilters || filteredApplications.length > 0) && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            className="grid gap-4 min-h-[calc(100vh-16rem)]"
            style={{
              gridTemplateColumns: `repeat(${columnsToShow.length}, minmax(0, 1fr))`,
            }}
          >
            {columnsToShow.map((status) => (
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
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t.applications.newApplicationTitle}</DialogTitle>
            <DialogDescription>
              {t.applications.newApplicationDesc}
            </DialogDescription>
          </DialogHeader>
          <ApplicationForm
            onSubmit={handleCreateApplication}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      <EmailReviewPanel
        open={isReviewOpen}
        onOpenChange={handleReviewOpenChange}
        onApplicationCreated={fetchApplications}
      />
    </div>
  );
}
