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

export type SyncErrorCode = "TOKEN_REVOKED" | "REFRESH_FAILED" | "NO_TOKEN" | "RATE_LIMITED" | null;

export function useEmailSync() {
  const { isSyncing, setSyncing } = useUIStore();
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<SyncErrorCode>(null);

  const sync = async (): Promise<SyncResult> => {
    setSyncing(true);
    setError(null);
    setErrorCode(null);
    setResult(null);

    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) {
        const code = json.code as SyncErrorCode ?? null;
        setErrorCode(res.status === 429 ? "RATE_LIMITED" : code);
        throw new Error(json.error || "Sync failed");
      }

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

  return { sync, isSyncing, result, error, errorCode };
}
