export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getAnalytics } from "@/services/analytics.service";
import type { ApplicationStatus, ApplicationSource } from "@prisma/client";

const VALID_STATUSES: ApplicationStatus[] = [
  "APPLIED", "SCREENING", "INTERVIEW", "TECHNICAL",
  "OFFER", "ACCEPTED", "REJECTED", "WITHDRAWN", "NO_RESPONSE",
];
const VALID_SOURCES: ApplicationSource[] = ["MANUAL", "EMAIL_DETECTED"];
const VALID_PERIODS = ["7d", "30d", "90d", "6m", "1y"];

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";

  // Parse optional filters
  const periodParam = searchParams.get("period");
  const statusParam = searchParams.get("status") as ApplicationStatus | null;
  const sourceParam = searchParams.get("source") as ApplicationSource | null;

  const filters = {
    period: periodParam && VALID_PERIODS.includes(periodParam) ? periodParam : undefined,
    status: statusParam && VALID_STATUSES.includes(statusParam) ? statusParam : undefined,
    source: sourceParam && VALID_SOURCES.includes(sourceParam) ? sourceParam : undefined,
  };

  const analytics = await getAnalytics(userId, locale, filters);

  return NextResponse.json({ data: analytics });
}, { route: "GET /api/analytics" });
