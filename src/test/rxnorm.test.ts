import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchDrugSuggestions } from "../rxnorm";
import { mockOkJson, createMockFetch } from "./helpers";

const mockFetch = createMockFetch();

beforeEach(() => {
  mockFetch.mockReset();
});

describe("fetchDrugSuggestions", () => {
  it("returns empty array for short terms", async () => {
    expect(await fetchDrugSuggestions("")).toEqual([]);
    expect(await fetchDrugSuggestions("a")).toEqual([]);
    expect(await fetchDrugSuggestions(" ")).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches suggestions via approximateTerm then properties", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: {
            candidate: [{ rxcui: "1191" }, { rxcui: "1191" }, { rxcui: "2670" }],
          },
        });
      }
      if (url.includes("/1191/properties")) {
        return mockOkJson({ properties: { name: "Aspirin" } });
      }
      if (url.includes("/2670/properties")) {
        return mockOkJson({ properties: { name: "Codeine" } });
      }
      return { ok: false };
    });

    const result = await fetchDrugSuggestions("asp");

    expect(result).toEqual(["Aspirin", "Codeine"]);
    // 1 approximateTerm call + 2 unique rxcui properties calls
    expect(mockFetch).toHaveBeenCalledTimes(3);
  });

  it("deduplicates rxcuis before resolving", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: {
            candidate: [
              { rxcui: "1191" },
              { rxcui: "1191" },
              { rxcui: "1191" },
            ],
          },
        });
      }
      if (url.includes("/1191/properties")) {
        return mockOkJson({ properties: { name: "Aspirin" } });
      }
      return { ok: false };
    });

    const result = await fetchDrugSuggestions("asp");

    expect(result).toEqual(["Aspirin"]);
    // 1 approximateTerm + 1 properties (deduped)
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("deduplicates names in the final result", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: {
            candidate: [{ rxcui: "100" }, { rxcui: "200" }],
          },
        });
      }
      // Both rxcuis resolve to the same name
      return mockOkJson({ properties: { name: "Aspirin" } });
    });

    const result = await fetchDrugSuggestions("asp");
    expect(result).toEqual(["Aspirin"]);
  });

  it("returns empty array when approximateTerm fails", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 500 });

    const result = await fetchDrugSuggestions("asp");
    expect(result).toEqual([]);
  });

  it("returns empty array when no candidates found", async () => {
    mockFetch.mockResolvedValue(
      mockOkJson({ approximateGroup: { candidate: [] } })
    );

    const result = await fetchDrugSuggestions("xyznotadrug");
    expect(result).toEqual([]);
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("skips entries where properties call fails", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: {
            candidate: [{ rxcui: "1191" }, { rxcui: "9999" }],
          },
        });
      }
      if (url.includes("/1191/properties")) {
        return mockOkJson({ properties: { name: "Aspirin" } });
      }
      return { ok: false, status: 404 };
    });

    const result = await fetchDrugSuggestions("asp");
    expect(result).toEqual(["Aspirin"]);
  });

  it("limits to 5 unique rxcuis", async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: {
            candidate: Array.from({ length: 8 }, (_, i) => ({
              rxcui: String(i + 1),
            })),
          },
        });
      }
      const rxcui = url.match(/rxcui\/(\d+)\//)?.[1];
      return mockOkJson({ properties: { name: `Drug${rxcui}` } });
    });

    const result = await fetchDrugSuggestions("test");
    expect(result).toHaveLength(5);
    // 1 approximateTerm + 5 properties (capped)
    expect(mockFetch).toHaveBeenCalledTimes(6);
  });

  it("passes abort signal to fetch calls", async () => {
    const controller = new AbortController();

    mockFetch.mockImplementation(async (_url: string, init?: RequestInit) => {
      if (init?.signal === controller.signal) {
        // Verify signal is passed
      }
      if (_url.includes("approximateTerm")) {
        return mockOkJson({
          approximateGroup: { candidate: [{ rxcui: "1191" }] },
        });
      }
      return mockOkJson({ properties: { name: "Aspirin" } });
    });

    await fetchDrugSuggestions("asp", controller.signal);

    // Verify signal was passed to all calls
    for (const call of mockFetch.mock.calls) {
      expect(call[1]).toEqual({ signal: controller.signal });
    }
  });

  it("handles missing approximateGroup gracefully", async () => {
    mockFetch.mockResolvedValue(mockOkJson({}));

    const result = await fetchDrugSuggestions("asp");
    expect(result).toEqual([]);
  });
});
