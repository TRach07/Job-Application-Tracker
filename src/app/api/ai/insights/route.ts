export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics.service";
import { generateCompletion } from "@/lib/groq";
import { extractJSON } from "@/lib/ai-utils";
import { anonymizeInsightsFields, deanonymizeObject } from "@/lib/anonymizer";
import { INSIGHTS_PROMPT, fillPrompt } from "@/constants/prompts";
import type { AIInsightsResponse } from "@/types/follow-up";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getAnalytics(session.user.id);

    // Anonymize user name before sending to external AI
    const anonymized = anonymizeInsightsFields({
      userName: session.user.name || "l'utilisateur",
    });

    const prompt = fillPrompt(INSIGHTS_PROMPT, {
      userName: anonymized.userName,
      analyticsData: JSON.stringify(analytics, null, 2),
    });

    const response = await generateCompletion(prompt);
    const rawInsights = extractJSON<AIInsightsResponse>(response);

    if (!rawInsights) {
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: 500 }
      );
    }

    // De-anonymize to restore real user name
    const insights = deanonymizeObject(rawInsights, anonymized.mapping);

    return NextResponse.json({ data: insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // If Groq API is unavailable, return a graceful fallback
    if (message.includes("fetch failed") || message.includes("GROQ_API_KEY") || message.includes("Groq failed") || message.includes("Groq API error")) {
      return NextResponse.json({
        data: {
          insights: [
            {
              type: "warning" as const,
              title: "AI unavailable",
              description: "Groq API is not reachable or the API key is missing. Check your GROQ_API_KEY in .env.local.",
              action: "Verify GROQ_API_KEY is set in .env.local",
            },
          ],
        },
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
