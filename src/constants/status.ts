import { ApplicationStatus } from "@prisma/client";

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string;
    color: string;
    bgColor: string;
    textColor: string;
    order: number;
  }
> = {
  APPLIED: {
    label: "Candidature envoyée",
    color: "bg-slate-500",
    bgColor: "bg-slate-500/10",
    textColor: "text-slate-500",
    order: 0,
  },
  SCREENING: {
    label: "Pré-sélection",
    color: "bg-blue-500",
    bgColor: "bg-blue-500/10",
    textColor: "text-blue-500",
    order: 1,
  },
  INTERVIEW: {
    label: "Entretien",
    color: "bg-violet-500",
    bgColor: "bg-violet-500/10",
    textColor: "text-violet-500",
    order: 2,
  },
  TECHNICAL: {
    label: "Test technique",
    color: "bg-amber-500",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-500",
    order: 3,
  },
  OFFER: {
    label: "Offre reçue",
    color: "bg-emerald-500",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-500",
    order: 4,
  },
  ACCEPTED: {
    label: "Acceptée",
    color: "bg-green-500",
    bgColor: "bg-green-500/10",
    textColor: "text-green-500",
    order: 5,
  },
  REJECTED: {
    label: "Refusée",
    color: "bg-red-500",
    bgColor: "bg-red-500/10",
    textColor: "text-red-500",
    order: 6,
  },
  WITHDRAWN: {
    label: "Retirée",
    color: "bg-gray-500",
    bgColor: "bg-gray-500/10",
    textColor: "text-gray-500",
    order: 7,
  },
  NO_RESPONSE: {
    label: "Sans réponse",
    color: "bg-zinc-500",
    bgColor: "bg-zinc-500/10",
    textColor: "text-zinc-500",
    order: 8,
  },
};

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
