"use client";

import { useState, useEffect, useCallback } from "react";
import type { FollowUp } from "@prisma/client";

type FollowUpWithApplication = FollowUp & {
  application: {
    company: string;
    position: string;
    status: string;
  };
};

export function useFollowUps() {
  const [followUps, setFollowUps] = useState<FollowUpWithApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFollowUps = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/follow-ups");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setFollowUps(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const generateFollowUp = async (applicationId: string) => {
    const res = await fetch("/api/follow-ups/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ applicationId }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error);
    await fetchFollowUps();
    return json.data;
  };

  return {
    followUps,
    isLoading,
    error,
    fetchFollowUps,
    generateFollowUp,
  };
}
