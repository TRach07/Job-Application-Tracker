export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import {
  getReviewQueue,
  processReviewAction,
} from "@/services/email-review.service";
import { logger } from "@/lib/logger";

const reviewActionSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
  action: z.enum(["approve", "reject", "edit_approve"]),
  editedCompany: z.string().optional(),
  editedPosition: z.string().optional(),
  editedStatus: z.string().optional(),
  linkToApplicationId: z.string().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const queue = await getReviewQueue(session.user.id);
    return NextResponse.json({ data: queue });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/emails/review failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const raw = await request.json();
    const parsed = reviewActionSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const result = await processReviewAction(session.user.id, parsed.data);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "POST /api/emails/review failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
