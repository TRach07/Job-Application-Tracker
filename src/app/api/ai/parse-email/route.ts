import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { parseEmail } from "@/services/email-parser.service";
import { rateLimit } from "@/lib/rate-limit";
import { logger } from "@/lib/logger";
import { z } from "zod";

const parseSchema = z.object({
  emailId: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`ai-parse:${session.user.id}`, 10, 60_000);
    if (limited) return limited;

    const body = await request.json();
    const { emailId } = parseSchema.parse(body);

    const result = await parseEmail(emailId, session.user.id);
    return NextResponse.json({ data: result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "POST /api/ai/parse-email failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
