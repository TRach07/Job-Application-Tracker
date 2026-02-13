import { prisma } from "@/lib/prisma";
import { generateCompletion } from "@/lib/groq";
import { extractJSON } from "@/lib/ai-utils";
import { anonymizeFollowUpFields, deanonymizeObject } from "@/lib/anonymizer";
import { FOLLOW_UP_PROMPT, fillPrompt } from "@/constants/prompts";
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

  return parsed;
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
