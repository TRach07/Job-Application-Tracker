import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock auth
vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

// Mock email review service
vi.mock("@/services/email-review.service", () => ({
  getReviewQueue: vi.fn(),
  processReviewAction: vi.fn(),
}));

// Mock logger
vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { POST } from "@/app/api/emails/review/route";
import { auth } from "@/lib/auth";
import { processReviewAction } from "@/services/email-review.service";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedProcessReview = processReviewAction as unknown as ReturnType<typeof vi.fn>;

function makeRequest(body: unknown) {
  return new NextRequest("http://localhost:3000/api/emails/review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/emails/review", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await POST(makeRequest({ emailId: "test", action: "approve" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when emailId is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ action: "approve" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when action is missing", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ emailId: "test" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when action is invalid", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ emailId: "test", action: "invalid" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when emailId is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({ emailId: "", action: "approve" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when body is empty", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("accepts approve action", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedProcessReview.mockResolvedValue({ success: true } as never);
    const res = await POST(makeRequest({ emailId: "e1", action: "approve" }));
    expect(res.status).toBe(200);
  });

  it("accepts reject action", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedProcessReview.mockResolvedValue({ success: true } as never);
    const res = await POST(makeRequest({ emailId: "e1", action: "reject" }));
    expect(res.status).toBe(200);
  });

  it("accepts edit_approve action with optional fields", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedProcessReview.mockResolvedValue({ success: true } as never);
    const res = await POST(
      makeRequest({
        emailId: "e1",
        action: "edit_approve",
        editedCompany: "Acme",
        editedPosition: "Dev",
      })
    );
    expect(res.status).toBe(200);
  });
});
