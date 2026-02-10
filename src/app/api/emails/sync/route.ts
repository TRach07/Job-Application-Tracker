import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncEmails } from "@/services/email-sync.service";
import { parseUnparsedEmails } from "@/services/email-parser.service";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Step 1: Sync emails from Gmail
    const syncResult = await syncEmails(session.user.id);

    // Step 2: Parse unparsed emails with AI
    const parseResults = await parseUnparsedEmails(session.user.id);

    return NextResponse.json({
      data: {
        emailsFound: syncResult.emailsFound,
        emailsParsed: syncResult.emailsParsed,
        aiResults: parseResults,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
