import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDrugEvents, fetchDrugInteraction, sanitizeDrugName } from "../api";
import { mockOkJson, createMockFetch } from "./helpers";

const mockFetch = createMockFetch();

beforeEach(() => {
  mockFetch.mockReset();
});

describe("sanitizeDrugName", () => {
  it("removes double quotes", () => {
    expect(sanitizeDrugName('aspirin"extra')).toBe("aspirinextra");
  });

  it("removes backslashes", () => {
    expect(sanitizeDrugName("aspirin\\extra")).toBe("aspirinextra");
  });

  it("leaves normal names untouched", () => {
    expect(sanitizeDrugName("ASPIRIN")).toBe("ASPIRIN");
  });
});

describe("fetchDrugEvents", () => {
  it("returns parsed drug event results with totalReports", async () => {
    // count endpoint + report count endpoint run in parallel
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return mockOkJson({
          results: [
            { term: "NAUSEA", count: 500 },
            { term: "HEADACHE", count: 300 },
          ],
        });
      }
      return mockOkJson({
        meta: { results: { total: 10000 } },
      });
    });

    const result = await fetchDrugEvents("ASPIRIN");

    expect(result.drugName).toBe("ASPIRIN");
    expect(result.totalReports).toBe(10000);
    expect(result.topReactions).toHaveLength(2);
    expect(result.topReactions[0]).toEqual({ term: "NAUSEA", count: 500 });
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws on non-ok count response", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return { ok: false, status: 500 };
      }
      return mockOkJson({ meta: { results: { total: 0 } } });
    });

    await expect(fetchDrugEvents("ASPIRIN")).rejects.toThrow(
      "FDA API error: 500"
    );
  });

  it("returns 0 totalReports when meta request fails", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return mockOkJson({ results: [] });
      }
      return { ok: false, status: 500 };
    });

    const result = await fetchDrugEvents("ASPIRIN");
    expect(result.totalReports).toBe(0);
  });

  it("handles missing results gracefully", async () => {
    mockFetch.mockImplementation(async () => mockOkJson({}));

    const result = await fetchDrugEvents("UNKNOWN");
    expect(result.topReactions).toEqual([]);
    expect(result.totalReports).toBe(0);
  });

  it("encodes drug name in the API URL", async () => {
    mockFetch.mockImplementation(async () => mockOkJson({ results: [] }));

    await fetchDrugEvents("ASPIRIN");

    const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls.some((u) => u.includes("ASPIRIN"))).toBe(true);
    expect(urls.some((u) => u.includes("patient.drug.medicinalproduct"))).toBe(true);
  });
});

describe("fetchDrugInteraction", () => {
  it("returns co-reported reactions", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return mockOkJson({
          results: [{ term: "BLEEDING", count: 150 }],
        });
      }
      return mockOkJson({
        meta: { results: { total: 2000 } },
      });
    });

    const result = await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");

    expect(result.drugA).toBe("ASPIRIN");
    expect(result.drugB).toBe("IBUPROFEN");
    expect(result.coReportCount).toBe(2000);
    expect(result.coReportedReactions).toEqual([
      { term: "BLEEDING", count: 150 },
    ]);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("returns empty result on 404", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return { ok: false, status: 404 };
      }
      return mockOkJson({ meta: { results: { total: 0 } } });
    });

    const result = await fetchDrugInteraction("DRUGX", "DRUGY");

    expect(result.coReportedReactions).toEqual([]);
    expect(result.coReportCount).toBe(0);
  });

  it("throws on non-404 errors", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return { ok: false, status: 500 };
      }
      return mockOkJson({ meta: { results: { total: 0 } } });
    });

    await expect(
      fetchDrugInteraction("ASPIRIN", "IBUPROFEN")
    ).rejects.toThrow("FDA API error: 500");
  });

  it("returns 0 coReportCount when meta request fails", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("count=")) {
        return mockOkJson({
          results: [{ term: "NAUSEA", count: 50 }],
        });
      }
      return { ok: false, status: 500 };
    });

    const result = await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");
    expect(result.coReportCount).toBe(0);
    expect(result.coReportedReactions).toHaveLength(1);
  });

  it("uses +AND+ separator (not encoded)", async () => {
    mockFetch.mockImplementation(async () => mockOkJson({ results: [] }));

    await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");

    const urls = mockFetch.mock.calls.map((c: unknown[]) => c[0] as string);
    expect(urls.every((u) => u.includes("+AND+"))).toBe(true);
    expect(urls.every((u) => !u.includes("%2BAND%2B"))).toBe(true);
  });
});
