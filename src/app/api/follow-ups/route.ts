export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getFollowUps } from "@/services/follow-up.service";

export const GET = withAuth(async (_req, { userId }) => {
  const followUps = await getFollowUps(userId);
  return NextResponse.json({ data: followUps });
}, { route: "GET /api/follow-ups" });
