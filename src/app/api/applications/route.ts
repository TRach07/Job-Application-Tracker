export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getApplications, createApplication } from "@/services/application.service";
import { logger } from "@/lib/logger";
import { z } from "zod";

const createSchema = z.object({
  company: z.string().min(1),
  position: z.string().min(1),
  status: z
    .enum([
      "APPLIED",
      "SCREENING",
      "INTERVIEW",
      "TECHNICAL",
      "OFFER",
      "ACCEPTED",
      "REJECTED",
      "WITHDRAWN",
      "NO_RESPONSE",
    ])
    .optional(),
  url: z.string().url().optional().or(z.literal("")),
  salary: z.string().optional(),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().email().optional().or(z.literal("")),
  notes: z.string().optional(),
  appliedAt: z.string().datetime().optional(),
  source: z.enum(["MANUAL", "EMAIL_DETECTED"]).optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const applications = await getApplications(session.user.id);
    return NextResponse.json({ data: applications });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/applications failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const validated = createSchema.parse(body);

    const application = await createApplication(session.user.id, {
      ...validated,
      appliedAt: validated.appliedAt ? new Date(validated.appliedAt) : undefined,
      url: validated.url || undefined,
      contactEmail: validated.contactEmail || undefined,
    });

    return NextResponse.json({ data: application }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "POST /api/applications failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
