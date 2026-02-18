"use client";

import { useRouter } from "next/navigation";
import { Sparkles, Plus, Mail, BarChart3, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslation } from "@/hooks/use-translation";
import { useState } from "react";

export function OnboardingBanner() {
  const router = useRouter();
  const { t } = useTranslation();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const steps = [
    {
      icon: Plus,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      title: t.onboarding.step1Title,
      desc: t.onboarding.step1Desc,
      action: () => router.push("/applications"),
    },
    {
      icon: Mail,
      color: "text-violet-500",
      bg: "bg-violet-500/10",
      title: t.onboarding.step2Title,
      desc: t.onboarding.step2Desc,
      action: () => router.push("/applications"),
    },
    {
      icon: BarChart3,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      title: t.onboarding.step3Title,
      desc: t.onboarding.step3Desc,
      action: () => router.push("/analytics"),
    },
  ];

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent animate-in fade-in slide-in-from-top-2 duration-500">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h2 className="text-base font-semibold">{t.onboarding.title}</h2>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 -mt-1 -mr-1"
            onClick={() => setDismissed(true)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mb-5">
          {t.onboarding.subtitle}
        </p>

        <div className="grid gap-3 sm:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <button
                key={i}
                onClick={step.action}
                className="group flex flex-col gap-3 rounded-lg border border-border p-4 text-left transition-all duration-200 hover:border-primary/30 hover:bg-accent/50 hover:shadow-sm"
              >
                <div className="flex items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${step.bg}`}>
                    <Icon className={`h-4 w-4 ${step.color}`} />
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.desc}
                  </p>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              </button>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground text-center">
          {t.onboarding.shortcutHint}
        </p>
      </CardContent>
    </Card>
  );
}
