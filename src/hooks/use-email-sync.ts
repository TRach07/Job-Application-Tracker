"use client";

import { useState } from "react";
import { useUIStore } from "@/stores/ui.store";

export function useEmailSync() {
  const { isSyncing, setSyncing } = useUIStore();
  const [result, setResult] = useState<{
    emailsFound: number;
    emailsParsed: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setSyncing(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/emails/sync", { method: "POST" });
      const json = await res.json();

      if (!res.ok) throw new Error(json.error);

      setResult({
        emailsFound: json.data.emailsFound,
        emailsParsed: json.data.emailsParsed,
      });

      return json.data;
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Erreur de synchronisation";
      setError(message);
      throw err;
    } finally {
      setSyncing(false);
    }
  };

  return { sync, isSyncing, result, error };
}
