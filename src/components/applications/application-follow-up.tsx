"use client";

import { useState } from "react";
import type { GeneratedFollowUp } from "@/types/follow-up";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/hooks/use-translation";

interface ApplicationFollowUpProps {
  applicationId: string;
}

export function ApplicationFollowUp({
  applicationId,
}: ApplicationFollowUpProps) {
  const { t, locale } = useTranslation();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedFollowUp, setGeneratedFollowUp] =
    useState<GeneratedFollowUp | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedFollowUp(null);
    try {
      const res = await fetch("/api/follow-ups/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId, locale }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Generation error");
      setGeneratedFollowUp(json.data);
      toast.success("Follow-up generated successfully");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Generation error";
      toast.error(message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.applicationDetail.followUpTitle}</CardTitle>
        <CardDescription>{t.applicationDetail.followUpDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleGenerate}
          disabled={isGenerating}
          variant="outline"
        >
          <Sparkles className="h-4 w-4" />
          {isGenerating
            ? t.applicationDetail.generating
            : t.applicationDetail.generateFollowUp}
        </Button>
        {generatedFollowUp && (
          <div className="space-y-3 rounded-lg border p-4 bg-muted/30">
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t.applicationDetail.subjectLabel}
              </p>
              <p className="text-sm font-medium">
                {generatedFollowUp.subject}
              </p>
            </div>
            <Separator />
            <div>
              <p className="text-xs text-muted-foreground mb-1">
                {t.applicationDetail.contentLabel}
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {generatedFollowUp.body}
              </p>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t.applicationDetail.toneLabel}
                </p>
                <p className="text-sm capitalize">{generatedFollowUp.tone}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(generatedFollowUp.body);
                  toast.success("Copied to clipboard");
                }}
              >
                {t.common.copy}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
