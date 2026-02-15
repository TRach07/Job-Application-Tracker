export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "@/services/application.service";
import { z } from "zod";

const updateSchema = z.object({
  company: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
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
  url: z.string().optional(),
  salary: z.string().optional(),
  location: z.string().optional(),
  contactName: z.string().optional(),
  contactEmail: z.string().optional(),
  notes: z.string().optional(),
  nextAction: z.string().optional(),
  nextActionAt: z.string().datetime().optional(),
});

export const GET = withAuth(async (_req, { userId, params }) => {
  const { id } = params;
  const application = await getApplicationById(id, userId);

  if (!application) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: application });
}, { route: "GET /api/applications/[id]" });

export const PATCH = withAuth(async (req, { userId, params }) => {
  const { id } = params;
  const body = await req.json();
  const validated = updateSchema.parse(body);

  const application = await updateApplication(id, userId, {
    ...validated,
    nextActionAt: validated.nextActionAt
      ? new Date(validated.nextActionAt)
      : undefined,
  });

  return NextResponse.json({ data: application });
}, { route: "PATCH /api/applications/[id]" });

export const DELETE = withAuth(async (_req, { userId, params }) => {
  const { id } = params;
  await deleteApplication(id, userId);

  return NextResponse.json({ data: { success: true } });
}, { route: "DELETE /api/applications/[id]" });
