import { prisma } from "@/lib/prisma";
import type { ApplicationStatus } from "@prisma/client";

interface ExportRow {
  company: string;
  position: string;
  status: ApplicationStatus;
  appliedAt: string;
  location: string;
  salary: string;
  contactName: string;
  contactEmail: string;
  source: string;
  url: string;
  notes: string;
}

export async function getExportData(userId: string): Promise<ExportRow[]> {
  const applications = await prisma.application.findMany({
    where: { userId },
    orderBy: { appliedAt: "desc" },
    select: {
      company: true,
      position: true,
      status: true,
      appliedAt: true,
      location: true,
      salary: true,
      contactName: true,
      contactEmail: true,
      source: true,
      url: true,
      notes: true,
    },
  });

  return applications.map((app) => ({
    company: app.company,
    position: app.position,
    status: app.status,
    appliedAt: app.appliedAt.toISOString().split("T")[0],
    location: app.location ?? "",
    salary: app.salary ?? "",
    contactName: app.contactName ?? "",
    contactEmail: app.contactEmail ?? "",
    source: app.source,
    url: app.url ?? "",
    notes: app.notes ?? "",
  }));
}

/**
 * Convert rows to CSV string with proper escaping.
 */
export function toCSV(rows: ExportRow[], headers: Record<keyof ExportRow, string>): string {
  const keys = Object.keys(headers) as (keyof ExportRow)[];
  const headerLine = keys.map((k) => escapeCSV(headers[k])).join(",");

  const dataLines = rows.map((row) =>
    keys.map((k) => escapeCSV(row[k])).join(",")
  );

  return [headerLine, ...dataLines].join("\n");
}

function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
