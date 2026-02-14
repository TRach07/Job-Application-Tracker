import { NextResponse } from "next/server";

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// Persist store across hot-reloads in dev (same pattern as Prisma)
const globalForRateLimit = globalThis as unknown as {
  rateLimitStore?: Map<string, RateLimitEntry>;
  rateLimitCleanup?: number;
};

const store =
  globalForRateLimit.rateLimitStore ?? new Map<string, RateLimitEntry>();
globalForRateLimit.rateLimitStore = store;

/**
 * In-memory rate limiter.
 * Returns null if allowed, or a 429 NextResponse if rate limited.
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): NextResponse | null {
  const now = Date.now();
  const entry = store.get(key);

  // Clean expired entry on access
  if (entry && now > entry.resetAt) {
    store.delete(key);
  }

  const current = store.get(key);

  if (!current) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  if (current.count >= maxRequests) {
    const retryAfter = Math.ceil((current.resetAt - now) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(retryAfter) },
      }
    );
  }

  current.count++;
  return null;
}
