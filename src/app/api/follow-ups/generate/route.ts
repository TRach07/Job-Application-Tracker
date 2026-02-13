import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateFollowUp } from "@/services/follow-up.service";
import { z } from "zod";

const generateSchema = z.object({
  applicationId: z.string().min(1),
  locale: z.enum(["fr", "en"]).optional().default("fr"),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, locale } = generateSchema.parse(body);

    const followUp = await generateFollowUp(applicationId, locale);
    return NextResponse.json({ data: followUp });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation error", details: error.issues },
        { status: 400 }
      );
    }
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
