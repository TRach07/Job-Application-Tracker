import { prisma } from "@/lib/prisma";
import { generateCompletion, extractJSON } from "@/lib/ollama";
import { FOLLOW_UP_PROMPT, fillPrompt } from "@/constants/prompts";
import type { GeneratedFollowUp } from "@/types/follow-up";
import { STATUS_CONFIG } from "@/constants/status";

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
  applicationId: string
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

  const emailSummary =
    application.emails
      .map(
        (e) =>
          `[${e.receivedAt.toLocaleDateString()}] ${e.subject}: ${e.bodyPreview}`
      )
      .join("\n") || "Aucun échange email";

  const lastContact = application.emails[0]?.receivedAt || application.appliedAt;

  const prompt = fillPrompt(FOLLOW_UP_PROMPT, {
    userName: application.user?.name || "l'utilisateur",
    company: application.company,
    position: application.position,
    appliedAt: application.appliedAt.toLocaleDateString("fr-FR"),
    lastContactDate: lastContact.toLocaleDateString("fr-FR"),
    status: STATUS_CONFIG[application.status].label,
    emailSummary,
  });

  const response = await generateCompletion(prompt);
  const parsed = extractJSON<GeneratedFollowUp>(response);

  if (!parsed) {
    throw new Error("Failed to generate follow-up");
  }

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
