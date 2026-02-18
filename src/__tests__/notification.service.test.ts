import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
    },
  },
}));

import { getNotifications } from "@/services/notification.service";
import { prisma } from "@/lib/prisma";

const mockedFindMany = prisma.application.findMany as unknown as ReturnType<typeof vi.fn>;

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function daysFromNow(n: number): Date {
  return new Date(Date.now() + n * 24 * 60 * 60 * 1000);
}

describe("getNotifications", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: all queries return empty — override per test
    mockedFindMany.mockResolvedValue([]);
  });

  it("returns empty array when no applications need attention", async () => {
    const result = await getNotifications("user1");
    expect(result).toEqual([]);
  });

  describe("stale_application", () => {
    it("generates notification for APPLIED apps with no update in 7+ days", async () => {
      mockedFindMany
        .mockResolvedValueOnce([
          {
            id: "app1",
            company: "Acme",
            position: "Dev",
            status: "APPLIED",
            updatedAt: daysAgo(10),
            appliedAt: daysAgo(20),
          },
        ])
        .mockResolvedValue([]); // other queries return empty

      const result = await getNotifications("user1");
      const stale = result.filter((n) => n.type === "stale_application");
      expect(stale).toHaveLength(1);
      expect(stale[0].company).toBe("Acme");
      expect(stale[0].applicationId).toBe("app1");
      expect(stale[0].daysSince).toBe(10);
    });

    it("assigns high priority when stale for 14+ days", async () => {
      mockedFindMany
        .mockResolvedValueOnce([
          {
            id: "app1",
            company: "Beta",
            position: "Dev",
            status: "SCREENING",
            updatedAt: daysAgo(15),
            appliedAt: daysAgo(20),
          },
        ])
        .mockResolvedValue([]);

      const result = await getNotifications("user1");
      const stale = result.find((n) => n.type === "stale_application");
      expect(stale?.priority).toBe("high");
    });

    it("assigns medium priority when stale for 7-13 days", async () => {
      mockedFindMany
        .mockResolvedValueOnce([
          {
            id: "app1",
            company: "Beta",
            position: "Dev",
            status: "APPLIED",
            updatedAt: daysAgo(8),
            appliedAt: daysAgo(10),
          },
        ])
        .mockResolvedValue([]);

      const result = await getNotifications("user1");
      const stale = result.find((n) => n.type === "stale_application");
      expect(stale?.priority).toBe("medium");
    });
  });

  describe("upcoming_interview", () => {
    it("generates notification for INTERVIEW apps with nextActionAt within 3 days", async () => {
      mockedFindMany
        .mockResolvedValueOnce([]) // stale query
        .mockResolvedValueOnce([
          {
            id: "app2",
            company: "Corp",
            position: "PM",
            status: "INTERVIEW",
            nextActionAt: daysFromNow(1),
            updatedAt: daysAgo(1),
          },
        ])
        .mockResolvedValue([]); // follow-up query

      const result = await getNotifications("user1");
      const interview = result.filter((n) => n.type === "upcoming_interview");
      expect(interview).toHaveLength(1);
      expect(interview[0].company).toBe("Corp");
      expect(interview[0].priority).toBe("high"); // <=1 day = high
    });

    it("assigns medium priority for interview 2-3 days away", async () => {
      mockedFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "app2",
            company: "Corp",
            position: "PM",
            status: "TECHNICAL",
            nextActionAt: daysFromNow(2),
            updatedAt: daysAgo(1),
          },
        ])
        .mockResolvedValue([]);

      const result = await getNotifications("user1");
      const interview = result.find((n) => n.type === "upcoming_interview");
      expect(interview?.priority).toBe("medium");
    });
  });

  describe("follow_up_reminder", () => {
    it("generates notification for APPLIED apps with no follow-up after 14+ days", async () => {
      mockedFindMany
        .mockResolvedValueOnce([]) // stale
        .mockResolvedValueOnce([]) // interview
        .mockResolvedValueOnce([
          {
            id: "app3",
            company: "Startup",
            position: "Dev",
            status: "APPLIED",
            appliedAt: daysAgo(16),
            updatedAt: daysAgo(16),
          },
        ]);

      const result = await getNotifications("user1");
      const followUp = result.filter((n) => n.type === "follow_up_reminder");
      expect(followUp).toHaveLength(1);
      expect(followUp[0].company).toBe("Startup");
    });

    it("assigns high priority when applied 21+ days ago with no follow-up", async () => {
      mockedFindMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: "app3",
            company: "Startup",
            position: "Dev",
            status: "APPLIED",
            appliedAt: daysAgo(25),
            updatedAt: daysAgo(25),
          },
        ]);

      const result = await getNotifications("user1");
      const followUp = result.find((n) => n.type === "follow_up_reminder");
      expect(followUp?.priority).toBe("high");
    });
  });

  describe("sorting", () => {
    it("sorts high priority before medium before low", async () => {
      mockedFindMany
        .mockResolvedValueOnce([
          // medium priority stale (8 days)
          {
            id: "stale1",
            company: "A",
            position: "Dev",
            status: "APPLIED",
            updatedAt: daysAgo(8),
            appliedAt: daysAgo(10),
          },
        ])
        .mockResolvedValueOnce([
          // high priority interview (today)
          {
            id: "int1",
            company: "B",
            position: "PM",
            status: "INTERVIEW",
            nextActionAt: daysFromNow(0),
            updatedAt: daysAgo(1),
          },
        ])
        .mockResolvedValueOnce([]);

      const result = await getNotifications("user1");
      expect(result.length).toBeGreaterThan(0);
      // High priority items come first
      const priorities = result.map((n) => n.priority);
      const highIdx = priorities.indexOf("high");
      const medIdx = priorities.indexOf("medium");
      if (highIdx !== -1 && medIdx !== -1) {
        expect(highIdx).toBeLessThan(medIdx);
      }
    });
  });
});
