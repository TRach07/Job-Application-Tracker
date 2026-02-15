"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationWithRelations } from "@/types/application";
import { STATUS_CONFIG, getStatusLabel } from "@/constants/status";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building,
  MapPin,
  Calendar,
  Link as LinkIcon,
  DollarSign,
  User,
  Mail,
  ArrowLeft,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";
import { ApplicationEmails } from "@/components/applications/application-emails";
import { ApplicationStatusHistory } from "@/components/applications/application-status-history";
import { ApplicationFollowUp } from "@/components/applications/application-follow-up";

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter();
  const { t } = useTranslation();
  const { intlLocale } = useLocaleDate();
  const [application, setApplication] =
    useState<ApplicationWithRelations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editableNotes, setEditableNotes] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus | "">(
    ""
  );
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [isSavingStatus, setIsSavingStatus] = useState(false);

  const fetchApplication = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/applications/${applicationId}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de chargement");
      setApplication(json.data);
      setEditableNotes(json.data.notes || "");
      setSelectedStatus(json.data.status);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setIsLoading(false);
    }
  }, [applicationId]);

  useEffect(() => {
    fetchApplication();
  }, [fetchApplication]);

  const handleSaveNotes = async () => {
    if (!application) return;
    setIsSavingNotes(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editableNotes }),
      });
      if (!res.ok) throw new Error("Erreur de sauvegarde");
      const json = await res.json();
      setApplication((prev) =>
        prev ? { ...prev, notes: json.data.notes } : prev
      );
      toast.success("Notes sauvegardees");
    } catch {
      toast.error("Erreur lors de la sauvegarde des notes");
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!application) return;
    const status = newStatus as ApplicationStatus;
    setSelectedStatus(status);
    setIsSavingStatus(true);
    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erreur de mise a jour");
      const json = await res.json();
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              status: json.data.status,
              statusHistory: json.data.statusHistory ?? prev.statusHistory,
            }
          : prev
      );
      toast.success("Statut mis a jour");
    } catch {
      setSelectedStatus(application.status);
      toast.error("Erreur lors de la mise a jour du statut");
    } finally {
      setIsSavingStatus(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-9 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-32 w-full rounded-lg" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-48 w-full rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive text-lg font-medium mb-4">
          {error || t.applicationDetail.notFound}
        </p>
        <Button variant="outline" onClick={() => router.push("/applications")}>
          <ArrowLeft className="h-4 w-4" />
          {t.applicationDetail.backButton}
        </Button>
      </div>
    );
  }

  const formattedAppliedAt = new Date(application.appliedAt).toLocaleDateString(
    intlLocale,
    { day: "numeric", month: "long", year: "numeric" }
  );

  const allStatuses = Object.keys(STATUS_CONFIG) as ApplicationStatus[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/applications")}>
            <ArrowLeft className="h-4 w-4" />
            {t.applicationDetail.backButton}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{application.company}</h1>
            <p className="text-muted-foreground">{application.position}</p>
          </div>
        </div>
        <StatusBadge status={application.status} className="text-sm" />
      </div>

      <Separator />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t.applicationDetail.infoTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.applicationDetail.companyLabel}</p>
                    <p className="text-sm font-medium">{application.company}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">{t.applicationDetail.appliedAtLabel}</p>
                    <p className="text-sm font-medium">{formattedAppliedAt}</p>
                  </div>
                </div>
                {application.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.applicationDetail.locationLabel}</p>
                      <p className="text-sm font-medium">{application.location}</p>
                    </div>
                  </div>
                )}
                {application.salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.applicationDetail.salaryLabel}</p>
                      <p className="text-sm font-medium">{application.salary}</p>
                    </div>
                  </div>
                )}
                {application.url && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.applicationDetail.jobUrlLabel}</p>
                      <a href={application.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
                        {t.applicationDetail.viewOffer}
                      </a>
                    </div>
                  </div>
                )}
                {application.contactName && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.applicationDetail.contactLabel}</p>
                      <p className="text-sm font-medium">{application.contactName}</p>
                    </div>
                  </div>
                )}
                {application.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">{t.applicationDetail.contactEmailLabel}</p>
                      <a href={`mailto:${application.contactEmail}`} className="text-sm font-medium text-primary hover:underline">
                        {application.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.applicationDetail.changeStatusTitle}</CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedStatus} onValueChange={handleStatusChange} disabled={isSavingStatus}>
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder={t.applicationDetail.statusPlaceholder} />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map((key) => (
                    <SelectItem key={key} value={key}>
                      {getStatusLabel(key, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t.applicationDetail.notesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea value={editableNotes} onChange={(e) => setEditableNotes(e.target.value)} placeholder={t.applicationDetail.notesPlaceholder} rows={5} />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleSaveNotes} disabled={isSavingNotes}>
                  <Save className="h-4 w-4" />
                  {isSavingNotes ? t.common.saving : t.common.save}
                </Button>
              </div>
            </CardContent>
          </Card>

          <ApplicationFollowUp applicationId={applicationId} />
        </div>

        <div className="space-y-6">
          <ApplicationEmails emails={application.emails} />
          <ApplicationStatusHistory statusHistory={application.statusHistory} />
        </div>
      </div>
    </div>
  );
}
