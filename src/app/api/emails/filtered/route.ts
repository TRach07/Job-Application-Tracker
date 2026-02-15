export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAuth } from "@/lib/api-handler";
import { getFilteredEmails } from "@/services/email-review.service";
import { parseEmail } from "@/services/email-parser.service";
import { prisma } from "@/lib/prisma";

const overrideSchema = z.object({
  emailId: z.string().min(1, "emailId is required"),
});

export const GET = withAuth(async (_req, { userId }) => {
  const filtered = await getFilteredEmails(userId);
  return NextResponse.json({ data: filtered });
}, { route: "GET /api/emails/filtered" });

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const { emailId } = overrideSchema.parse(body);

  const email = await prisma.email.findFirst({
    where: { id: emailId, userId },
  });

  if (!email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  await prisma.email.update({
    where: { id: emailId },
    data: {
      filterStatus: "USER_OVERRIDE",
      filterReason: "User override",
      isParsed: false,
      reviewStatus: "PENDING",
    },
  });

  await parseEmail(emailId, userId);

  return NextResponse.json({ data: { success: true } });
}, { route: "POST /api/emails/filtered" });
