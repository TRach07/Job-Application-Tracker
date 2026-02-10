import { prisma } from "@/lib/prisma";
import { listMessages, getMessage, GMAIL_JOB_QUERY } from "@/lib/gmail";

export async function syncEmails(userId: string) {
  const sync = await prisma.emailSync.create({
    data: {
      userId,
      status: "IN_PROGRESS",
    },
  });

  try {
    const messages = await listMessages(userId, GMAIL_JOB_QUERY, 100);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true },
    });

    let emailsFound = 0;
    let emailsParsed = 0;

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
          },
        });

        emailsParsed++;
      } catch (error) {
        console.error(`Failed to sync message ${msg.id}:`, error);
      }
    }

    await prisma.emailSync.update({
      where: { id: sync.id },
      data: {
        status: "COMPLETED",
        emailsFound,
        emailsParsed,
        completedAt: new Date(),
      },
    });

    return { emailsFound, emailsParsed };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

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
