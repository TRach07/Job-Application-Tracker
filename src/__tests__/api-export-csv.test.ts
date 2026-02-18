import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/services/export.service", () => ({
  getExportData: vi.fn(),
  toCSV: vi.fn(),
}));

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { GET } from "@/app/api/export/csv/route";
import { auth } from "@/lib/auth";
import { getExportData, toCSV } from "@/services/export.service";

const mockedAuth = auth as unknown as ReturnType<typeof vi.fn>;
const mockedGetExportData = getExportData as unknown as ReturnType<typeof vi.fn>;
const mockedToCSV = toCSV as unknown as ReturnType<typeof vi.fn>;

function makeRequest(locale?: string) {
  const url = locale
    ? `http://localhost:3000/api/export/csv?locale=${locale}`
    : "http://localhost:3000/api/export/csv";
  return new NextRequest(url, { method: "GET" });
}

describe("GET /api/export/csv", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    mockedAuth.mockResolvedValue(null as never);
    const res = await GET(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns CSV content-type on success", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetExportData.mockResolvedValue([]);
    mockedToCSV.mockReturnValue("Company,Position\n");

    const res = await GET(makeRequest());
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("text/csv");
  });

  it("includes Content-Disposition header for file download", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetExportData.mockResolvedValue([]);
    mockedToCSV.mockReturnValue("Company,Position\n");

    const res = await GET(makeRequest());
    const disposition = res.headers.get("Content-Disposition");
    expect(disposition).toContain("attachment");
    expect(disposition).toContain("applications-");
    expect(disposition).toContain(".csv");
  });

  it("calls getExportData with the authenticated user's id", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user42" } } as never);
    mockedGetExportData.mockResolvedValue([]);
    mockedToCSV.mockReturnValue("");

    await GET(makeRequest());
    expect(mockedGetExportData).toHaveBeenCalledWith("user42");
  });

  it("uses French headers when locale is not 'en'", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetExportData.mockResolvedValue([]);
    mockedToCSV.mockReturnValue("");

    await GET(makeRequest("fr"));
    const headersArg = mockedToCSV.mock.calls[0][1];
    expect(headersArg.company).toBe("Entreprise");
  });

  it("uses English headers when locale is 'en'", async () => {
    mockedAuth.mockResolvedValue({ user: { id: "user1" } } as never);
    mockedGetExportData.mockResolvedValue([]);
    mockedToCSV.mockReturnValue("");

    await GET(makeRequest("en"));
    const headersArg = mockedToCSV.mock.calls[0][1];
    expect(headersArg.company).toBe("Company");
  });
});
