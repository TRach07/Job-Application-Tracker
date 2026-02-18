import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Prisma
vi.mock("@/lib/prisma", () => ({
  prisma: {
    application: {
      findMany: vi.fn(),
    },
  },
}));

import { toCSV, getExportData } from "@/services/export.service";
import { prisma } from "@/lib/prisma";

const mockedFindMany = prisma.application.findMany as unknown as ReturnType<typeof vi.fn>;

const HEADERS = {
  company: "Company",
  position: "Position",
  status: "Status",
  appliedAt: "Applied date",
  location: "Location",
  salary: "Salary",
  contactName: "Contact",
  contactEmail: "Contact email",
  source: "Source",
  url: "URL",
  notes: "Notes",
} as const;

// --- toCSV ---
describe("toCSV", () => {
  it("outputs a header row + data row", () => {
    const rows = [
      {
        company: "Acme",
        position: "Engineer",
        status: "APPLIED" as const,
        appliedAt: "2024-01-15",
        location: "Paris",
        salary: "50k",
        contactName: "Alice",
        contactEmail: "alice@acme.com",
        source: "MANUAL" as const,
        url: "https://acme.com/job",
        notes: "",
      },
    ];

    const csv = toCSV(rows, HEADERS);
    const lines = csv.split("\n");

    expect(lines).toHaveLength(2);
    expect(lines[0]).toBe(
      "Company,Position,Status,Applied date,Location,Salary,Contact,Contact email,Source,URL,Notes"
    );
    expect(lines[1]).toContain("Acme");
    expect(lines[1]).toContain("Engineer");
  });

  it("escapes values containing commas", () => {
    const rows = [
      {
        company: "Acme, Inc",
        position: "Dev",
        status: "APPLIED" as const,
        appliedAt: "2024-01-01",
        location: "",
        salary: "",
        contactName: "",
        contactEmail: "",
        source: "MANUAL" as const,
        url: "",
        notes: "",
      },
    ];

    const csv = toCSV(rows, HEADERS);
    expect(csv).toContain('"Acme, Inc"');
  });

  it("escapes values containing double quotes", () => {
    const rows = [
      {
        company: 'Say "Hello"',
        position: "Dev",
        status: "APPLIED" as const,
        appliedAt: "2024-01-01",
        location: "",
        salary: "",
        contactName: "",
        contactEmail: "",
        source: "MANUAL" as const,
        url: "",
        notes: "",
      },
    ];

    const csv = toCSV(rows, HEADERS);
    expect(csv).toContain('"Say ""Hello"""');
  });

  it("handles newlines in values", () => {
    const rows = [
      {
        company: "Acme",
        position: "Dev",
        status: "APPLIED" as const,
        appliedAt: "2024-01-01",
        location: "",
        salary: "",
        contactName: "",
        contactEmail: "",
        source: "MANUAL" as const,
        url: "",
        notes: "Line1\nLine2",
      },
    ];

    const csv = toCSV(rows, HEADERS);
    expect(csv).toContain('"Line1\nLine2"');
  });

  it("produces only header row when rows are empty", () => {
    const csv = toCSV([], HEADERS);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toContain("Company");
  });

  it("produces multiple data rows in correct order", () => {
    const rows = [
      {
        company: "Alpha",
        position: "Dev",
        status: "APPLIED" as const,
        appliedAt: "2024-01-01",
        location: "",
        salary: "",
        contactName: "",
        contactEmail: "",
        source: "MANUAL" as const,
        url: "",
        notes: "",
      },
      {
        company: "Beta",
        position: "PM",
        status: "INTERVIEW" as const,
        appliedAt: "2024-02-01",
        location: "",
        salary: "",
        contactName: "",
        contactEmail: "",
        source: "EMAIL_DETECTED" as const,
        url: "",
        notes: "",
      },
    ];

    const csv = toCSV(rows, HEADERS);
    const lines = csv.split("\n");
    expect(lines).toHaveLength(3); // header + 2 data rows
    expect(lines[1]).toContain("Alpha");
    expect(lines[2]).toContain("Beta");
  });
});

// --- getExportData ---
describe("getExportData", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("maps prisma rows to export format", async () => {
    mockedFindMany.mockResolvedValue([
      {
        company: "Acme",
        position: "Engineer",
        status: "APPLIED",
        appliedAt: new Date("2024-03-10T12:00:00Z"),
        location: "Paris",
        salary: "60k",
        contactName: "Bob",
        contactEmail: "bob@acme.com",
        source: "MANUAL",
        url: "https://acme.com",
        notes: "Good fit",
      },
    ]);

    const rows = await getExportData("user1");

    expect(rows).toHaveLength(1);
    expect(rows[0].company).toBe("Acme");
    expect(rows[0].appliedAt).toBe("2024-03-10"); // ISO date only
    expect(rows[0].location).toBe("Paris");
  });

  it("replaces null optional fields with empty strings", async () => {
    mockedFindMany.mockResolvedValue([
      {
        company: "Beta",
        position: "Dev",
        status: "REJECTED",
        appliedAt: new Date("2024-01-01T00:00:00Z"),
        location: null,
        salary: null,
        contactName: null,
        contactEmail: null,
        source: "EMAIL_DETECTED",
        url: null,
        notes: null,
      },
    ]);

    const rows = await getExportData("user1");

    expect(rows[0].location).toBe("");
    expect(rows[0].salary).toBe("");
    expect(rows[0].contactName).toBe("");
    expect(rows[0].contactEmail).toBe("");
    expect(rows[0].url).toBe("");
    expect(rows[0].notes).toBe("");
  });

  it("returns empty array when no applications exist", async () => {
    mockedFindMany.mockResolvedValue([]);
    const rows = await getExportData("user1");
    expect(rows).toHaveLength(0);
  });

  it("queries with correct userId", async () => {
    mockedFindMany.mockResolvedValue([]);
    await getExportData("specific-user");
    expect(mockedFindMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "specific-user" } })
    );
  });
});
