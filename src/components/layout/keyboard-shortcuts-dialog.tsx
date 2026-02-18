"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";

interface ShortcutRowProps {
  keys: string[];
  label: string;
}

function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-1">
        {keys.map((k, i) => (
          <kbd
            key={i}
            className="inline-flex h-6 min-w-6 items-center justify-center rounded border border-border bg-muted px-1.5 text-xs font-mono font-medium text-foreground"
          >
            {k}
          </kbd>
        ))}
      </div>
    </div>
  );
}

export function KeyboardShortcutsDialog() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      )
        return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "?") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{t.shortcuts.title}</DialogTitle>
        </DialogHeader>

        <div className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {t.shortcuts.navigation}
          </p>
          <div className="divide-y divide-border">
            <ShortcutRow keys={["G", "D"]} label={t.shortcuts.goToDashboard} />
            <ShortcutRow keys={["G", "A"]} label={t.shortcuts.goToApplications} />
            <ShortcutRow keys={["G", "F"]} label={t.shortcuts.goToFollowUps} />
            <ShortcutRow keys={["G", "N"]} label={t.shortcuts.goToAnalytics} />
            <ShortcutRow keys={["G", "S"]} label={t.shortcuts.goToSettings} />
          </div>
        </div>

        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
            {t.shortcuts.actions}
          </p>
          <div className="divide-y divide-border">
            <ShortcutRow keys={["N"]} label={t.shortcuts.newApplication} />
            <ShortcutRow keys={["⌘", "K"]} label={t.shortcuts.openSearch} />
            <ShortcutRow keys={["?"]} label={t.shortcuts.title} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
