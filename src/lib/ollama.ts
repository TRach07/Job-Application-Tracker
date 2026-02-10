const OLLAMA_BASE_URL =
  process.env.OLLAMA_BASE_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "qwen2:1.5b";
const MAX_RETRIES = 2;
const TIMEOUT_MS = 180000; // 3 minutes - CPU inference is slow

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
}

export async function generateCompletion(prompt: string): Promise<string> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

      const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt,
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 512,
            num_ctx: 2048,
          },
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        throw new Error(
          `Model "${OLLAMA_MODEL}" not found. Install it with: ollama pull ${OLLAMA_MODEL}`
        );
      }

      if (!response.ok) {
        // Try to read error body for more context (e.g. memory errors)
        let errorDetail = "";
        try {
          const errorBody = await response.text();
          errorDetail = errorBody ? `: ${errorBody.slice(0, 200)}` : "";
        } catch { /* ignore */ }
        throw new Error(`Ollama API error: ${response.status}${errorDetail}`);
      }

      const data = (await response.json()) as OllamaResponse;
      return data.response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      // Don't retry on errors that won't resolve with retries
      if (lastError.message.includes("not found") || lastError.message.includes("system memory")) {
        break;
      }
      if (attempt < MAX_RETRIES) {
        await new Promise((resolve) =>
          setTimeout(resolve, 1000 * attempt)
        );
      }
    }
  }

  throw new Error(
    `Ollama failed after ${MAX_RETRIES} attempts: ${lastError?.message}`
  );
}

export function extractJSON<T>(text: string): T | null {
  // Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // Try to extract JSON from text
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function checkOllamaHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
