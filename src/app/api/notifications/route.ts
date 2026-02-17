export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getNotifications } from "@/services/notification.service";

export const GET = withAuth(async (_req, { userId }) => {
  const notifications = await getNotifications(userId);
  return NextResponse.json({ data: notifications });
}, { route: "GET /api/notifications" });
