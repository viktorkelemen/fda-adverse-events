import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDrugEvents, fetchDrugInteraction, sanitizeDrugName } from "../api";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

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
  it("returns parsed drug event results", async () => {
    // First call: count endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [
          { term: "NAUSEA", count: 500 },
          { term: "HEADACHE", count: 300 },
        ],
      }),
    });
    // Second call: meta endpoint
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meta: { results: { total: 10000 } },
      }),
    });

    const result = await fetchDrugEvents("ASPIRIN");

    expect(result.drugName).toBe("ASPIRIN");
    expect(result.totalReports).toBe(10000);
    expect(result.topReactions).toHaveLength(2);
    expect(result.topReactions[0]).toEqual({ term: "NAUSEA", count: 500 });
  });

  it("throws on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(fetchDrugEvents("ASPIRIN")).rejects.toThrow(
      "FDA API error: 500"
    );
  });

  it("returns 0 totalReports when meta request fails", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await fetchDrugEvents("ASPIRIN");
    expect(result.totalReports).toBe(0);
  });

  it("handles missing results gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const result = await fetchDrugEvents("UNKNOWN");
    expect(result.topReactions).toEqual([]);
    expect(result.totalReports).toBe(0);
  });

  it("encodes drug name in the API URL", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await fetchDrugEvents("ASPIRIN");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("patient.drug.medicinalproduct");
    expect(url).toContain("ASPIRIN");
  });
});

describe("fetchDrugInteraction", () => {
  it("returns co-reported reactions", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ term: "BLEEDING", count: 150 }],
      }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        meta: { results: { total: 2000 } },
      }),
    });

    const result = await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");

    expect(result.drugA).toBe("ASPIRIN");
    expect(result.drugB).toBe("IBUPROFEN");
    expect(result.coReportCount).toBe(2000);
    expect(result.coReportedReactions).toEqual([
      { term: "BLEEDING", count: 150 },
    ]);
  });

  it("returns empty result on 404", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 });

    const result = await fetchDrugInteraction("DRUGX", "DRUGY");

    expect(result.coReportedReactions).toEqual([]);
    expect(result.coReportCount).toBe(0);
  });

  it("throws on non-404 errors", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    await expect(
      fetchDrugInteraction("ASPIRIN", "IBUPROFEN")
    ).rejects.toThrow("FDA API error: 500");
  });

  it("handles meta request failure gracefully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        results: [{ term: "NAUSEA", count: 50 }],
      }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });

    const result = await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");
    expect(result.coReportCount).toBe(0);
    expect(result.coReportedReactions).toHaveLength(1);
  });

  it("uses +AND+ separator (not encoded)", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: [] }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await fetchDrugInteraction("ASPIRIN", "IBUPROFEN");

    const url = mockFetch.mock.calls[0][0] as string;
    expect(url).toContain("+AND+");
    expect(url).not.toContain("%2BAND%2B");
  });
});
