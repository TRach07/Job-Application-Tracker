import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { syncEmails } from "@/services/email-sync.service";
import { parseUnparsedEmails } from "@/services/email-parser.service";
import { getPendingReviewCount } from "@/services/email-review.service";
import { rateLimit } from "@/lib/rate-limit";

export const POST = withAuth(async (_req, { userId }) => {
  const limited = rateLimit(`sync:${userId}`, 1, 60_000);
  if (limited) return limited;

  const syncResult = await syncEmails(userId);
  const parseResults = await parseUnparsedEmails(userId);
  const pendingReviewCount = await getPendingReviewCount(userId);

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
}, { route: "POST /api/emails/sync" });
