export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import {
  getReviewQueue,
  processReviewAction,
} from "@/services/email-review.service";

const reviewActionSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
  action: z.enum(["approve", "reject", "edit_approve"]),
  editedCompany: z.string().optional(),
  editedPosition: z.string().optional(),
  editedStatus: z.string().optional(),
  linkToApplicationId: z.string().optional(),
});

export const GET = withAuth(async (_req, { userId }) => {
  const queue = await getReviewQueue(userId);
  return NextResponse.json({ data: queue });
}, { route: "GET /api/emails/review" });

export const POST = withAuth(async (req, { userId }) => {
  const raw = await req.json();
  const validated = reviewActionSchema.parse(raw);

  const result = await processReviewAction(userId, validated);
  return NextResponse.json({ data: result });
}, { route: "POST /api/emails/review" });
