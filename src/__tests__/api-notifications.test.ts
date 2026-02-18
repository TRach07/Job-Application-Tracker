import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/notification.service", () => ({
  getNotifications: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET } from "@/app/api/notifications/route";
import { auth } from "@/lib/auth";
import { getNotifications } from "@/services/notification.service";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedGetNotifications = getNotifications as unknown as ReturnType<typeof vi.fn>;

function makeRequest() {
  return new NextRequest("http://localhost:3000/api/notifications", {
    method: "GET",
  });
}

describe("GET /api/notifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns 200 with empty array when no notifications", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetNotifications.mockResolvedValue([]);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toEqual([]);
  });

  it("returns notifications array from service", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    const fakeNotifications = [
      {
        id: "stale-app1",
        type: "stale_application",
        priority: "medium",
        applicationId: "app1",
        company: "Acme",
        position: "Dev",
        status: "APPLIED",
        daysSince: 9,
        message: "",
        createdAt: new Date().toISOString(),
      },
    ];
    mockedGetNotifications.mockResolvedValue(fakeNotifications);

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].type).toBe("stale_application");
    expect(json.data[0].company).toBe("Acme");
  });

  it("calls getNotifications with the authenticated user's id", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user99" } } as never);
    mockedGetNotifications.mockResolvedValue([]);

    await GET(makeRequest());
    expect(mockedGetNotifications).toHaveBeenCalledWith("user99");
  });

  it("returns 500 when service throws", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetNotifications.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest());
    expect(res.status).toBe(500);
  });
});
