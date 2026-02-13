"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/shared/empty-state";
import { FollowUpCard } from "@/components/follow-ups/follow-up-card";
import { useFollowUps } from "@/hooks/use-follow-ups";
import { MailX } from "lucide-react";
import { toast } from "sonner";
import type { FollowUpStatus } from "@prisma/client";
import { useTranslation } from "@/hooks/use-translation";

const TAB_KEYS: { value: FollowUpStatus; key: "tabDrafts" | "tabScheduled" | "tabSent" }[] = [
  { value: "DRAFT", key: "tabDrafts" },
  { value: "SCHEDULED", key: "tabScheduled" },
  { value: "SENT", key: "tabSent" },
];

function FollowUpListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-3/4" />
          <div className="flex gap-2">
            <Skeleton className="h-5 w-32 rounded-full" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FollowUpList() {
  const { followUps, isLoading, fetchFollowUps } = useFollowUps();
  const [activeTab, setActiveTab] = useState<string>("DRAFT");
  const { t } = useTranslation();

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        let errorMessage = "Erreur lors de la suppression";
        try {
          const json = await res.json();
          errorMessage = json.error || errorMessage;
        } catch {
          // Response was not JSON (e.g. HTML 404)
        }
        throw new Error(errorMessage);
      }
      toast.success("Relance supprim\u00e9e");
      await fetchFollowUps();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Erreur lors de la suppression"
      );
    }
  };

  const filteredFollowUps = followUps.filter(
    (fu) => fu.status === activeTab
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.followUps.listTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TAB_KEYS.map((tab) => {
              const count = followUps.filter(
                (fu) => fu.status === tab.value
              ).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {t.followUps[tab.key]}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TAB_KEYS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {isLoading ? (
                <FollowUpListSkeleton />
              ) : filteredFollowUps.length === 0 ? (
                <EmptyState
                  icon={MailX}
                  title={t.followUps.emptyTitle}
                  description={t.followUps.emptyDesc}
                />
              ) : (
                <div className="space-y-3">
                  {filteredFollowUps.map((followUp) => (
                    <FollowUpCard
                      key={followUp.id}
                      followUp={followUp}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
