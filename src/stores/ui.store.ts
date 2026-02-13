import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Locale } from "@/i18n/types";
import { DEFAULT_LOCALE } from "@/i18n/types";

interface UIStore {
  locale: Locale;
  isSyncing: boolean;
  syncProgress: number;
  setLocale: (locale: Locale) => void;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      isSyncing: false,
      syncProgress: 0,
      setLocale: (locale) => set({ locale }),
      setSyncing: (isSyncing) => set({ isSyncing }),
      setSyncProgress: (syncProgress) => set({ syncProgress }),
    }),
    {
      name: "job-tracker-ui",
      partialize: (state) => ({ locale: state.locale }),
    }
  )
);
