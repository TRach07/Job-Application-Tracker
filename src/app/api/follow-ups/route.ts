export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getFollowUps } from "@/services/follow-up.service";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const followUps = await getFollowUps(session.user.id);
    return NextResponse.json({ data: followUps });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/follow-ups failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
