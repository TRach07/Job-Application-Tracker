"use client";

import { useState, useCallback } from "react";
import type { EmailReviewItem, EmailReviewAction } from "@/types/email";

export function useEmailReview() {
  const [queue, setQueue] = useState<EmailReviewItem[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<EmailReviewItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/emails/review");
      const json = await res.json();
      if (res.ok) {
        setQueue(json.data || []);
      } else {
        setError(json.error || "Failed to load review queue");
      }
    } catch {
      setError("Failed to load review queue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchFilteredEmails = useCallback(async () => {
    try {
      const res = await fetch("/api/emails/filtered");
      const json = await res.json();
      if (res.ok) {
        setFilteredEmails(json.data || []);
      } else {
        setError(json.error || "Failed to load filtered emails");
      }
    } catch {
      setError("Failed to load filtered emails");
    }
  }, []);

  const processAction = useCallback(
    async (action: EmailReviewAction) => {
      const res = await fetch("/api/emails/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(action),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      // Remove from queue
      setQueue((prev) => prev.filter((e) => e.id !== action.emailId));

      return json.data;
    },
    []
  );

  const overrideFilter = useCallback(
    async (emailId: string) => {
      const res = await fetch("/api/emails/filtered", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailId }),
      });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      // Remove from filtered list
      setFilteredEmails((prev) => prev.filter((e) => e.id !== emailId));

      // Refresh queue to pick up the new item
      await fetchQueue();

      return json.data;
    },
    [fetchQueue]
  );

  return {
    queue,
    filteredEmails,
    isLoading,
    error,
    fetchQueue,
    fetchFilteredEmails,
    processAction,
    overrideFilter,
  };
}
