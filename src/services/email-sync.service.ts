import { prisma } from "@/lib/prisma";
import { listMessages, getMessage, GMAIL_JOB_QUERY } from "@/lib/gmail";
import { preFilterEmail } from "@/lib/email-filter";
import { logger } from "@/lib/logger";

export async function syncEmails(userId: string) {
  const sync = await prisma.emailSync.create({
    data: {
      userId,
      status: "IN_PROGRESS",
    },
  });

  try {
    logger.info({ msg: "Starting email sync", userId });
    const messages = await listMessages(userId, GMAIL_JOB_QUERY, 100);
    logger.info({ msg: "Gmail messages fetched", count: messages.length });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    let emailsFound = 0;
    let emailsFiltered = 0;
    let emailsPassed = 0;

    for (const msg of messages) {
      const existing = await prisma.email.findUnique({
        where: { gmailId: msg.id },
      });

      if (existing) continue;

      try {
        const fullMessage = await getMessage(userId, msg.id);
        emailsFound++;

        const isInbound = !fullMessage.from.includes(user?.email || "");
        const bodyPreview = fullMessage.body.substring(0, 500);

        // Deterministic pre-filter
        const filterResult = preFilterEmail({
          from: fullMessage.from,
          subject: fullMessage.subject,
          bodyPreview,
        });

        await prisma.email.create({
          data: {
            gmailId: fullMessage.id,
            threadId: fullMessage.threadId,
            from: fullMessage.from,
            to: fullMessage.to,
            subject: fullMessage.subject,
            bodyPreview,
            bodyFull: fullMessage.body,
            receivedAt: fullMessage.receivedAt,
            isInbound,
            userId,
            filterStatus: filterResult.status,
            filterReason: filterResult.reason,
            reviewStatus: filterResult.passed ? "PENDING" : "SKIPPED",
          },
        });

        if (filterResult.passed) {
          emailsPassed++;
        } else {
          emailsFiltered++;
        }
      } catch (error) {
        logger.error({ msg: "Failed to sync message", messageId: msg.id, error });
      }
    }

    await prisma.emailSync.update({
      where: { id: sync.id },
      data: {
        status: "COMPLETED",
        emailsFound,
        emailsParsed: emailsPassed,
        completedAt: new Date(),
      },
    });

    logger.info({ msg: "Email sync completed", emailsFound, emailsFiltered, emailsPassed });
    return { emailsFound, emailsFiltered, emailsPassed };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    logger.error({ msg: "Email sync failed", userId, error: errorMessage });

    await prisma.emailSync.update({
      where: { id: sync.id },
      data: {
        status: "FAILED",
        error: errorMessage,
        completedAt: new Date(),
      },
    });

    throw error;
  }
}
