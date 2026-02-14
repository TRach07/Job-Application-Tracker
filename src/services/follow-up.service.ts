import { prisma } from "@/lib/prisma";
import { generateCompletion } from "@/lib/groq";
import { extractJSON } from "@/lib/ai-utils";
import { anonymizeFollowUpFields, deanonymizeObject } from "@/lib/anonymizer";
import { FOLLOW_UP_PROMPT, fillPrompt } from "@/constants/prompts";
import { logger } from "@/lib/logger";
import type { GeneratedFollowUp } from "@/types/follow-up";
import { getStatusLabel } from "@/constants/status";
import { fr } from "@/i18n/fr";
import { en } from "@/i18n/en";
import type { Locale } from "@/i18n/types";

export async function getFollowUps(userId: string) {
  return prisma.followUp.findMany({
    where: {
      application: { userId },
    },
    include: {
      application: {
        select: { company: true, position: true, status: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function generateFollowUp(
  applicationId: string,
  locale: Locale = "fr"
): Promise<GeneratedFollowUp> {
  const application = await prisma.application.findUnique({
    where: { id: applicationId },
    include: {
      user: { select: { name: true } },
      emails: {
        orderBy: { receivedAt: "desc" },
        take: 5,
        select: { subject: true, bodyPreview: true, receivedAt: true },
      },
    },
  });

  if (!application) {
    throw new Error("Application not found");
  }

  const dict = locale === "en" ? en : fr;
  const intlLocale = locale === "en" ? "en-US" : "fr-FR";
  const langInstruction = dict.ai.languageInstruction;

  const emailSummary =
    application.emails
      .map(
        (e) =>
          `[${e.receivedAt.toLocaleDateString(intlLocale)}] ${e.subject}: ${e.bodyPreview}`
      )
      .join("\n") || dict.ai.noEmailExchanges;

  const lastContact = application.emails[0]?.receivedAt || application.appliedAt;

  // Anonymize PII before sending to external AI
  const anonymized = anonymizeFollowUpFields({
    userName: application.user?.name || dict.ai.defaultUser,
    emailSummary,
  });

  const prompt = fillPrompt(FOLLOW_UP_PROMPT, {
    userName: anonymized.userName,
    company: application.company,
    position: application.position,
    appliedAt: application.appliedAt.toLocaleDateString(intlLocale),
    lastContactDate: lastContact.toLocaleDateString(intlLocale),
    status: getStatusLabel(application.status, dict),
    emailSummary: anonymized.emailSummary,
    languageInstruction: langInstruction,
  });

  logger.info({ msg: "Generating follow-up", applicationId, company: application.company });
  const response = await generateCompletion(prompt);
  const rawParsed = extractJSON<GeneratedFollowUp>(response);

  if (!rawParsed) {
    throw new Error("Failed to generate follow-up");
  }

  // De-anonymize to restore real values before saving
  const parsed = deanonymizeObject(rawParsed, anonymized.mapping);

  // Save as draft
  await prisma.followUp.create({
    data: {
      applicationId,
      subject: parsed.subject,
      body: parsed.body,
      aiGenerated: true,
      status: "DRAFT",
    },
  });

  logger.info({ msg: "Follow-up generated and saved as DRAFT", applicationId });
  return parsed;
}

/**
 * Collapse all whitespace (newlines, tabs, multiple spaces) into single spaces,
 * lowercase, and trim. This handles formatting differences between the
 * AI-generated draft and the actually sent email.
 */
function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * When an outbound email is linked to an application, check if it matches
 * a DRAFT follow-up and mark it as SENT.
 *
 * Matching strategy: compare normalized body text. The user may add line breaks,
 * change casing, or tweak the signature, but the core content stays largely the
 * same. We check if the email body contains the first 100 characters of the
 * follow-up body (enough to be unique, tolerant of minor edits at the end).
 */
export async function matchAndMarkFollowUpAsSent(
  applicationId: string,
  emailBody: string,
  sentAt: Date
): Promise<{ matched: boolean; followUpId?: string }> {
  const drafts = await prisma.followUp.findMany({
    where: {
      applicationId,
      status: "DRAFT",
    },
    orderBy: { createdAt: "desc" },
  });

  if (drafts.length === 0) {
    return { matched: false };
  }

  const normalizedEmailBody = normalizeText(emailBody);

  const match = drafts.find((draft) => {
    const normalizedDraftBody = normalizeText(draft.body);
    // Use the first 100 chars of the draft as a fingerprint
    const snippet = normalizedDraftBody.substring(0, 100);
    return snippet.length > 20 && normalizedEmailBody.includes(snippet);
  });

  if (!match) {
    return { matched: false };
  }

  await prisma.followUp.update({
    where: { id: match.id },
    data: {
      status: "SENT",
      sentAt,
    },
  });

  logger.info({
    msg: "Matched DRAFT follow-up as SENT",
    followUpId: match.id,
    applicationId,
  });

  return { matched: true, followUpId: match.id };
}

export async function getApplicationsNeedingFollowUp(userId: string) {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  return prisma.application.findMany({
    where: {
      userId,
      status: { in: ["APPLIED", "SCREENING"] },
      updatedAt: { lt: sevenDaysAgo },
      followUps: {
        none: {
          status: { in: ["DRAFT", "SCHEDULED"] },
        },
      },
    },
    orderBy: { appliedAt: "asc" },
  });
}
