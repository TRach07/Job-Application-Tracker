import { prisma } from "@/lib/prisma";
import type { EmailReviewAction, EmailParseResult } from "@/types/email";
import type { ApplicationStatus } from "@prisma/client";
import { matchAndMarkFollowUpAsSent } from "@/services/follow-up.service";

/**
 * Get emails awaiting user review.
 */
export async function getReviewQueue(userId: string) {
  return prisma.email.findMany({
    where: {
      userId,
      reviewStatus: "PENDING",
      isParsed: true,
    },
    include: {
      application: { select: { id: true, company: true, position: true } },
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  });
}

/**
 * Get pre-filtered emails (so user can override if needed).
 */
export async function getFilteredEmails(userId: string) {
  return prisma.email.findMany({
    where: {
      userId,
      filterStatus: { in: ["REJECTED_SENDER", "REJECTED_SUBJECT", "REJECTED_CONTENT"] },
    },
    select: {
      id: true,
      gmailId: true,
      threadId: true,
      from: true,
      to: true,
      subject: true,
      bodyPreview: true,
      receivedAt: true,
      isInbound: true,
      filterStatus: true,
      filterReason: true,
      reviewStatus: true,
    },
    orderBy: { receivedAt: "desc" },
    take: 50,
  });
}

/**
 * Process user's review decision on an email (approve/reject/edit_approve).
 */
export async function processReviewAction(
  userId: string,
  action: EmailReviewAction
) {
  const email = await prisma.email.findFirst({
    where: { id: action.emailId, userId },
  });

  if (!email) throw new Error("Email not found");

  // Reject — mark as rejected and done
  if (action.action === "reject") {
    await prisma.email.update({
      where: { id: email.id },
      data: { reviewStatus: "REJECTED", reviewedAt: new Date() },
    });
    return { success: true, action: "rejected" as const };
  }

  // Approve or Edit+Approve
  const aiAnalysis = email.aiAnalysis as unknown as EmailParseResult | null;

  const company =
    action.editedCompany || aiAnalysis?.company || "Unknown company";
  const position =
    action.editedPosition || aiAnalysis?.position || "Unspecified position";
  const status = (action.editedStatus ||
    aiAnalysis?.status ||
    "APPLIED") as ApplicationStatus;

  // Try to link to an existing application
  let applicationId = action.linkToApplicationId;

  if (!applicationId) {
    // 1. Thread matching
    const threadMatch = await findApplicationByThread(email.threadId, userId);
    if (threadMatch) applicationId = threadMatch.id;
  }

  if (!applicationId) {
    // 2. Domain matching
    const domainMatch = await findApplicationByDomain(email.from, userId);
    if (domainMatch) applicationId = domainMatch.id;
  }

  if (!applicationId) {
    // 3. Fuzzy company name
    const companyMatch = await findApplicationByCompany(company, userId);
    if (companyMatch) applicationId = companyMatch.id;
  }

  if (applicationId) {
    // Link to existing application
    await prisma.email.update({
      where: { id: email.id },
      data: {
        applicationId,
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });

    // Match outbound emails against DRAFT follow-ups
    if (!email.isInbound) {
      await matchAndMarkFollowUpAsSent(applicationId, email.bodyPreview, email.receivedAt);
    }

    // Update status if different
    const existingApp = await prisma.application.findUnique({
      where: { id: applicationId },
    });
    if (existingApp && status && status !== existingApp.status) {
      await prisma.statusChange.create({
        data: {
          applicationId,
          fromStatus: existingApp.status,
          toStatus: status,
          reason: `Detected from email: ${email.subject}`,
        },
      });
      await prisma.application.update({
        where: { id: applicationId },
        data: {
          status,
          ...(aiAnalysis?.contact_name
            ? { contactName: aiAnalysis.contact_name }
            : {}),
          ...(aiAnalysis?.contact_email
            ? { contactEmail: aiAnalysis.contact_email }
            : {}),
          ...(aiAnalysis?.next_steps
            ? { nextAction: aiAnalysis.next_steps }
            : {}),
          ...(aiAnalysis?.key_date
            ? { nextActionAt: new Date(aiAnalysis.key_date) }
            : {}),
        },
      });
    }

    return {
      success: true,
      action: "linked" as const,
      applicationId,
      company: existingApp?.company || company,
    };
  } else {
    // Create new application
    const app = await prisma.application.create({
      data: {
        userId,
        company,
        position,
        status,
        contactName: aiAnalysis?.contact_name || undefined,
        contactEmail: aiAnalysis?.contact_email || undefined,
        nextAction: aiAnalysis?.next_steps || undefined,
        nextActionAt: aiAnalysis?.key_date
          ? new Date(aiAnalysis.key_date)
          : undefined,
        source: "EMAIL_DETECTED",
      },
    });

    await prisma.email.update({
      where: { id: email.id },
      data: {
        applicationId: app.id,
        reviewStatus: "APPROVED",
        reviewedAt: new Date(),
      },
    });

    // Match outbound emails against DRAFT follow-ups
    if (!email.isInbound) {
      await matchAndMarkFollowUpAsSent(app.id, email.bodyPreview, email.receivedAt);
    }

    return {
      success: true,
      action: "created" as const,
      applicationId: app.id,
      company,
    };
  }
}

/**
 * Count pending review emails for a user.
 */
export async function getPendingReviewCount(userId: string): Promise<number> {
  return prisma.email.count({
    where: { userId, reviewStatus: "PENDING", isParsed: true },
  });
}

// --- Deduplication helpers ---

async function findApplicationByThread(
  threadId: string | null,
  userId: string
): Promise<{ id: string; company: string } | null> {
  if (!threadId) return null;

  const linkedEmail = await prisma.email.findFirst({
    where: {
      threadId,
      applicationId: { not: null },
      application: { userId },
    },
    include: {
      application: { select: { id: true, company: true } },
    },
  });

  return linkedEmail?.application ?? null;
}

async function findApplicationByDomain(
  fromHeader: string,
  userId: string
): Promise<{ id: string; company: string } | null> {
  const emailMatch =
    fromHeader.match(/<([^>]+)>/) || fromHeader.match(/([^\s<]+@[^\s>]+)/);
  if (!emailMatch) return null;

  const domain = emailMatch[1].split("@")[1];
  if (!domain) return null;

  // Exclude generic email providers
  const genericDomains = [
    "gmail.com",
    "yahoo.com",
    "yahoo.fr",
    "outlook.com",
    "hotmail.com",
    "hotmail.fr",
    "live.com",
    "live.fr",
    "orange.fr",
    "free.fr",
    "sfr.fr",
    "laposte.net",
    "icloud.com",
    "protonmail.com",
    "proton.me",
  ];
  if (genericDomains.includes(domain.toLowerCase())) return null;

  const app = await prisma.application.findFirst({
    where: {
      userId,
      contactEmail: { contains: domain, mode: "insensitive" },
    },
    select: { id: true, company: true },
  });

  return app;
}

async function findApplicationByCompany(
  company: string,
  userId: string
): Promise<{ id: string; company: string } | null> {
  if (!company || company === "Unknown company") return null;

  const app = await prisma.application.findFirst({
    where: {
      userId,
      company: { contains: company, mode: "insensitive" },
    },
    select: { id: true, company: true },
  });

  return app;
}
