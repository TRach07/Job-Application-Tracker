"use client";

import { useEffect, useCallback, useRef } from "react";
import { useApplicationStore } from "@/stores/application.store";
import type { ApplicationStatus } from "@prisma/client";
import type { CreateApplicationInput } from "@/types/application";

export function useApplications() {
  const applications = useApplicationStore((s) => s.applications);
  const isLoading = useApplicationStore((s) => s.isLoading);
  const error = useApplicationStore((s) => s.error);
  const setApplications = useApplicationStore((s) => s.setApplications);
  const setLoading = useApplicationStore((s) => s.setLoading);
  const setError = useApplicationStore((s) => s.setError);
  const addApplication = useApplicationStore((s) => s.addApplication);
  const moveApplication = useApplicationStore((s) => s.moveApplication);
  const removeApplication = useApplicationStore((s) => s.removeApplication);

  const hasFetched = useRef(false);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/applications");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setApplications(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue");
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setApplications]);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchApplications();
    }
  }, [fetchApplications]);

  const createApplication = useCallback(
    async (data: CreateApplicationInput) => {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      addApplication(json.data);
      return json.data;
    },
    [addApplication]
  );

  const updateStatus = useCallback(
    async (id: string, status: ApplicationStatus) => {
      moveApplication(id, status);
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        if (!res.ok) {
          fetchApplications();
          throw new Error("Failed to update");
        }
      } catch {
        fetchApplications();
      }
    },
    [moveApplication, fetchApplications]
  );

  const deleteApplication = useCallback(
    async (id: string) => {
      removeApplication(id);
      try {
        const res = await fetch(`/api/applications/${id}`, {
          method: "DELETE",
        });
        if (!res.ok) {
          fetchApplications();
        }
      } catch {
        fetchApplications();
      }
    },
    [removeApplication, fetchApplications]
  );

  return {
    applications,
    isLoading,
    error,
    fetchApplications,
    createApplication,
    updateStatus,
    deleteApplication,
  };
}
