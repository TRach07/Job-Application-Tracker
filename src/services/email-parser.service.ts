import { prisma } from "@/lib/prisma";
import { generateCompletion, extractJSON, checkOllamaHealth } from "@/lib/ollama";
import { EMAIL_PARSE_PROMPT, fillPrompt } from "@/constants/prompts";
import type { EmailParseResult } from "@/types/email";
import type { ApplicationStatus } from "@prisma/client";

const CONFIDENCE_THRESHOLD = 0.7;

export async function parseEmail(emailId: string, userId?: string) {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) {
    throw new Error("Email not found");
  }

  const prompt = fillPrompt(EMAIL_PARSE_PROMPT, {
    from: email.from,
    to: email.to,
    subject: email.subject,
    date: email.receivedAt.toISOString(),
    body: email.bodyFull.substring(0, 3000),
  });

  const response = await generateCompletion(prompt);
  const parsed = extractJSON<EmailParseResult>(response);

  if (!parsed) {
    await prisma.email.update({
      where: { id: emailId },
      data: { isParsed: true, aiAnalysis: { error: "Failed to parse response" } },
    });
    return null;
  }

  await prisma.email.update({
    where: { id: emailId },
    data: { isParsed: true, aiAnalysis: JSON.parse(JSON.stringify(parsed)) },
  });

  if (parsed.is_job_related && parsed.confidence >= CONFIDENCE_THRESHOLD && userId) {
    await linkOrCreateApplication(emailId, parsed, userId);
  }

  return parsed;
}

async function linkOrCreateApplication(
  emailId: string,
  parsed: EmailParseResult,
  userId: string
) {
  if (!parsed.company) return;

  // Try to find existing application for this user
  const existing = await prisma.application.findFirst({
    where: {
      userId,
      company: { contains: parsed.company, mode: "insensitive" },
      ...(parsed.position
        ? { position: { contains: parsed.position, mode: "insensitive" } }
        : {}),
    },
  });

  if (existing) {
    await prisma.email.update({
      where: { id: emailId },
      data: { applicationId: existing.id },
    });

    if (parsed.status && parsed.status !== existing.status) {
      await prisma.statusChange.create({
        data: {
          applicationId: existing.id,
          fromStatus: existing.status,
          toStatus: parsed.status as ApplicationStatus,
          reason: `Detected from email: ${parsed.summary}`,
        },
      });

      await prisma.application.update({
        where: { id: existing.id },
        data: {
          status: parsed.status as ApplicationStatus,
          ...(parsed.contact_name ? { contactName: parsed.contact_name } : {}),
          ...(parsed.contact_email
            ? { contactEmail: parsed.contact_email }
            : {}),
          ...(parsed.next_steps ? { nextAction: parsed.next_steps } : {}),
          ...(parsed.key_date
            ? { nextActionAt: new Date(parsed.key_date) }
            : {}),
        },
      });
    }
  } else {
    const app = await prisma.application.create({
      data: {
        userId,
        company: parsed.company,
        position: parsed.position || "Position non spécifiée",
        status: (parsed.status as ApplicationStatus) || "APPLIED",
        contactName: parsed.contact_name || undefined,
        contactEmail: parsed.contact_email || undefined,
        nextAction: parsed.next_steps || undefined,
        nextActionAt: parsed.key_date ? new Date(parsed.key_date) : undefined,
        source: "EMAIL_DETECTED",
      },
    });

    await prisma.email.update({
      where: { id: emailId },
      data: { applicationId: app.id },
    });
  }
}

export async function parseUnparsedEmails(userId: string) {
  const ollamaAvailable = await checkOllamaHealth();
  if (!ollamaAvailable) {
    return [{ error: "Ollama n'est pas disponible. Installez un modèle avec : ollama pull qwen2:1.5b" }];
  }

  const unparsed = await prisma.email.findMany({
    where: { isParsed: false },
    orderBy: { receivedAt: "desc" },
    take: 20,
  });

  const results = [];
  for (const email of unparsed) {
    try {
      const result = await parseEmail(email.id, userId);
      results.push({ emailId: email.id, result });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      results.push({ emailId: email.id, error: message });
      if (message.includes("not found")) break;
    }
  }

  return results;
}
