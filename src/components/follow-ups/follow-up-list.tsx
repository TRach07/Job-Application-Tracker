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

const TABS: { value: FollowUpStatus; label: string }[] = [
  { value: "DRAFT", label: "Brouillons" },
  { value: "SCHEDULED", label: "Programm\u00e9es" },
  { value: "SENT", label: "Envoy\u00e9es" },
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

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/follow-ups/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erreur lors de la suppression");
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
        <CardTitle>Mes relances</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {TABS.map((tab) => {
              const count = followUps.filter(
                (fu) => fu.status === tab.value
              ).length;
              return (
                <TabsTrigger key={tab.value} value={tab.value}>
                  {tab.label}
                  {count > 0 && (
                    <span className="ml-1.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                      {count}
                    </span>
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>

          {TABS.map((tab) => (
            <TabsContent key={tab.value} value={tab.value}>
              {isLoading ? (
                <FollowUpListSkeleton />
              ) : filteredFollowUps.length === 0 ? (
                <EmptyState
                  icon={MailX}
                  title="Aucune relance"
                  description={`Vous n'avez aucune relance dans la cat\u00e9gorie "${tab.label}".`}
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
