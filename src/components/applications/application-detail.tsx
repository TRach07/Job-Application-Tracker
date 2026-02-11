"use client";

import { useState, useEffect, useCallback } from "react";
import type { ApplicationStatus } from "@prisma/client";
import type { ApplicationWithRelations } from "@/types/application";
import type { GeneratedFollowUp } from "@/types/follow-up";
import { STATUS_CONFIG } from "@/constants/status";
import { StatusBadge } from "@/components/shared/status-badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  Clock,
  Send,
  ArrowLeft,
  Save,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ApplicationDetailProps {
  applicationId: string;
}

export function ApplicationDetail({ applicationId }: ApplicationDetailProps) {
  const router = useRouter();
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
  const [isGeneratingFollowUp, setIsGeneratingFollowUp] = useState(false);
  const [generatedFollowUp, setGeneratedFollowUp] =
    useState<GeneratedFollowUp | null>(null);

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

  const handleGenerateFollowUp = async () => {
    if (!application) return;
    setIsGeneratingFollowUp(true);
    setGeneratedFollowUp(null);
    try {
      const res = await fetch("/api/follow-ups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur de generation");
      setGeneratedFollowUp(json.data);
      toast.success("Relance generee avec succes");
    } catch {
      toast.error("Erreur lors de la generation de la relance");
    } finally {
      setIsGeneratingFollowUp(false);
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
          {error || "Candidature introuvable"}
        </p>
        <Button variant="outline" onClick={() => router.push("/applications")}>
          <ArrowLeft className="h-4 w-4" />
          Retour aux candidatures
        </Button>
      </div>
    );
  }

  const formattedAppliedAt = new Date(application.appliedAt).toLocaleDateString(
    "fr-FR",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );

  const allStatuses = Object.entries(STATUS_CONFIG) as [
    ApplicationStatus,
    (typeof STATUS_CONFIG)[ApplicationStatus],
  ][];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/applications")}
          >
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{application.company}</h1>
            <p className="text-muted-foreground">{application.position}</p>
          </div>
        </div>
        <StatusBadge status={application.status} className="text-sm" />
      </div>

      <Separator />

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: info cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Application Info Card */}
          <Card>
            <CardHeader>
              <CardTitle>Informations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Entreprise</p>
                    <p className="text-sm font-medium">
                      {application.company}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Date de candidature
                    </p>
                    <p className="text-sm font-medium">{formattedAppliedAt}</p>
                  </div>
                </div>

                {application.location && (
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Localisation
                      </p>
                      <p className="text-sm font-medium">
                        {application.location}
                      </p>
                    </div>
                  </div>
                )}

                {application.salary && (
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Salaire</p>
                      <p className="text-sm font-medium">
                        {application.salary}
                      </p>
                    </div>
                  </div>
                )}

                {application.url && (
                  <div className="flex items-center gap-3">
                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Lien de l&apos;offre
                      </p>
                      <a
                        href={application.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        Voir l&apos;offre
                      </a>
                    </div>
                  </div>
                )}

                {application.contactName && (
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Contact</p>
                      <p className="text-sm font-medium">
                        {application.contactName}
                      </p>
                    </div>
                  </div>
                )}

                {application.contactEmail && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Email du contact
                      </p>
                      <a
                        href={`mailto:${application.contactEmail}`}
                        className="text-sm font-medium text-primary hover:underline"
                      >
                        {application.contactEmail}
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Status Change Card */}
          <Card>
            <CardHeader>
              <CardTitle>Modifier le statut</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedStatus}
                onValueChange={handleStatusChange}
                disabled={isSavingStatus}
              >
                <SelectTrigger className="w-full sm:w-64">
                  <SelectValue placeholder="Selectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {allStatuses.map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Notes Card */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={editableNotes}
                onChange={(e) => setEditableNotes(e.target.value)}
                placeholder="Ajoutez des notes sur cette candidature..."
                rows={5}
              />
              <div className="flex justify-end">
                <Button
                  size="sm"
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                >
                  <Save className="h-4 w-4" />
                  {isSavingNotes ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Follow-up Generation Card */}
          <Card>
            <CardHeader>
              <CardTitle>Relance automatique</CardTitle>
              <CardDescription>
                Generez un email de relance adapte au contexte de votre
                candidature.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleGenerateFollowUp}
                disabled={isGeneratingFollowUp}
                variant="outline"
              >
                <Sparkles className="h-4 w-4" />
                {isGeneratingFollowUp
                  ? "Generation en cours..."
                  : "Generer une relance"}
              </Button>

              {generatedFollowUp && (
                <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Objet</p>
                    <p className="text-sm font-medium">
                      {generatedFollowUp.subject}
                    </p>
                  </div>
                  <Separator />
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Contenu
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {generatedFollowUp.body}
                    </p>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Ton</p>
                      <p className="text-sm capitalize">
                        {generatedFollowUp.tone}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedFollowUp.body);
                        toast.success("Email copie dans le presse-papiers");
                      }}
                    >
                      Copier
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right column: email timeline + status history */}
        <div className="space-y-6">
          {/* Email Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Emails
              </CardTitle>
              <CardDescription>
                {application.emails.length} email
                {application.emails.length !== 1 ? "s" : ""} associe
                {application.emails.length !== 1 ? "s" : ""}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {application.emails.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun email associe a cette candidature.
                </p>
              ) : (
                <div className="space-y-4">
                  {application.emails.map((email) => {
                    const emailDate = new Date(
                      email.receivedAt
                    ).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                    return (
                      <div
                        key={email.id}
                        className="relative pl-4 border-l-2 border-muted-foreground/20"
                      >
                        <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-primary" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">
                            {email.subject}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            De: {email.from}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {emailDate}
                          </p>
                          {email.bodyPreview && (
                            <p className="text-xs text-muted-foreground italic mt-1">
                              {email.bodyPreview}
                            </p>
                          )}
                          {email.aiAnalysis &&
                            typeof email.aiAnalysis === "object" &&
                            "company" in
                              (email.aiAnalysis as Record<string, unknown>) &&
                            (() => {
                              const analysis = email.aiAnalysis as {
                                company?: string;
                                position?: string;
                                confidence?: number;
                              };
                              return (
                                <div className="mt-2 p-2 rounded bg-muted/50 text-xs space-y-0.5">
                                  <p className="font-medium text-primary">
                                    Analyse IA
                                  </p>
                                  {analysis.company && (
                                    <p>Entreprise: {analysis.company}</p>
                                  )}
                                  {analysis.position && (
                                    <p>Poste: {analysis.position}</p>
                                  )}
                                  {analysis.confidence != null && (
                                    <p>
                                      Confiance:{" "}
                                      {Math.round(analysis.confidence * 100)}%
                                    </p>
                                  )}
                                </div>
                              );
                            })()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Historique des statuts
              </CardTitle>
            </CardHeader>
            <CardContent>
              {application.statusHistory.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Aucun changement de statut enregistre.
                </p>
              ) : (
                <div className="space-y-3">
                  {application.statusHistory.map((change) => {
                    const changeDate = new Date(
                      change.changedAt
                    ).toLocaleDateString("fr-FR", {
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
        </div>
      </div>
    </div>
  );
}
