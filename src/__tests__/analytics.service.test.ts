import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
    },
  },
}));

import { getAnalytics } from "@/services/analytics.service";
import { prisma } from "@/lib/prisma";

const mockedFindMany = prisma.application.findMany as unknown as ReturnType<typeof vi.fn>;

function makeApp(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "app1",
    company: "Acme",
    position: "Engineer",
    status: "APPLIED",
    source: "MANUAL",
    appliedAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
    statusHistory: [],
    _count: { emails: 0, followUps: 0 },
    ...overrides,
  };
}

describe("getAnalytics", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("basic metrics", () => {
    it("returns zero total when no applications", async () => {
      mockedFindMany.mockResolvedValue([]);
      const result = await getAnalytics("user1");
      expect(result.total).toBe(0);
      expect(result.responseRate).toBe(0);
    });

    it("computes total correctly", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ status: "APPLIED" }),
        makeApp({ id: "app2", status: "INTERVIEW" }),
        makeApp({ id: "app3", status: "REJECTED" }),
      ]);
      const result = await getAnalytics("user1");
      expect(result.total).toBe(3);
    });

    it("computes response rate excluding APPLIED and NO_RESPONSE", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ status: "APPLIED" }),
        makeApp({ id: "app2", status: "SCREENING" }),
        makeApp({ id: "app3", status: "NO_RESPONSE" }),
        makeApp({ id: "app4", status: "REJECTED" }),
      ]);
      const result = await getAnalytics("user1");
      // 2 out of 4 have response (SCREENING + REJECTED)
      expect(result.responseRate).toBe(50);
    });

    it("computes status distribution", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ status: "APPLIED" }),
        makeApp({ id: "app2", status: "APPLIED" }),
        makeApp({ id: "app3", status: "INTERVIEW" }),
      ]);
      const result = await getAnalytics("user1");
      expect(result.statusDistribution["APPLIED"]).toBe(2);
      expect(result.statusDistribution["INTERVIEW"]).toBe(1);
    });
  });

  describe("funnel", () => {
    it("builds funnel with correct stage counts", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ status: "APPLIED" }),
        makeApp({ id: "app2", status: "SCREENING" }),
        makeApp({ id: "app3", status: "INTERVIEW" }),
        makeApp({ id: "app4", status: "OFFER" }),
        makeApp({ id: "app5", status: "ACCEPTED" }),
      ]);
      const result = await getAnalytics("user1");
      const stages = Object.fromEntries(result.funnel.map((f) => [f.stage, f.count]));
      // applied = all 5; screening = SCREENING + INTERVIEW + OFFER + ACCEPTED = 4
      expect(stages["applied"]).toBe(5);
      expect(stages["screening"]).toBe(4);
      expect(stages["interview"]).toBe(3);
      expect(stages["offer"]).toBe(2);
      expect(stages["accepted"]).toBe(1);
    });

    it("computes conversion rate for first stage as 100%", async () => {
      mockedFindMany.mockResolvedValue([makeApp({ status: "APPLIED" })]);
      const result = await getAnalytics("user1");
      expect(result.funnel[0].conversionRate).toBe(100);
    });
  });

  describe("source breakdown", () => {
    it("counts manual vs email_detected sources", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ source: "MANUAL" }),
        makeApp({ id: "app2", source: "MANUAL" }),
        makeApp({ id: "app3", source: "EMAIL_DETECTED" }),
      ]);
      const result = await getAnalytics("user1");
      expect(result.sourceBreakdown.manual).toBe(2);
      expect(result.sourceBreakdown.emailDetected).toBe(1);
    });
  });

  describe("company performance", () => {
    it("groups applications by company", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ company: "Acme", status: "APPLIED" }),
        makeApp({ id: "app2", company: "Acme", status: "INTERVIEW" }),
        makeApp({ id: "app3", company: "Beta", status: "APPLIED" }),
      ]);
      const result = await getAnalytics("user1");
      const acme = result.byCompany.find((c) => c.company === "Acme");
      const beta = result.byCompany.find((c) => c.company === "Beta");
      expect(acme?.total).toBe(2);
      expect(beta?.total).toBe(1);
    });

    it("computes response rate per company", async () => {
      mockedFindMany.mockResolvedValue([
        makeApp({ company: "Acme", status: "APPLIED" }),
        makeApp({ id: "app2", company: "Acme", status: "SCREENING" }),
      ]);
      const result = await getAnalytics("user1");
      const acme = result.byCompany.find((c) => c.company === "Acme");
      expect(acme?.responded).toBe(1);
      expect(acme?.responseRate).toBe(50);
    });
  });

  describe("filters", () => {
    it("passes status filter to Prisma where clause", async () => {
      mockedFindMany.mockResolvedValue([]);
      await getAnalytics("user1", "fr", { status: "INTERVIEW" });
      expect(mockedFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "INTERVIEW" }),
        })
      );
    });

    it("passes source filter to Prisma where clause", async () => {
      mockedFindMany.mockResolvedValue([]);
      await getAnalytics("user1", "fr", { source: "EMAIL_DETECTED" });
      expect(mockedFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ source: "EMAIL_DETECTED" }),
        })
      );
    });

    it("passes period filter as appliedAt gte to Prisma", async () => {
      mockedFindMany.mockResolvedValue([]);
      const before = Date.now();
      await getAnalytics("user1", "fr", { period: "30d" });
      const after = Date.now();

      const call = mockedFindMany.mock.calls[0][0];
      const gteDate: Date = call.where.appliedAt.gte;
      // The date should be ~30 days before now
      const expectedMin = new Date(before - 30 * 24 * 60 * 60 * 1000 - 1000);
      const expectedMax = new Date(after - 30 * 24 * 60 * 60 * 1000 + 1000);
      expect(gteDate.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
      expect(gteDate.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
    });

    it("does not add appliedAt filter when period is not provided", async () => {
      mockedFindMany.mockResolvedValue([]);
      await getAnalytics("user1", "fr", {});
      const call = mockedFindMany.mock.calls[0][0];
      expect(call.where.appliedAt).toBeUndefined();
    });
  });

  describe("average response time", () => {
    it("returns null when no status history", async () => {
      mockedFindMany.mockResolvedValue([makeApp({ statusHistory: [] })]);
      const result = await getAnalytics("user1");
      expect(result.avgResponseTimeDays).toBeNull();
    });

    it("computes avg response time from status history", async () => {
      const appliedAt = new Date("2024-01-01T00:00:00Z");
      const changedAt = new Date("2024-01-11T00:00:00Z"); // 10 days later
      mockedFindMany.mockResolvedValue([
        makeApp({
          appliedAt,
          statusHistory: [
            { fromStatus: "APPLIED", toStatus: "SCREENING", changedAt },
          ],
        }),
      ]);
      const result = await getAnalytics("user1");
      expect(result.avgResponseTimeDays).toBe(10);
    });
  });
});
