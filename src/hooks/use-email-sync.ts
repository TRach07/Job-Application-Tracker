"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/ui.store";

interface SyncResult {
  emailsFound: number;
  emailsFiltered: number;
  emailsPassed: number;
  emailsParsed: number;
  parseErrors: number;
  pendingReviewCount: number;
}

export function useEmailSync() {
  const { isSyncing, setSyncing } = useUIStore();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = async (): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      const data: SyncResult = {
        emailsFound: json.data.emailsFound,
        emailsFiltered: json.data.emailsFiltered,
        emailsPassed: json.data.emailsPassed,
        emailsParsed: json.data.emailsParsed,
        parseErrors: json.data.parseErrors || 0,
        pendingReviewCount: json.data.pendingReviewCount,
      };

      setResult(data);
      return data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Sync error";
      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return { sync, isSyncing, result, error };
}
