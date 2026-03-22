import type { AdverseEvent, DrugEventResult, DrugInteractionResult } from "./types";

const BASE_URL = "https://api.fda.gov/drug/event.json";

export function sanitizeDrugName(name: string): string {
  return name.replace(/["\\]/g, "");
}

function buildSearchTerm(drugName: string): string {
  return encodeURIComponent(
    `patient.drug.medicinalproduct:"${sanitizeDrugName(drugName)}"`
  );
}

async function fetchReportCount(search: string): Promise<number> {
  const url = `${BASE_URL}?search=${search}&limit=1`;
  const res = await fetch(url);
  if (!res.ok) return 0;
  const data = await res.json();
  return data.meta?.results?.total ?? 0;
}

export async function fetchDrugEvents(
  drugName: string
): Promise<DrugEventResult> {
  const search = buildSearchTerm(drugName);
  const url = `${BASE_URL}?search=${search}&count=patient.reaction.reactionmeddrapt.exact&limit=20`;

  const [res, totalReports] = await Promise.all([
    fetch(url),
    fetchReportCount(search),
  ]);

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

  return { drugName, totalReports, topReactions };
}

export async function fetchDrugInteraction(
  drugA: string,
  drugB: string
): Promise<DrugInteractionResult> {
  const search = `${buildSearchTerm(drugA)}+AND+${buildSearchTerm(drugB)}`;
  const countUrl = `${BASE_URL}?search=${search}&count=patient.reaction.reactionmeddrapt.exact&limit=10`;

  const [res, coReportCount] = await Promise.all([
    fetch(countUrl),
    fetchReportCount(search),
  ]);

  if (!res.ok) {
    if (res.status === 404) {
      return { drugA, drugB, coReportedReactions: [], coReportCount: 0 };
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

  return { drugA, drugB, coReportedReactions, coReportCount };
}
