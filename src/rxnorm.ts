const RXNAV_BASE = "https://rxnav.nlm.nih.gov/REST";

interface Candidate {
  rxcui: string;
}

interface ApproximateTermResponse {
  approximateGroup?: {
    candidate?: Candidate[];
  };
}

interface PropertiesResponse {
  properties?: {
    name?: string;
  };
}

const MAX_SUGGESTIONS = 5;

export async function fetchDrugSuggestions(
  term: string,
  signal?: AbortSignal
): Promise<string[]> {
  const cleaned = term?.trim();
  if (!cleaned || cleaned.length < 2) return [];

  const res = await fetch(
    `${RXNAV_BASE}/approximateTerm.json?term=${encodeURIComponent(cleaned)}&maxEntries=8`,
    { signal }
  );
  if (!res.ok) return [];

  const data: ApproximateTermResponse = await res.json();
  const candidates = data.approximateGroup?.candidate ?? [];

  const uniqueRxcuis = [...new Set(candidates.map((c) => c.rxcui))].slice(
    0,
    MAX_SUGGESTIONS
  );
  if (uniqueRxcuis.length === 0) return [];

  const names = await Promise.all(
    uniqueRxcuis.map(async (rxcui) => {
      const r = await fetch(
        `${RXNAV_BASE}/rxcui/${rxcui}/properties.json`,
        { signal }
      );
      if (!r.ok) return null;
      const d: PropertiesResponse = await r.json();
      return d.properties?.name ?? null;
    })
  );

  return [...new Set(names.filter(Boolean) as string[])];
}
