import { create } from "zustand";

interface UIStore {
  isSyncing: boolean;
  syncProgress: number;
  setSyncing: (syncing: boolean) => void;
  setSyncProgress: (progress: number) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  isSyncing: false,
  syncProgress: 0,
  setSyncing: (isSyncing) => set({ isSyncing }),
  setSyncProgress: (syncProgress) => set({ syncProgress }),
}));
