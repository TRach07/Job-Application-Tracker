import { ApplicationStatus } from "@prisma/client";
import type { TranslationDictionary } from "@/i18n/types";

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    color: string;
    bgColor: string;
    textColor: string;
    order: number;
  }
> = {
  APPLIED: {
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-500",
    order: 0,
  },
  SCREENING: {
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    order: 1,
  },
  INTERVIEW: {
    color: "bg-violet-500",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-500",
    order: 2,
  },
  TECHNICAL: {
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    order: 3,
  },
  OFFER: {
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    order: 4,
  },
  ACCEPTED: {
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
    order: 5,
  },
  REJECTED: {
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-500",
    order: 6,
  },
  WITHDRAWN: {
    color: "bg-gray-500",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-500",
    order: 7,
  },
  NO_RESPONSE: {
    color: "bg-zinc-500",
    bgColor: "bg-zinc-500/10",
    textColor: "text-zinc-500",
    order: 8,
  },
};

const STATUS_KEYS: Record<ApplicationStatus, keyof TranslationDictionary["status"]> = {
  APPLIED: "applied",
  SCREENING: "screening",
  INTERVIEW: "interview",
  TECHNICAL: "technical",
  OFFER: "offer",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
  WITHDRAWN: "withdrawn",
  NO_RESPONSE: "noResponse",
};

export function getStatusLabel(
  status: ApplicationStatus,
  t: TranslationDictionary
): string {
  return t.status[STATUS_KEYS[status]];
}

export const KANBAN_COLUMNS: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "TECHNICAL",
  "OFFER",
];

export const ARCHIVE_STATUSES: ApplicationStatus[] = [
  "ACCEPTED",
  "REJECTED",
  "WITHDRAWN",
  "NO_RESPONSE",
];
