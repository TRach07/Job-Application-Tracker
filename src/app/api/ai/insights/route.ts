export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { withAuth } from "@/lib/api-handler";
import { getAnalytics } from "@/services/analytics.service";
import { generateCompletion } from "@/lib/ai-provider";
import { extractJSON } from "@/lib/ai-utils";
import { anonymizeInsightsFields, deanonymizeObject } from "@/lib/anonymizer";
import { rateLimit } from "@/lib/rate-limit";
import { INSIGHTS_PROMPT, fillPrompt } from "@/constants/prompts";
import type { AIInsightsResponse } from "@/types/follow-up";

function isAIUnavailable(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : "";
  return msg.includes("fetch failed")
    || msg.includes("API_KEY")
    || msg.includes("AI request failed")
    || msg.includes("AI API error");
}

export const GET = withAuth(async (req, { userId, userName }) => {
  const limited = rateLimit(`ai-insights:${userId}`, 10, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(req.url);
  const locale = searchParams.get("locale") === "en" ? "en" : "fr";

  const analytics = await getAnalytics(userId, locale);

  const defaultUser = locale === "en" ? "the user" : "l'utilisateur";
  const langInstruction = locale === "en"
    ? "IMPORTANT: Respond ONLY in English."
    : "IMPORTANT : Réponds UNIQUEMENT en français.";

  const anonymized = anonymizeInsightsFields({
    userName: userName || defaultUser,
  });

  const prompt = fillPrompt(INSIGHTS_PROMPT, {
    userName: anonymized.userName,
    analyticsData: JSON.stringify(analytics, null, 2),
    languageInstruction: langInstruction,
  });

  const response = await generateCompletion(prompt);
  const rawInsights = extractJSON<AIInsightsResponse>(response);

  if (!rawInsights) {
    return NextResponse.json(
      { error: "Failed to generate insights" },
      { status: 500 }
    );
  }

  const insights = deanonymizeObject(rawInsights, anonymized.mapping);

  return NextResponse.json({ data: insights });
}, {
  route: "GET /api/ai/insights",
  onError: (error) => {
    if (isAIUnavailable(error)) {
      return NextResponse.json({
        data: {
          insights: [
            {
              type: "warning" as const,
              title: "AI unavailable",
              description: "AI API is not reachable or the API key is missing. Check your AI_API_KEY in .env.local.",
              action: "Verify AI_API_KEY is set in .env.local",
            },
          ],
        },
      });
    }
    return null;
  },
});
