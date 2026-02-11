import { prisma } from "@/lib/prisma";
import { generateCompletion } from "@/lib/groq";
import { extractJSON } from "@/lib/ai-utils";
import { anonymizeEmailFields, deanonymizeObject } from "@/lib/anonymizer";
import { EMAIL_PARSE_PROMPT, fillPrompt } from "@/constants/prompts";
import type { EmailParseResult } from "@/types/email";

const CONFIDENCE_THRESHOLD = 0.85;

/**
 * Find an existing application linked to the same Gmail thread.
 * If an email in the same thread is already linked to an Application, auto-link.
 */
async function findApplicationByThread(
  threadId: string | null,
  userId?: string
): Promise<{ id: string; company: string } | null> {
  if (!threadId || !userId) return null;

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

/**
 * Parse a single email with AI.
 * NEVER auto-creates an Application.
 * Marks the email as PENDING (awaiting review) or SKIPPED (not job-related).
 */
export async function parseEmail(emailId: string, userId?: string) {
  const email = await prisma.email.findUnique({
    where: { id: emailId },
  });

  if (!email) {
    throw new Error("Email not found");
  }

  // Step 1: Thread matching — if the thread is already linked to an application, auto-link
  const threadMatch = await findApplicationByThread(email.threadId, userId);
  if (threadMatch) {
    await prisma.email.update({
      where: { id: emailId },
      data: {
        applicationId: threadMatch.id,
        isParsed: true,
        reviewStatus: "AUTO_LINKED",
        aiAnalysis: JSON.parse(
          JSON.stringify({
            auto_linked: true,
            reason: `Thread match: ${threadMatch.company}`,
          })
        ),
      },
    });
    return { auto_linked: true, applicationId: threadMatch.id };
  }

  // Step 2: AI parsing with PII anonymization
  const anonymized = anonymizeEmailFields({
    from: email.from,
    to: email.to,
    subject: email.subject,
    body: email.bodyFull.substring(0, 3000),
  });

  // Log anonymized data sent to external API (verify no PII leaks)
  console.log(`[anonymizer] "${email.subject}" — sent to Groq:`);
  console.log(`  from: ${anonymized.from}`);
  console.log(`  to: ${anonymized.to}`);
  console.log(`  body (first 300 chars): ${anonymized.body.substring(0, 300)}`);
  console.log(`  mapping: ${JSON.stringify(Object.fromEntries(anonymized.mapping))}`);

  const prompt = fillPrompt(EMAIL_PARSE_PROMPT, {
    from: anonymized.from,
    to: anonymized.to,
    subject: anonymized.subject,
    date: email.receivedAt.toISOString(),
    body: anonymized.body,
  });

  try {
    const response = await generateCompletion(prompt);
    const rawParsed = extractJSON<EmailParseResult>(response);
    const parsed = rawParsed ? deanonymizeObject(rawParsed, anonymized.mapping) : null;

    console.log(`[email-parser] "${email.subject}" → is_job_related=${parsed?.is_job_related}, confidence=${parsed?.confidence}, company=${parsed?.company}, rejection=${parsed?.rejection_reason}`);

    if (!parsed) {
      await prisma.email.update({
        where: { id: emailId },
        data: {
          parseError: "AI response could not be parsed as JSON",
          aiAnalysis: JSON.parse(
            JSON.stringify({ raw_response: response.substring(0, 500) })
          ),
        },
      });
      return null;
    }

    // Step 3: Store analysis, mark as parsed
    const isJobRelated =
      parsed.is_job_related && parsed.confidence >= CONFIDENCE_THRESHOLD;

    await prisma.email.update({
      where: { id: emailId },
      data: {
        isParsed: true,
        parseError: null,
        aiAnalysis: JSON.parse(JSON.stringify(parsed)),
        reviewStatus: isJobRelated ? "PENDING" : "SKIPPED",
      },
    });

    return parsed;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : "Unknown AI error";
    // Store error but do NOT set isParsed = true
    await prisma.email.update({
      where: { id: emailId },
      data: { parseError: errorMsg },
    });
    // Re-throw rate limit errors so the caller can stop the loop
    if (errorMsg.includes("429")) {
      throw error;
    }
    return null;
  }
}

/**
 * Parse all unparsed emails that passed the pre-filter.
 */
export async function parseUnparsedEmails(userId: string) {
  const unparsed = await prisma.email.findMany({
    where: {
      isParsed: false,
      userId,
      filterStatus: "PASSED",
    },
    orderBy: { receivedAt: "desc" },
    take: 20,
  });

  const results = [];
  for (let i = 0; i < unparsed.length; i++) {
    const email = unparsed[i];
    try {
      const result = await parseEmail(email.id, userId);
      results.push({ emailId: email.id, result });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      results.push({ emailId: email.id, error: message });
      if (message.includes("not found") || message.includes("429")) break;
    }
    // Rate limit: wait between Groq calls
    if (i < unparsed.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  return results;
}
