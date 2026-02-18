"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { CalendarDays, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "@/hooks/use-translation";
import { getStatusLabel } from "@/constants/status";
import type { ApplicationStatus } from "@prisma/client";

// --- Filter types ---
export interface AnalyticsFilters {
  period: string; // "all" | "7d" | "30d" | "90d" | "6m" | "1y"
  status: string; // "all" | ApplicationStatus
  source: string; // "all" | "MANUAL" | "EMAIL_DETECTED"
}

const DEFAULT_FILTERS: AnalyticsFilters = {
  period: "all",
  status: "all",
  source: "all",
};

// --- Context ---
interface AnalyticsFilterContextValue {
  filters: AnalyticsFilters;
  setFilters: (filters: AnalyticsFilters) => void;
  queryString: string;
  activeCount: number;
}

const AnalyticsFilterContext = createContext<AnalyticsFilterContextValue>({
  filters: DEFAULT_FILTERS,
  setFilters: () => {},
  queryString: "",
  activeCount: 0,
});

export function useAnalyticsFilters() {
  return useContext(AnalyticsFilterContext);
}

export function AnalyticsFilterProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [filters, setFilters] = useState<AnalyticsFilters>(DEFAULT_FILTERS);

  const activeCount = useMemo(
    () =>
      Object.entries(filters).filter(
        ([, v]) => v !== "all"
      ).length,
    [filters]
  );

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.period !== "all") params.set("period", filters.period);
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.source !== "all") params.set("source", filters.source);
    return params.toString();
  }, [filters]);

  return (
    <AnalyticsFilterContext.Provider
      value={{ filters, setFilters, queryString, activeCount }}
    >
      {children}
    </AnalyticsFilterContext.Provider>
  );
}

/**
 * Builds the full analytics API URL with locale and active filters.
 */
export function useAnalyticsUrl() {
  const { queryString } = useAnalyticsFilters();
  const { locale } = useTranslation();

  return useCallback(
    (base = "/api/analytics") => {
      const params = new URLSearchParams(queryString);
      params.set("locale", locale);
      return `${base}?${params.toString()}`;
    },
    [queryString, locale]
  );
}

// --- Filter bar UI ---
const STATUSES: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
];

export function AnalyticsFilterBar() {
  const { filters, setFilters, activeCount } = useAnalyticsFilters();
  const { t } = useTranslation();

  const update = (key: keyof AnalyticsFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const clearAll = () => setFilters(DEFAULT_FILTERS);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Filter className="h-4 w-4" />
        {t.analyticsFilters.label}
      </div>

      {/* Period filter */}
      <Select value={filters.period} onValueChange={(v) => update("period", v)}>
        <SelectTrigger className="h-8 w-[140px] text-xs">
          <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.analyticsFilters.allTime}</SelectItem>
          <SelectItem value="7d">{t.analyticsFilters.last7d}</SelectItem>
          <SelectItem value="30d">{t.analyticsFilters.last30d}</SelectItem>
          <SelectItem value="90d">{t.analyticsFilters.last90d}</SelectItem>
          <SelectItem value="6m">{t.analyticsFilters.last6m}</SelectItem>
          <SelectItem value="1y">{t.analyticsFilters.last1y}</SelectItem>
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select value={filters.status} onValueChange={(v) => update("status", v)}>
        <SelectTrigger className="h-8 w-[160px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.applications.allStatuses}</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {getStatusLabel(s, t)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Source filter */}
      <Select value={filters.source} onValueChange={(v) => update("source", v)}>
        <SelectTrigger className="h-8 w-[150px] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t.analyticsFilters.allSources}</SelectItem>
          <SelectItem value="MANUAL">{t.analytics.sourceManual}</SelectItem>
          <SelectItem value="EMAIL_DETECTED">{t.analytics.sourceEmail}</SelectItem>
        </SelectContent>
      </Select>

      {/* Active filter count + clear */}
      {activeCount > 0 && (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {activeCount} {t.analyticsFilters.active}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={clearAll}
          >
            <X className="mr-1 h-3 w-3" />
            {t.applications.clearFilters}
          </Button>
        </div>
      )}
    </div>
  );
}
