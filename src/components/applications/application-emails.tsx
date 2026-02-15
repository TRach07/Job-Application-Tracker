"use client";

import type { Email } from "@prisma/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Send } from "lucide-react";
import { useTranslation } from "@/hooks/use-translation";
import { useLocaleDate } from "@/hooks/use-locale-date";

interface ApplicationEmailsProps {
  emails: Email[];
}

export function ApplicationEmails({ emails }: ApplicationEmailsProps) {
  const { t } = useTranslation();
  const { intlLocale } = useLocaleDate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-4 w-4" />
          {t.applicationDetail.emailsTitle}
        </CardTitle>
        <CardDescription>
          {emails.length}{" "}
          {emails.length !== 1
            ? t.applicationDetail.emailsAssociatedPlural
            : t.applicationDetail.emailsAssociated}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {emails.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t.applicationDetail.emailsEmpty}
          </p>
        ) : (
          <div className="space-y-4">
            {emails.map((email) => {
              const emailDate = new Date(
                email.receivedAt
              ).toLocaleDateString(intlLocale, {
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
                      {t.applicationDetail.fromLabel}: {email.from}
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
                              {t.applicationDetail.aiAnalysisTitle}
                            </p>
                            {analysis.company && (
                              <p>
                                {t.applicationDetail.aiCompany}:{" "}
                                {analysis.company}
                              </p>
                            )}
                            {analysis.position && (
                              <p>
                                {t.applicationDetail.aiPosition}:{" "}
                                {analysis.position}
                              </p>
                            )}
                            {analysis.confidence != null && (
                              <p>
                                {t.applicationDetail.aiConfidence}:{" "}
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
  );
}
