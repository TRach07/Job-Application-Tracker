export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    // Verify the follow-up belongs to the user
    const followUp = await prisma.followUp.findFirst({
      where: {
        id,
        application: { userId: session.user.id },
      },
    });

    if (!followUp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.followUp.delete({ where: { id } });

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
