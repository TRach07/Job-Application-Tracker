export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getAnalytics } from "@/services/analytics.service";

export const GET = withAuth(async (req, { userId }) => {
  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";

  const analytics = await getAnalytics(userId, locale);

  return NextResponse.json({ data: analytics });
}, { route: "GET /api/analytics" });
