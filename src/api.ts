import type { AdverseEvent, DrugEventResult, DrugInteractionResult } from "./types";

const BASE_URL = "https://api.fda.gov/drug/event.json";

export async function fetchDrugEvents(
  drugName: string
): Promise<DrugEventResult> {
  const query = encodeURIComponent(
    `patient.drug.medicinalproduct:"${drugName}"`
  );
  const url = `${BASE_URL}?search=${query}&count=patient.reaction.reactionmeddrapt.exact&limit=20`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`FDA API error: ${res.status}`);
  }

  const data = await res.json();

  const topReactions: AdverseEvent[] = (data.results ?? []).map(
    (r: { term: string; count: number }) => ({
      term: r.term,
      count: r.count,
    })
  );

  // Get total report count
  const metaUrl = `${BASE_URL}?search=${query}&limit=1`;
  const metaRes = await fetch(metaUrl);
  const metaData = await metaRes.json();
  const totalReports = metaData.meta?.results?.total ?? 0;

  return {
    drugName,
    totalReports,
    topReactions,
  };
}

export async function fetchDrugInteraction(
  drugA: string,
  drugB: string
): Promise<DrugInteractionResult> {
  const query = encodeURIComponent(
    `patient.drug.medicinalproduct:"${drugA}"+AND+patient.drug.medicinalproduct:"${drugB}"`
  );
  const url = `${BASE_URL}?search=${query}&count=patient.reaction.reactionmeddrapt.exact&limit=10`;

  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) {
      return {
        drugA,
        drugB,
        coReportedReactions: [],
        coReportCount: 0,
      };
    }
    throw new Error(`FDA API error: ${res.status}`);
  }

  const data = await res.json();

  const coReportedReactions: AdverseEvent[] = (data.results ?? []).map(
    (r: { term: string; count: number }) => ({
      term: r.term,
      count: r.count,
    })
  );

  // Get co-report count
  const metaUrl = `${BASE_URL}?search=${query}&limit=1`;
  const metaRes = await fetch(metaUrl);
  let coReportCount = 0;
  if (metaRes.ok) {
    const metaData = await metaRes.json();
    coReportCount = metaData.meta?.results?.total ?? 0;
  }

  return {
    drugA,
    drugB,
    coReportedReactions,
    coReportCount,
  };
}
