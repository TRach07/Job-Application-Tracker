export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getApplicationById,
  updateApplication,
  deleteApplication,
} from "@/services/application.service";
import { logger } from "@/lib/logger";
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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const application = await getApplicationById(id, session.user.id);

    if (!application) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({ data: application });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/applications/[id] failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const validated = updateSchema.parse(body);

    const application = await updateApplication(id, session.user.id, {
      ...validated,
      nextActionAt: validated.nextActionAt
        ? new Date(validated.nextActionAt)
        : undefined,
    });

    return NextResponse.json({ data: application });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "PATCH /api/applications/[id] failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await deleteApplication(id, session.user.id);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "DELETE /api/applications/[id] failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
