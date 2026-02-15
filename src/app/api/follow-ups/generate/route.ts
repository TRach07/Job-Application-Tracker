import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { generateFollowUp } from "@/services/follow-up.service";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const generateSchema = z.object({
  applicationId: z.string().min(1),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

export const POST = withAuth(async (req, { userId }) => {
  const limited = rateLimit(`follow-up:${userId}`, 5, 60_000);
  if (limited) return limited;

  const body = await req.json();
  const { applicationId, locale } = generateSchema.parse(body);

  const followUp = await generateFollowUp(applicationId, locale);
  return NextResponse.json({ data: followUp });
}, { route: "POST /api/follow-ups/generate" });
