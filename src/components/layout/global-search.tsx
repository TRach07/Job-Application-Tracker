"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Briefcase,
  BarChart3,
  FileText,
  Settings,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { StatusBadge } from "@/components/shared/status-badge";
import { useTranslation } from "@/hooks/use-translation";
import type { ApplicationStatus } from "@prisma/client";

interface ApplicationResult {
  id: string;
  company: string;
  position: string;
  status: ApplicationStatus;
  location: string | null;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [applications, setApplications] = useState<ApplicationResult[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const fetchedRef = useRef(false);
  const router = useRouter();
  const { t } = useTranslation();

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const loadApplications = useCallback(async () => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    try {
      const res = await fetch("/api/applications");
      const json = await res.json();
      if (res.ok) {
        setApplications(
          (json.data as ApplicationResult[]).map((a) => ({
            id: a.id,
            company: a.company,
            position: a.position,
            status: a.status,
            location: a.location,
          }))
        );
      }
    } catch {
      // Silently fail
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const handleOpen = useCallback(() => {
    setOpen(true);
    loadApplications();
  }, [loadApplications]);

  // Load applications when dialog opens
  useEffect(() => {
    if (open) {
      loadApplications();
    }
  }, [open, loadApplications]);

  const navigate = useCallback(
    (path: string) => {
      setOpen(false);
      router.push(path);
    },
    [router]
  );

  const pages = [
    { name: t.nav.dashboard, icon: LayoutDashboard, path: "/dashboard" },
    { name: t.nav.applications, icon: Briefcase, path: "/applications" },
    { name: t.nav.followUps, icon: FileText, path: "/follow-ups" },
    { name: t.nav.analytics, icon: BarChart3, path: "/analytics" },
    { name: t.nav.settings, icon: Settings, path: "/settings" },
  ];

  return (
    <>
      <Button
        variant="outline"
        className="relative h-9 w-9 sm:w-64 sm:justify-start sm:px-3 sm:py-2"
        onClick={handleOpen}
      >
        <Search className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline-flex text-sm text-muted-foreground">
          {t.search.placeholder}
        </span>
        <kbd className="pointer-events-none hidden sm:inline-flex h-5 items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground ml-auto">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} title={t.search.title}>
        <CommandInput placeholder={t.search.inputPlaceholder} />
        <CommandList>
          <CommandEmpty>{t.search.noResults}</CommandEmpty>

          <CommandGroup heading={t.search.pages}>
            {pages.map((page) => {
              const Icon = page.icon;
              return (
                <CommandItem
                  key={page.path}
                  onSelect={() => navigate(page.path)}
                  className="gap-3"
                >
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span>{page.name}</span>
                </CommandItem>
              );
            })}
          </CommandGroup>

          {isLoaded && applications.length > 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading={t.search.applications}>
                {applications.map((app) => (
                  <CommandItem
                    key={app.id}
                    value={`${app.company} ${app.position} ${app.location ?? ""}`}
                    onSelect={() => navigate(`/applications/${app.id}`)}
                    className="gap-3"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">
                      {app.company.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{app.company}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {app.position}
                        {app.location && ` · ${app.location}`}
                      </p>
                    </div>
                    <StatusBadge status={app.status} className="shrink-0" />
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
