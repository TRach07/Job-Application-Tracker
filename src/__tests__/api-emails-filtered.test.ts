import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    email: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock email parser
vi.mock("@/services/email-parser.service", () => ({
  parseEmail: vi.fn(),
}));

// Mock email review service
vi.mock("@/services/email-review.service", () => ({
  getFilteredEmails: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/emails/filtered/route";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseEmail } from "@/services/email-parser.service";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedParseEmail = parseEmail as unknown as ReturnType<typeof vi.fn>;
const mockedEmailFindFirst = prisma.email.findFirst as unknown as ReturnType<typeof vi.fn>;
const mockedEmailUpdate = prisma.email.update as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/emails/filtered", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/emails/filtered", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest({ emailId: "test" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when emailId is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("returns 400 when emailId is empty string", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ emailId: "" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when emailId is not a string", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ emailId: 123 }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when email not found", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedEmailFindFirst.mockResolvedValue(null as never);
    const res = await POST(makeRequest({ emailId: "nonexistent" }));
    expect(res.status).toBe(404);
  });

  it("returns 200 on valid request", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedEmailFindFirst.mockResolvedValue({ id: "email1" } as never);
    mockedEmailUpdate.mockResolvedValue({} as never);
    mockedParseEmail.mockResolvedValue(undefined as never);

    const res = await POST(makeRequest({ emailId: "email1" }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.success).toBe(true);
  });
});
