# Competitive Analysis — MedCheck

## Direct Competitors

### DrugSafetyPortal
- **Repo:** https://github.com/jmbanda/DrugSafetyPortal
- **Stack:** Python web app
- **Approach:** Combines 6 APIs + 6 pharmacovigilance datasets to score drug-drug associations. Includes literature search and researcher profiles (v2.0).

### MedCheck-Care
- **Repo:** https://github.com/matthigg/MedCheck-Care
- **Stack:** Angular 8, SCSS, Netlify
- **Approach:** Drug interaction checker using NIH RxNorm/RxNav APIs. Typeahead autocomplete via Approximate Term API, curated interaction data via RxCUI lookups.

### PillPal
- **Repo:** https://github.com/JorgeZmedina/pill-pal
- **Stack:** HTML/CSS/JavaScript, SQL backend
- **Approach:** FDA API drug interaction checker with user feedback collection system.

---

## Valuable Data Sources / Libraries

### OnSIDES (tatonetti-lab)
- **Repo:** https://github.com/tatonetti-lab/onsides
- 7.1M+ drug-adverse event pairs extracted from 51,460 drug labels (US, EU, UK, Japan) using fine-tuned PubMedBERT. Updated quarterly. Could supplement or replace openFDA Labels plan.

### vigipy
- **Repo:** https://github.com/Shakesbeery/vigipy
- Python library for disproportionality analysis and signal detection (PRR, ROR, BCPNN, LASSO). Could inspire client-side signal scoring to move beyond raw FAERS counts.

### OpenFDA-MCP-Server
- **Repo:** https://github.com/Augmented-Nature/OpenFDA-MCP-Server
- MCP server wrapping multiple openFDA endpoints. Shows what other FDA data is available (recalls, labeling, device data, shortages).

---

## AI-Powered Approaches

### LLM-Drug-Interaction-Checker
- **Repo:** https://github.com/AdarshBP/LLM-Drug-Interaction-Checker
- Uses BioGPT/GPT-J via Hugging Face for interaction detection. Novel but less trustworthy than authoritative data.

### DIChecker-App
- **Repo:** https://github.com/pistolinkr/DIChecker-App
- Combines FDA data with AI analysis from multiple providers. Cross-platform desktop app.

---

## MedCheck's Current Advantages
- Modern stack (React 19, TypeScript, Tailwind 4, Vite 8)
- Clean consumer-facing UI with dark mode (most competitors are research tools or notebooks)
- Zero-backend, pure client-side
- Pairwise co-reporting analysis from FAERS
- Graceful partial-failure handling (Promise.allSettled)
- Proper test suite (Vitest + Testing Library)

## Key Feature Gaps
1. Drug name autocomplete/typeahead
2. Multiple data sources (beyond FAERS)
3. Label-based adverse effects alongside spontaneous reports
4. Disproportionality signal scoring (PRR/ROR)
5. Patient demographics in reports (age, sex, weight)
6. Literature/research references
7. User feedback collection
