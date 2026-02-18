"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Global keyboard shortcut handler.
 *
 * Navigation (vim-style "go" prefix):
 *   G then D → /dashboard
 *   G then A → /applications
 *   G then F → /follow-ups
 *   G then N → /analytics
 *
 * Actions:
 *   N           → trigger onNewApplication callback (opens new application dialog)
 *   Cmd/Ctrl+K  → handled by GlobalSearch — not duplicated here
 *
 * Shortcuts are ignored when focus is on an input, textarea, or select.
 */
export function useKeyboardShortcuts(options?: {
  onNewApplication?: () => void;
}) {
  const router = useRouter();
  const gPressedRef = useRef(false);
  const gTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      // Ignore modifier combos (Cmd+K handled by GlobalSearch)
      if (e.metaKey || e.ctrlKey || e.altKey) return;

      const key = e.key.toLowerCase();

      // "G" prefix for navigation
      if (key === "g") {
        gPressedRef.current = true;
        // Reset after 1 second if no follow-up key
        if (gTimerRef.current) clearTimeout(gTimerRef.current);
        gTimerRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 1000);
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimerRef.current) clearTimeout(gTimerRef.current);

        switch (key) {
          case "d":
            e.preventDefault();
            router.push("/dashboard");
            return;
          case "a":
            e.preventDefault();
            router.push("/applications");
            return;
          case "f":
            e.preventDefault();
            router.push("/follow-ups");
            return;
          case "n":
            e.preventDefault();
            router.push("/analytics");
            return;
          case "s":
            e.preventDefault();
            router.push("/settings");
            return;
        }
      }

      // "N" → new application
      if (key === "n" && options?.onNewApplication) {
        e.preventDefault();
        options.onNewApplication();
      }
    };

    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimerRef.current) clearTimeout(gTimerRef.current);
    };
  }, [router, options]);
}
