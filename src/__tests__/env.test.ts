import { describe, it, expect } from "vitest";
import { z } from "zod";

// We test the schema logic directly (not the module export, which reads real env)
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  AI_PROVIDER: z.enum(["groq", "openai", "mistral"]).default("groq"),
  AI_API_KEY: z.string().min(1, "AI_API_KEY is required"),
  AI_MODEL: z.string().optional().default(""),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "a-very-long-secret-key",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  AI_API_KEY: "test_api_key",
};

describe("env schema validation", () => {
  it("accepts valid environment variables", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
  });

  it("defaults NODE_ENV to development", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.NODE_ENV).toBe("development");
    }
  });

  it("defaults AI_PROVIDER to groq", () => {
    const result = envSchema.safeParse(validEnv);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.AI_PROVIDER).toBe("groq");
    }
  });

  it("accepts openai as AI_PROVIDER", () => {
    const result = envSchema.safeParse({ ...validEnv, AI_PROVIDER: "openai" });
    expect(result.success).toBe(true);
  });

  it("rejects invalid AI_PROVIDER", () => {
    const result = envSchema.safeParse({ ...validEnv, AI_PROVIDER: "claude" });
    expect(result.success).toBe(false);
  });

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL: _, ...rest } = validEnv;
    const result = envSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("rejects invalid NEXTAUTH_URL", () => {
    const result = envSchema.safeParse({ ...validEnv, NEXTAUTH_URL: "not-a-url" });
    expect(result.success).toBe(false);
  });

  it("rejects short NEXTAUTH_SECRET", () => {
    const result = envSchema.safeParse({ ...validEnv, NEXTAUTH_SECRET: "short" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid NODE_ENV", () => {
    const result = envSchema.safeParse({ ...validEnv, NODE_ENV: "staging" });
    expect(result.success).toBe(false);
  });

  it("reports all missing fields at once", () => {
    const result = envSchema.safeParse({});
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThanOrEqual(5);
    }
  });
});
