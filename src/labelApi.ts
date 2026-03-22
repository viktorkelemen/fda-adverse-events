import type { DrugLabelResult } from "./types";
import { sanitizeDrugName } from "./api";

const BASE_URL = "https://api.fda.gov/drug/label.json";

export async function fetchDrugLabel(
  drugName: string
): Promise<DrugLabelResult> {
  const sanitized = sanitizeDrugName(drugName);
  const search = encodeURIComponent(
    `openfda.brand_name:"${sanitized}"+openfda.generic_name:"${sanitized}"`
  );
  const url = `${BASE_URL}?search=${search}&limit=1`;

  const res = await fetch(url);

  if (!res.ok) {
    if (res.status === 404) {
      return {
        drugName,
        brandName: null,
        genericName: null,
        adverseReactions: null,
        warnings: null,
        contraindications: null,
        drugInteractions: null,
      };
    }
    throw new Error(`FDA Label API error: ${res.status}`);
  }

  const data = await res.json();
  const label = data.results?.[0];

  if (!label) {
    return {
      drugName,
      brandName: null,
      genericName: null,
      adverseReactions: null,
      warnings: null,
      contraindications: null,
      drugInteractions: null,
    };
  }

  return {
    drugName,
    brandName: label.openfda?.brand_name?.[0] ?? null,
    genericName: label.openfda?.generic_name?.[0] ?? null,
    adverseReactions: label.adverse_reactions?.[0] ?? null,
    warnings: label.warnings?.[0] ?? null,
    contraindications: label.contraindications?.[0] ?? null,
    drugInteractions: label.drug_interactions?.[0] ?? null,
  };
}
