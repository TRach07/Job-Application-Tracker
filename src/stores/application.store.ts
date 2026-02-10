import { create } from "zustand";
import type { ApplicationCard } from "@/types/application";
import type { ApplicationStatus } from "@prisma/client";

interface ApplicationStore {
  applications: ApplicationCard[];
  isLoading: boolean;
  error: string | null;
  setApplications: (apps: ApplicationCard[]) => void;
  addApplication: (app: ApplicationCard) => void;
  updateApplication: (id: string, updates: Partial<ApplicationCard>) => void;
  removeApplication: (id: string) => void;
  moveApplication: (id: string, newStatus: ApplicationStatus) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
}

export const useApplicationStore = create<ApplicationStore>((set) => ({
  applications: [],
  isLoading: false,
  error: null,

  setApplications: (applications) => set({ applications }),

  addApplication: (app) =>
    set((state) => ({ applications: [app, ...state.applications] })),

  updateApplication: (id, updates) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, ...updates } : app
      ),
    })),

  removeApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((app) => app.id !== id),
    })),

  moveApplication: (id, newStatus) =>
    set((state) => ({
      applications: state.applications.map((app) =>
        app.id === id ? { ...app, status: newStatus } : app
      ),
    })),

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
