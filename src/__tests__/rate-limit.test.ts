import { describe, it, expect, beforeEach } from "vitest";
import { rateLimit } from "@/lib/rate-limit";

// Reset globalThis store between tests
beforeEach(() => {
  const g = globalThis as unknown as { rateLimitStore?: Map<string, unknown> };
  g.rateLimitStore?.clear();
});

describe("rateLimit", () => {
  it("allows requests under the limit", () => {
    const result = rateLimit("test:user1", 3, 60_000);
    expect(result).toBeNull();
  });

  it("increments count on repeated calls", () => {
    rateLimit("test:user2", 3, 60_000);
    rateLimit("test:user2", 3, 60_000);
    const third = rateLimit("test:user2", 3, 60_000);
    expect(third).toBeNull();
  });

  it("blocks when limit is exceeded", () => {
    rateLimit("test:user3", 2, 60_000);
    rateLimit("test:user3", 2, 60_000);
    const blocked = rateLimit("test:user3", 2, 60_000);
    expect(blocked).not.toBeNull();
    expect(blocked!.status).toBe(429);
  });

  it("returns 429 with Retry-After header", async () => {
    rateLimit("test:user4", 1, 60_000);
    const blocked = rateLimit("test:user4", 1, 60_000);
    expect(blocked).not.toBeNull();
    const body = await blocked!.json();
    expect(body.error).toContain("Too many requests");
    expect(blocked!.headers.get("Retry-After")).toBeTruthy();
  });

  it("isolates different keys", () => {
    rateLimit("test:a", 1, 60_000);
    const resultB = rateLimit("test:b", 1, 60_000);
    expect(resultB).toBeNull();
  });
});
