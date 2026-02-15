import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { parseEmail } from "@/services/email-parser.service";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const parseSchema = z.object({
  emailId: z.string().min(1),
});

export const POST = withAuth(async (req, { userId }) => {
  const limited = rateLimit(`ai-parse:${userId}`, 10, 60_000);
  if (limited) return limited;

  const body = await req.json();
  const { emailId } = parseSchema.parse(body);

  const result = await parseEmail(emailId, userId);
  return NextResponse.json({ data: result });
}, { route: "POST /api/ai/parse-email" });
