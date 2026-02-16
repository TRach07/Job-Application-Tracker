export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { prisma } from "@/lib/prisma";

export const GET = withAuth(async (req, { userId }) => {
  const url = new URL(req.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") || "20", 10)));
  const skip = (page - 1) * limit;

  const [emails, total] = await Promise.all([
    prisma.email.findMany({
      where: {
        application: { userId },
      },
      include: {
        application: { select: { company: true, position: true } },
      },
      orderBy: { receivedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.email.count({
      where: {
        application: { userId },
      },
    }),
  ]);

  return NextResponse.json({
    data: emails,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}, { route: "GET /api/emails" });
