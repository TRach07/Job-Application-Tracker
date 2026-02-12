"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Check,
  X,
  Pencil,
  Mail,
  ArrowDownLeft,
  ArrowUpRight,
  Building2,
  Briefcase,
} from "lucide-react";
import type { EmailReviewItem, EmailReviewAction } from "@/types/email";
import type { EmailParseResult } from "@/types/email";

interface EmailReviewCardProps {
  email: EmailReviewItem;
  onAction: (action: EmailReviewAction) => Promise<void>;
  isFiltered?: boolean;
  onOverride?: (emailId: string) => Promise<void>;
}

const STATUS_LABELS: Record<string, string> = {
  APPLIED: "Postule",
  SCREENING: "Preselectio",
  INTERVIEW: "Entretien",
  TECHNICAL: "Technique",
  OFFER: "Offre",
  REJECTED: "Refuse",
};

export function EmailReviewCard({
  email,
  onAction,
  isFiltered,
  onOverride,
}: EmailReviewCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [editCompany, setEditCompany] = useState("");
  const [editPosition, setEditPosition] = useState("");
  const [editStatus, setEditStatus] = useState("APPLIED");

  const ai = email.aiAnalysis as EmailParseResult | null;
  const date = new Date(email.receivedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      await onAction({
        emailId: email.id,
        action: "approve",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      await onAction({
        emailId: email.id,
        action: "reject",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEditApprove = async () => {
    setIsProcessing(true);
    try {
      await onAction({
        emailId: email.id,
        action: "edit_approve",
        editedCompany: editCompany || undefined,
        editedPosition: editPosition || undefined,
        editedStatus: editStatus || undefined,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOverride = async () => {
    if (!onOverride) return;
    setIsProcessing(true);
    try {
      await onOverride(email.id);
    } finally {
      setIsProcessing(false);
    }
  };

  const startEditing = () => {
    setEditCompany(ai?.company || "");
    setEditPosition(ai?.position || "");
    setEditStatus(ai?.status || "APPLIED");
    setIsEditing(true);
  };

  return (
    <Card className="border-l-4 border-l-primary/30">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{email.subject}</p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
              {email.isInbound ? (
                <ArrowDownLeft className="h-3 w-3 text-blue-500" />
              ) : (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              )}
              <span className="truncate">{email.from}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
          </div>
          {ai && ai.confidence > 0 && (
            <Badge
              variant={ai.confidence >= 0.85 ? "default" : "secondary"}
              className="text-xs shrink-0"
            >
              {Math.round(ai.confidence * 100)}%
            </Badge>
          )}
        </div>

        {/* Body preview */}
        <p className="text-xs text-muted-foreground line-clamp-2">
          {email.bodyPreview}
        </p>

        {/* AI analysis */}
        {ai && !isFiltered && (
          <div className="rounded-md bg-muted/50 p-2.5 space-y-1.5">
            {ai.company && (
              <div className="flex items-center gap-1.5 text-xs">
                <Building2 className="h-3 w-3 text-primary" />
                <span className="font-medium">{ai.company}</span>
              </div>
            )}
            {ai.position && (
              <div className="flex items-center gap-1.5 text-xs">
                <Briefcase className="h-3 w-3 text-primary" />
                <span>{ai.position}</span>
              </div>
            )}
            {ai.status && (
              <div className="flex items-center gap-1.5 text-xs">
                <Mail className="h-3 w-3 text-primary" />
                <span>{STATUS_LABELS[ai.status] || ai.status}</span>
              </div>
            )}
            {ai.rejection_reason && (
              <p className="text-xs text-muted-foreground italic">
                {ai.rejection_reason}
              </p>
            )}
          </div>
        )}

        {/* Filter reason */}
        {isFiltered && email.filterReason && (
          <div className="rounded-md bg-orange-50 dark:bg-orange-950/30 p-2.5">
            <p className="text-xs text-orange-700 dark:text-orange-400">
              {email.filterReason}
            </p>
          </div>
        )}

        {/* Edit form */}
        {isEditing && (
          <div className="space-y-2 rounded-md border p-2.5">
            <Input
              placeholder="Entreprise"
              value={editCompany}
              onChange={(e) => setEditCompany(e.target.value)}
              className="h-8 text-xs"
            />
            <Input
              placeholder="Poste"
              value={editPosition}
              onChange={(e) => setEditPosition(e.target.value)}
              className="h-8 text-xs"
            />
            <Select value={editStatus} onValueChange={setEditStatus}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                className="h-7 text-xs flex-1"
                onClick={handleEditApprove}
                disabled={isProcessing}
              >
                <Check className="h-3 w-3 mr-1" />
                Confirmer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setIsEditing(false)}
              >
                Annuler
              </Button>
            </div>
          </div>
        )}

        {/* Actions */}
        {!isEditing && !isFiltered && (
          <div className="flex flex-col gap-1.5">
            <Button
              size="sm"
              className="h-8 text-xs w-full"
              onClick={handleApprove}
              disabled={isProcessing}
            >
              <Check className="h-3.5 w-3.5 mr-1" />
              Approuver
            </Button>
            <div className="flex gap-1.5">
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1"
                onClick={startEditing}
                disabled={isProcessing}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                Modifier
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 text-xs flex-1 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                onClick={handleReject}
                disabled={isProcessing}
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Rejeter
              </Button>
            </div>
          </div>
        )}

        {/* Override action for filtered emails */}
        {isFiltered && onOverride && (
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs w-full"
            onClick={handleOverride}
            disabled={isProcessing}
          >
            Reprocesser avec l'IA
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
