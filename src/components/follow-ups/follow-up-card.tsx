"use client";

import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Trash2, Mail } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import type { FollowUp, FollowUpStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";
import type { TranslationDictionary } from "@/i18n/types";

type FollowUpWithApplication = FollowUp & {
  application: {
    company: string;
    position: string;
    status: string;
  };
};

interface FollowUpCardProps {
  followUp: FollowUpWithApplication;
  onDelete?: (id: string) => void;
}

const FOLLOWUP_STATUS_KEYS: Record<FollowUpStatus, keyof TranslationDictionary["followUpStatus"]> = {
  DRAFT: "draft",
  SCHEDULED: "scheduled",
  SENT: "sent",
  CANCELLED: "cancelled",
};

const STATUS_STYLES: Record<FollowUpStatus, string> = {
  DRAFT: "bg-slate-500/10 text-slate-500",
  SCHEDULED: "bg-blue-500/10 text-blue-500",
  SENT: "bg-emerald-500/10 text-emerald-500",
  CANCELLED: "bg-red-500/10 text-red-500",
};

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + "\u2026";
}

function getDisplayDate(followUp: FollowUpWithApplication, t: TranslationDictionary, dateLocale: import("date-fns").Locale): string {
  if (followUp.sentAt) {
    return `${t.followUps.sentOn} ${format(new Date(followUp.sentAt), "dd MMM yyyy", { locale: dateLocale })}`;
  }
  if (followUp.scheduledAt) {
    return `${t.followUps.scheduledOn} ${format(new Date(followUp.scheduledAt), "dd MMM yyyy", { locale: dateLocale })}`;
  }
  return `${t.followUps.createdOn} ${format(new Date(followUp.createdAt), "dd MMM yyyy", { locale: dateLocale })}`;
}

export function FollowUpCard({ followUp, onDelete }: FollowUpCardProps) {
  const { t } = useTranslation();
  const { dateLocale } = useLocaleDate();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(followUp.body);
      toast.success("Contenu copi\u00e9 dans le presse-papiers");
    } catch {
      toast.error("Impossible de copier le contenu");
    }
  };

  const handleDelete = () => {
    onDelete?.(followUp.id);
  };

  return (
    <Card className="transition-colors hover:bg-accent/30">
      <CardContent className="space-y-3 pt-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-semibold text-foreground">
              {followUp.subject || t.followUps.noSubject}
            </h4>
          </div>
          <Badge
            variant="secondary"
            className={`shrink-0 ${STATUS_STYLES[followUp.status]}`}
          >
            {t.followUpStatus[FOLLOWUP_STATUS_KEYS[followUp.status]]}
          </Badge>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateText(followUp.body, 150)}
        </p>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {followUp.application.company} &mdash; {followUp.application.position}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {getDisplayDate(followUp, t, dateLocale)}
          </span>
        </div>
      </CardContent>

      <CardFooter className="gap-2 pt-0">
        <Button variant="outline" size="sm" onClick={handleCopy}>
          <Copy className="mr-2 h-3.5 w-3.5" />
          {t.followUps.copyButton}
        </Button>
        {onDelete && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDelete}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="mr-2 h-3.5 w-3.5" />
            {t.followUps.deleteButton}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
