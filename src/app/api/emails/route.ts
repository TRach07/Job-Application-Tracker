export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const emails = await prisma.email.findMany({
      where: {
        application: { userId: session.user.id },
      },
      include: {
        application: { select: { company: true, position: true } },
      },
      orderBy: { receivedAt: "desc" },
      take: 50,
    });

    return NextResponse.json({ data: emails });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "GET /api/emails failed", error: message });
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
