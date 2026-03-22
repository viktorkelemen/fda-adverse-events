# Competitive Analysis — MedCheck

## Direct Competitors — Deep Dive

---

### 1. DrugSafetyPortal

- **Repo:** https://github.com/jmbanda/DrugSafetyPortal (also [V2.0](https://github.com/jmbanda/DrugSafetyPortal-V.20))
- **Stack:** PHP, Bootstrap 3, jQuery, MySQL
- **Status:** Active (V2.0 expands to 1,123 drugs)

#### How It Works

Combines **6 APIs** and **6 pre-loaded datasets** (the LIDDI database) to score drug-drug interactions:

**APIs:**
| API | Purpose |
|-----|---------|
| NCBO BioPortal Annotator | Resolves free-text drug names to MeSH codes |
| NLM MeSH JSON API | Converts MeSH codes to human-readable names |
| NCBI PubMed eSearch | Finds adverse-effect literature by drug + MeSH subheadings |
| NCBI PubMed eFetch | Retrieves full article metadata (title, authors, journal) |
| openFDA FAERS | Same endpoint we use |
| bio2rdf.org | Links drugs to 150+ linked-data datasets |

**Datasets (stored in MySQL):**
| Dataset | Source |
|---------|--------|
| EHR | Stanford STRIDE: 9M clinical notes, 1M patients |
| FAERS | Mined from 3.2M+ FAERS reports (min 10 co-reports per pair) |
| INDI | Computationally predicted DDIs from pharmacological properties |
| MEDLINE | DDI pairs co-mentioned in biomedical literature |
| VILAR | Similarity-based DDI predictions (Vilar et al.) |
| TWOSIDES | Polypharmacy side effects isolated to drug *combinations* (Tatonetti Lab) |

**Scoring:** Simple binary voting — each dataset is 0 or 1. Composite score = sum (1-6). Score of 6 = all sources agree. Results sorted by score descending.

#### Weaknesses
- Static dataset (circa 2014-2015), not updated in real-time
- Binary scoring with no weighting or confidence intervals
- SQL injection vulnerabilities (unsanitized `$_GET` in queries)
- Hardcoded API key in source
- No autocomplete — BioPortal annotator silently fails on misspellings
- Requires PHP + MySQL backend

#### What We Can Borrow

**Feature: PubMed Literature Search**
- Add NCBI eSearch + eFetch calls (free, no API key needed)
- eSearch: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&retmax=5&retmode=json&term="adverse effects"[Subheading]+AND+"{drugName}"[Mesh]`
- eFetch: `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&retmode=xml&id={pmid1,pmid2}`
- Show "What does the literature say?" section per drug — title, authors, journal, year, PMID link
- For drug pairs: search PubMed for papers mentioning BOTH drugs with adverse-effect subheadings

**Feature: Multi-Source Evidence Indicator**
- Instead of their binary yes/no grid, show a richer "evidence bar":
  - FAERS co-reports (already have)
  - PubMed literature count (free)
  - openFDA label warnings (free)
  - RxNorm known interactions (free)
- Display as badges: `FAERS: 1,204 reports | Literature: 12 papers | Label: Listed | RxNorm: Known`

**Feature: Confidence Scoring**
- Improve on their crude 0-6 score with a weighted composite:
  - FAERS Proportional Reporting Ratio (PRR)
  - PubMed hit count (normalized)
  - Label listed yes/no
  - RxNorm interaction severity
- This moves us from "here are raw counts" to "here's how concerned you should be"

**Feature: bio2rdf Links**
- For each resolved drug, link to `https://mesh.bio2rdf.org/describe/?url=http://bio2rdf.org/mesh:{meshCode}`
- Zero API cost — just URL construction — gives power users a gateway to 150+ databases

---

### 2. MedCheck-Care

- **Repo:** https://github.com/matthigg/MedCheck-Care
- **Stack:** Angular 8, Angular Material, SCSS, Netlify
- **Status:** Archived (Angular 8 is EOL)

#### How It Works

Uses a **two-step API chain** for both autocomplete and interaction checking:

**Autocomplete (per keystroke, 1000ms debounce):**
1. `GET https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term={input}&maxEntries=8` → fuzzy match → returns rxcui candidates
2. `GET https://rxnav.nlm.nih.gov/REST/rxcui/{rxcui}/properties.json` → resolves each rxcui to canonical drug name
3. Deduplicates rxcuis, takes first 3, renders via `<datalist>`

**Interaction check (on submit):**
1. `GET https://rxnav.nlm.nih.gov/REST/rxcui.json?name={drugName}` → exact name to rxcui (per drug, in parallel)
2. `GET https://rxnav.nlm.nih.gov/REST/interaction/list.json?rxcuis={rxcui1}+{rxcui2}+{rxcui3}` → known pharmacological interactions from DrugBank/ONCHigh

**Key RxNav endpoints:**
| Endpoint | URL | Purpose |
|----------|-----|---------|
| Approximate Term | `/REST/approximateTerm?term=X&maxEntries=N` | Fuzzy drug name search (typeahead) |
| RxCUI Properties | `/REST/rxcui/{rxcui}/properties` | Resolve rxcui → canonical name |
| RxCUI Lookup | `/REST/rxcui?name=X` | Exact name → rxcui mapping |
| Interaction List | `/REST/interaction/list.json?rxcuis=A+B+C` | Known DDIs for multiple drugs |

#### Weaknesses
- No error handling on Approximate Term API failures
- Exact-match lookup on submit — misspellings that bypass autocomplete silently fail
- Subscription leak risks (no `switchMap` or request cancellation)
- No caching — every keystroke makes fresh HTTP calls
- No loading indicator during autocomplete
- Race conditions — slow responses can overwrite newer ones
- Ignores interaction severity data that the API returns
- 3-suggestion hard limit (arbitrary)

#### What We Can Borrow

**Feature: RxNorm Typeahead Autocomplete**
- Add to `MedicationInput.tsx` with improvements over their implementation:
  - 300ms debounce (not 1000ms)
  - `AbortController` to cancel stale requests (fixes race conditions)
  - Cache responses with a `Map<string, string[]>` (fixes redundant API calls)
  - Show 5 suggestions (not 3)
  - Always use `.json` suffix on RxNav URLs to force JSON format
  - Show loading spinner in the dropdown while fetching

**Feature: Known Drug Interactions (RxNav)**
- Complements our FAERS co-reporting with curated pharmacological interactions
- The interaction API returns `severity` and `description` — display both
- Show side-by-side: "Known interactions (clinical databases)" vs "Co-reported events (FAERS real-world data)"
- Fall back to approximate term matching if exact `rxcui?name=X` fails

**Feature: Discriminated Union Status**
- Replace our separate `loading` + `error` + array-length checks with:
  ```typescript
  type AnalysisStatus = "idle" | "loading" | "complete" | "empty" | "error";
  ```
- Cleaner state management, impossible states become unrepresentable

---

### 3. PillPal

- **Repo:** https://github.com/JorgeZmedina/pill-pal
- **Stack:** HTML/CSS/JavaScript, Express, MySQL, Sequelize
- **Status:** Inactive

#### How It Works

Uses the **Drug Label API** (`https://api.fda.gov/drug/label.json`) — a completely different openFDA endpoint from our FAERS usage:
- Search by brand name: `?search=brand_name:{drugName}`
- Search by active ingredient: `?search=active_ingredient:{drugName}`
- Extracts: active/inactive ingredients, purpose, warnings, dosage

Multi-page server-rendered app (not a SPA). User enters drug name → Express server calls label API → returns full HTML page with drug info.

Has a feedback form UI but the backend is non-functional (no form action, methods not implemented).

#### Weaknesses
- Hardcoded API key and database credentials in source
- No input sanitization (XSS vulnerability via template literals)
- Three competing server files with overlapping responsibilities
- Interaction checking only queries empty local database (always returns nothing)
- Full-page reload per search
- Feedback system is a non-functional UI mockup
- No tests, no TypeScript, no build tooling

#### What We Can Borrow

**Feature: Drug Label Data Panel**
- Add `https://api.fda.gov/drug/label.json?search=brand_name:"{drugName}"` alongside our FAERS queries
- Display structured card: active ingredients, warnings, contraindications, dosage
- This is the openFDA Labels integration from our data sources plan — PillPal confirms the endpoint works

**Feature: Label vs FAERS Comparison View**
- The most compelling synthesis: show official label warnings side-by-side with FAERS frequency data
- If "headache" is on the label AND #3 in FAERS → confirmed, expected
- If something is #1 in FAERS but NOT on the label → potentially interesting unlabeled signal
- This is a unique differentiator no competitor offers

**Feature: Active Ingredient Resolution**
- Use the label API to resolve brand name → active ingredient(s)
- Then search FAERS by active ingredient for better recall
- "Tylenol" → label says "acetaminophen" → FAERS search for "acetaminophen" catches far more reports

**Feature: Manufacturer Info + Pharmacologic Class**
- Label API returns `openfda.manufacturer_name` and `openfda.pharm_class_epc`
- Show "Lipitor (Pfizer) — HMG-CoA Reductase Inhibitor (Statin)" as context
- Could enable filtering adverse events by manufacturer (generic vs brand-name profiles differ)

**Feature: Medical Disclaimer Component**
- A reusable `<Disclaimer>` component: "This information is not a substitute for professional medical advice"
- Important for liability and user trust when showing FDA adverse event data

---

## Consolidated Feature Ideas (Ranked by Impact)

| # | Feature | Source | Effort | Impact |
|---|---------|--------|--------|--------|
| 1 | RxNorm typeahead autocomplete | MedCheck-Care | Low | Fixes drug name input problem entirely |
| 2 | Label vs FAERS comparison view | PillPal + DrugSafetyPortal | Medium | Unique differentiator, no competitor has this |
| 3 | Known interactions from RxNav | MedCheck-Care | Low | Curated DDIs complement our FAERS co-reporting |
| 4 | PubMed literature section | DrugSafetyPortal | Medium | "What does the research say?" — adds credibility |
| 5 | Multi-source evidence indicator | DrugSafetyPortal | Medium | Composite confidence view across all sources |
| 6 | Active ingredient resolution | PillPal | Low | Better FAERS recall via brand→generic mapping |
| 7 | Confidence scoring (PRR) | DrugSafetyPortal + vigipy | High | Moves beyond raw counts to real signal detection |
| 8 | Manufacturer + drug class display | PillPal | Low | Context for users unfamiliar with their medications |
| 9 | Medical disclaimer | PillPal | Trivial | Liability / trust |
| 10 | bio2rdf links for power users | DrugSafetyPortal | Trivial | Free gateway to 150+ databases |

## MedCheck's Current Advantages
- Modern stack (React 19, TypeScript, Tailwind 4, Vite 8)
- Clean consumer-facing UI with dark mode (most competitors are research tools or notebooks)
- Zero-backend, pure client-side
- Pairwise co-reporting analysis from FAERS
- Graceful partial-failure handling (Promise.allSettled)
- Proper test suite (Vitest + Testing Library)
