export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const DELETE = withAuth(async (_req, { userId, params }) => {
  const { id } = params;

  const followUp = await prisma.followUp.findFirst({
    where: {
      id,
      application: { userId },
    },
  });

  if (!followUp) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.followUp.delete({ where: { id } });

  return NextResponse.json({ data: { success: true } });
}, { route: "DELETE /api/follow-ups/[id]" });
