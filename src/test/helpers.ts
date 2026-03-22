import { vi } from "vitest";

export function mockOkJson(body: unknown) {
  return { ok: true, json: async () => body };
}

export function createMockFetch() {
  const mockFetch = vi.fn();
  vi.stubGlobal("fetch", mockFetch);
  return mockFetch;
}
