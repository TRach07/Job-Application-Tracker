import { env } from "@/lib/env";

const TIMEOUT_MS = 30000;
const MAX_RETRIES = 2;

interface ProviderConfig {
  apiUrl: string;
  defaultModel: string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  groq: {
    apiUrl: "https://api.groq.com/openai/v1/chat/completions",
    defaultModel: "llama-3.3-70b-versatile",
  },
  openai: {
    apiUrl: "https://api.openai.com/v1/chat/completions",
    defaultModel: "gpt-4o-mini",
  },
  mistral: {
    apiUrl: "https://api.mistral.ai/v1/chat/completions",
    defaultModel: "mistral-small-latest",
  },
};

function getConfig() {
  const provider = env.AI_PROVIDER;
  const config = PROVIDERS[provider];

  if (!config) {
    throw new Error(
      `Unknown AI_PROVIDER "${provider}". Supported: ${Object.keys(PROVIDERS).join(", ")}`
    );
  }

  return {
    apiUrl: config.apiUrl,
    model: env.AI_MODEL || config.defaultModel,
    apiKey: env.AI_API_KEY,
  };
}

interface ChatCompletionResponse {
  choices: {
    message: { content: string };
    finish_reason: string;
  }[];
}

export async function generateCompletion(prompt: string): Promise<string> {
  const { apiUrl, model, apiKey } = getConfig();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.3,
          max_tokens: 1024,
          response_format: { type: "json_object" },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        let errorDetail = "";
        try {
          const errorBody = await response.text();
          errorDetail = errorBody ? `: ${errorBody.slice(0, 200)}` : "";
        } catch {
          /* ignore */
        }
        throw new Error(`AI API error: ${response.status}${errorDetail}`);
      }

      const data = (await response.json()) as ChatCompletionResponse;
      const text = data.choices?.[0]?.message?.content;

      if (!text) {
        throw new Error("AI provider returned empty response");
      }

      return text;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (lastError.message.includes("API_KEY")) break;
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt)
        );
      }
    }
  }

  throw new Error(
    `AI request failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}
