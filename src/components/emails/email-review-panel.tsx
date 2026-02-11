"use client";

import { useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useEmailReview } from "@/hooks/use-email-review";
import { EmailReviewCard } from "./email-review-card";
import { toast } from "sonner";
import { Inbox, Filter } from "lucide-react";

interface EmailReviewPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationCreated?: () => void;
}

export function EmailReviewPanel({
  open,
  onOpenChange,
  onApplicationCreated,
}: EmailReviewPanelProps) {
  const {
    queue,
    filteredEmails,
    isLoading,
    fetchQueue,
    fetchFilteredEmails,
    processAction,
    overrideFilter,
  } = useEmailReview();

  useEffect(() => {
    if (open) {
      fetchQueue();
      fetchFilteredEmails();
    }
  }, [open, fetchQueue, fetchFilteredEmails]);

  const handleAction = async (
    action: Parameters<typeof processAction>[0]
  ) => {
    try {
      const result = await processAction(action);
      if (result.action === "created") {
        toast.success(`Candidature creee : ${result.company}`);
        onApplicationCreated?.();
      } else if (result.action === "linked") {
        toast.success(`Email lie a : ${result.company}`);
        onApplicationCreated?.();
      } else {
        toast.success("Email rejete");
      }
    } catch {
      toast.error("Erreur lors du traitement");
    }
  };

  const handleOverride = async (emailId: string) => {
    try {
      await overrideFilter(emailId);
      toast.success("Email reprocesse avec l'IA");
    } catch {
      toast.error("Erreur lors du reprocessing");
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <SheetHeader className="p-6 pb-0">
          <SheetTitle>Verification des emails</SheetTitle>
          <SheetDescription>
            Verifiez les emails detectes avant de creer des candidatures.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="review" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="review" className="flex items-center gap-1.5">
              <Inbox className="h-3.5 w-3.5" />
              A verifier
              {queue.length > 0 && (
                <Badge variant="default" className="ml-1 h-5 px-1.5 text-xs">
                  {queue.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="filtered" className="flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5" />
              Filtres
              {filteredEmails.length > 0 && (
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 px-1.5 text-xs"
                >
                  {filteredEmails.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="review" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-3">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 bg-muted animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                ) : queue.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Inbox className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun email a verifier</p>
                    <p className="text-xs mt-1">
                      Synchronisez vos emails pour commencer.
                    </p>
                  </div>
                ) : (
                  queue.map((email) => (
                    <EmailReviewCard
                      key={email.id}
                      email={email}
                      onAction={handleAction}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="filtered" className="flex-1 min-h-0 mt-0">
            <ScrollArea className="h-full">
              <div className="p-6 space-y-3">
                {filteredEmails.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Filter className="h-10 w-10 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">Aucun email filtre</p>
                  </div>
                ) : (
                  filteredEmails.map((email) => (
                    <EmailReviewCard
                      key={email.id}
                      email={email}
                      onAction={handleAction}
                      isFiltered
                      onOverride={handleOverride}
                    />
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
