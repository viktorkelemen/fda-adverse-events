export interface Medication {
  id: string;
  name: string;
}

export interface AdverseEvent {
  term: string;
  count: number;
}

export interface DrugEventResult {
  drugName: string;
  totalReports: number;
  topReactions: AdverseEvent[];
}

export interface DrugInteractionResult {
  drugA: string;
  drugB: string;
  coReportedReactions: AdverseEvent[];
  coReportCount: number;
}

export interface DrugLabelResult {
  drugName: string;
  brandName: string | null;
  genericName: string | null;
  adverseReactions: string | null;
  warnings: string | null;
  contraindications: string | null;
  drugInteractions: string | null;
}
