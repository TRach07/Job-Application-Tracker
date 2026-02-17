export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getExportData, toCSV } from "@/services/export.service";

const CSV_HEADERS_FR = {
  company: "Entreprise",
  position: "Poste",
  status: "Statut",
  appliedAt: "Date de candidature",
  location: "Localisation",
  salary: "Salaire",
  contactName: "Contact",
  contactEmail: "Email contact",
  source: "Source",
  url: "URL",
  notes: "Notes",
} as const;

const CSV_HEADERS_EN = {
  company: "Company",
  position: "Position",
  status: "Status",
  appliedAt: "Applied date",
  location: "Location",
  salary: "Salary",
  contactName: "Contact",
  contactEmail: "Contact email",
  source: "Source",
  url: "URL",
  notes: "Notes",
} as const;

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";
  const headers = locale === "en" ? CSV_HEADERS_EN : CSV_HEADERS_FR;

  const rows = await getExportData(userId);
  const csv = toCSV(rows, headers);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="applications-${new Date().toISOString().split("T")[0]}.csv"`,
    },
  });
}, { route: "GET /api/export/csv" });
