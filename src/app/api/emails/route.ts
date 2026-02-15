export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (_req, { userId }) => {
  const emails = await prisma.email.findMany({
    where: {
      application: { userId },
    },
    include: {
      application: { select: { company: true, position: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  });

  return NextResponse.json({ data: emails });
}, { route: "GET /api/emails" });
