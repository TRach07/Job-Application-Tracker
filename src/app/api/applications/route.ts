export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getApplications, createApplication } from "@/services/application.service";
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

export const GET = withAuth(async (_req, { userId }) => {
  const applications = await getApplications(userId);
  return NextResponse.json({ data: applications });
}, { route: "GET /api/applications" });

export const POST = withAuth(async (req, { userId }) => {
  const body = await req.json();
  const validated = createSchema.parse(body);

  const application = await createApplication(userId, {
    ...validated,
    appliedAt: validated.appliedAt ? new Date(validated.appliedAt) : undefined,
    url: validated.url || undefined,
    contactEmail: validated.contactEmail || undefined,
  });

  return NextResponse.json({ data: application }, { status: 201 });
}, { route: "POST /api/applications" });
