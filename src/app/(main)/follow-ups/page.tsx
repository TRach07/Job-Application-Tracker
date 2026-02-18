"use client";

import { FollowUpList } from "@/components/follow-ups/follow-up-list";
import { useTranslation } from "@/hooks/use-translation";

export default function FollowUpsPage() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold">{t.followUps.title}</h1>
        <p className="text-muted-foreground">
          {t.followUps.subtitle}
        </p>
      </div>

      <FollowUpList />
    </div>
  );
}
