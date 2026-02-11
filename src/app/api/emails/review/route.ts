export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getReviewQueue,
  processReviewAction,
} from "@/services/email-review.service";
import type { EmailReviewAction } from "@/types/email";

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
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as EmailReviewAction;

    if (!body.emailId || !body.action) {
      return NextResponse.json(
        { error: "emailId and action are required" },
        { status: 400 }
      );
    }

    if (!["approve", "reject", "edit_approve"].includes(body.action)) {
      return NextResponse.json(
        { error: "action must be approve, reject, or edit_approve" },
        { status: 400 }
      );
    }

    const result = await processReviewAction(session.user.id, body);
    return NextResponse.json({ data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
