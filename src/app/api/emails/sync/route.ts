import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { syncEmails } from "@/services/email-sync.service";
import { parseUnparsedEmails } from "@/services/email-parser.service";
import { getPendingReviewCount } from "@/services/email-review.service";
import { rateLimit } from "@/lib/rate-limit";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = rateLimit(`sync:${session.user.id}`, 1, 60_000);
    if (limited) return limited;

    // Step 1: Sync + pre-filter
    const syncResult = await syncEmails(session.user.id);

    // Step 2: Parse emails that passed filter
    const parseResults = await parseUnparsedEmails(session.user.id);

    // Step 3: Count items in review queue
    const pendingReviewCount = await getPendingReviewCount(session.user.id);

    const successCount = parseResults.filter(
      (r) => !("error" in r) && r.result !== null
    ).length;
    const errorCount = parseResults.filter((r) => "error" in r).length;

    return NextResponse.json({
      data: {
        emailsFound: syncResult.emailsFound,
        emailsFiltered: syncResult.emailsFiltered,
        emailsPassed: syncResult.emailsPassed,
        emailsParsed: successCount,
        parseErrors: errorCount,
        pendingReviewCount,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[email-sync] Error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
