export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getFilteredEmails } from "@/services/email-review.service";
import { parseEmail } from "@/services/email-parser.service";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

const overrideSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const filtered = await getFilteredEmails(session.user.id);
    return NextResponse.json({ data: filtered });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/emails/filtered failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Override a filter: re-process a filtered email through AI
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = overrideSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }
    const { emailId } = parsed.data;

    // Verify email belongs to user
    const email = await prisma.email.findFirst({
      where: { id: emailId, userId: session.user.id },
    });

    if (!email) {
      return NextResponse.json({ error: "Email not found" }, { status: 404 });
    }

    // Override filter and re-process
    await prisma.email.update({
      where: { id: emailId },
      data: {
        filterStatus: "USER_OVERRIDE",
        filterReason: "User override",
        isParsed: false,
        reviewStatus: "PENDING",
      },
    });

    await parseEmail(emailId, session.user.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "POST /api/emails/filtered failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
