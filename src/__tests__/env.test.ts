import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { z } from "zod";

// We test the schema logic directly (not the module export, which reads real env)
const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(16, "NEXTAUTH_SECRET must be at least 16 characters"),
  GOOGLE_CLIENT_ID: z.string().min(1, "GOOGLE_CLIENT_ID is required"),
  GOOGLE_CLIENT_SECRET: z.string().min(1, "GOOGLE_CLIENT_SECRET is required"),
  GROQ_API_KEY: z.string().min(1, "GROQ_API_KEY is required"),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

const validEnv = {
  DATABASE_URL: "postgresql://user:pass@localhost:5432/db",
  NEXTAUTH_URL: "http://localhost:3000",
  NEXTAUTH_SECRET: "a-very-long-secret-key",
  GOOGLE_CLIENT_ID: "client-id",
  GOOGLE_CLIENT_SECRET: "client-secret",
  GROQ_API_KEY: "gsk_test_key",
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

  it("rejects missing DATABASE_URL", () => {
    const { DATABASE_URL, ...rest } = validEnv;
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
      expect(result.error.issues.length).toBeGreaterThanOrEqual(6);
    }
  });
});
