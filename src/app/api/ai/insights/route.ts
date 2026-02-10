export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAnalytics } from "@/services/analytics.service";
import { generateCompletion, extractJSON } from "@/lib/ollama";
import { INSIGHTS_PROMPT, fillPrompt } from "@/constants/prompts";
import type { AIInsightsResponse } from "@/types/follow-up";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const analytics = await getAnalytics(session.user.id);

    const prompt = fillPrompt(INSIGHTS_PROMPT, {
      userName: session.user.name || "l'utilisateur",
      analyticsData: JSON.stringify(analytics, null, 2),
    });

    const response = await generateCompletion(prompt);
    const insights = extractJSON<AIInsightsResponse>(response);

    if (!insights) {
      return NextResponse.json(
        { error: "Failed to generate insights" },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: insights });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    // If Ollama is not available or can't load the model, return a graceful fallback
    if (message.includes("fetch failed") || message.includes("ECONNREFUSED") || message.includes("Failed to generate") || message.includes("Ollama failed") || message.includes("system memory") || message.includes("not found")) {
      return NextResponse.json({
        data: {
          insights: [
            {
              type: "warning" as const,
              title: "IA indisponible",
              description: "Le modèle Ollama n'est pas chargé ou n'a pas assez de mémoire. Vérifiez que le conteneur Docker a suffisamment de RAM.",
              action: "Vérifiez Docker Desktop > Settings > Resources > Memory",
            },
          ],
        },
      });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
