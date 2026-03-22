# Data Sources Plan — MedCheck Adverse Event Explorer

## Current State

MedCheck uses a single data source: **FDA FAERS** (`api.fda.gov/drug/event.json`) for reported adverse events and drug interaction co-reports. It has no drug name normalization, no label-based side effect data, and no international report coverage.

---

## Ranked Data Sources

### 1. openFDA Drug Labeling (`drug/label.json`) — HIGH VALUE, LOW EFFORT

**What it gives us:** Structured product labels (SPL) including the official adverse reactions section, warnings, contraindications, and drug interactions — straight from the FDA-approved label.

**Why #1:**
- Same API domain we already use (`api.fda.gov`), same auth model (none / API key), same response format
- Lets us show **expected** side effects (from the label) vs **reported** side effects (from FAERS) — a compelling comparison that no single source provides alone
- Interaction and contraindication sections give us a second, independent signal for drug-drug interactions
- Minimal new code: one new fetch function, one new UI section

**Integration effort:** ~1-2 days

---

### 2. RxNorm (NIH/NLM) — HIGH VALUE, LOW EFFORT

**What it gives us:** Drug name normalization — maps brand names, generics, misspellings, and abbreviations to a canonical RxCUI identifier.

**Why #2:**
- Directly improves accuracy of our existing FAERS queries (e.g., "Advil" → "ibuprofen" catches far more reports)
- Free REST API, no auth required: `https://rxnav.nlm.nih.gov/REST/`
- Also provides interaction data via the RxNorm Interaction API (`/interaction/list.json`) — a quick way to flag known interactions
- Small, focused integration: normalize on input, then pass to existing FAERS queries

**Integration effort:** ~1 day for normalization, +0.5 day for interaction endpoint

---

### 3. DailyMed (NIH/NLM) — MEDIUM VALUE, MEDIUM EFFORT

**What it gives us:** Full structured drug labels in SPL XML format, including adverse reactions, boxed warnings, and clinical pharmacology. More granular than openFDA labeling.

**Why #3:**
- Richer label data than openFDA (original SPL XML with section-level parsing)
- REST API available: `https://dailymed.nlm.nih.gov/dailymed/services/`
- Useful if openFDA label data is insufficient for a specific drug
- Overlaps significantly with openFDA labeling (#1) — pursue this only if #1 falls short

**Integration effort:** ~2 days (XML parsing adds complexity vs openFDA JSON)

---

### 4. SIDER (Side Effect Resource) — MEDIUM VALUE, MEDIUM EFFORT

**What it gives us:** A structured database of drugs and their known side effects, extracted from labels and post-marketing data. Includes frequency data when available.

**Why #4:**
- Frequency percentages for side effects (rare vs common) — FAERS doesn't tell you this
- Free download (TSV files), can be bundled or served from a small backend
- Requires a backend or static data bundle — we're currently a pure client-side app
- Data updates are infrequent (academic release cycle)

**Integration effort:** ~3 days (needs a data pipeline or bundled dataset + lookup logic)

---

### 5. WHO VigiBase / VigiAccess — MEDIUM VALUE, HIGH EFFORT

**What it gives us:** Global adverse event reports (not just US). Over 30 million reports from 150+ countries.

**Why #5:**
- International coverage is valuable for drugs with limited US market history
- VigiAccess (`vigiaccess.org`) provides public summary data but no REST API — would need scraping or registration with Uppsala Monitoring Centre for API access
- Adds global perspective but the data structure differs from FAERS

**Integration effort:** ~3-5 days (API access negotiation + different data model)

---

### 6. EudraVigilance / ADR Reports (EMA) — LOW VALUE, HIGH EFFORT

**What it gives us:** European adverse event reports, similar to FAERS but for the EU market.

**Why #6:**
- No public REST API — data available via `adrreports.eu` web portal
- Would require scraping or manual data integration
- Significant overlap with VigiBase (EU reports flow into WHO)
- Worth considering only if we're building a comprehensive global pharmacovigilance tool

**Integration effort:** ~5+ days

---

### 7. NIH Dietary Supplement Label Database (DSLD) — HIGH VALUE for supplements, LOW EFFORT

**What it gives us:** Maps supplement products (by brand name) to their ingredient lists. Covers thousands of products on the US market.

**Why it matters:**
- Solves the "brand name supplement" problem — user types "Centrum Silver" or "Athletic Greens" and we resolve it to individual ingredients (Vitamin D, Zinc, Magnesium, etc.)
- Each ingredient can then be searched in FAERS, openFDA Labels, and RxNorm
- Free REST API, no auth: `https://api.ods.od.nih.gov/dsld/`
- Without this, users must manually enter each ingredient from their supplement — most won't bother
- Pairs naturally with RxNorm: DSLD resolves brand → ingredients, RxNorm normalizes each ingredient for FAERS lookup

**Integration effort:** ~1-2 days

---

### 8. DrugBank — HIGH VALUE, HIGH EFFORT (licensing)

**What it gives us:** Comprehensive drug data: adverse effects, interactions, pharmacology, targets, pathways.

**Why last despite high value:**
- Free tier is academic-only; commercial use requires a paid license
- Richest single source of drug knowledge, but licensing constraints make it impractical for an open/free app
- If licensing is acceptable, this jumps to #2 or #3

**Integration effort:** ~2 days technical, but licensing is the blocker

---

## Recommended Roadmap

| Phase | Source | Key Feature Added |
|-------|--------|-------------------|
| **Phase 1** | RxNorm | Drug name normalization → better FAERS results |
| **Phase 2** | openFDA Labels | Expected side effects + contraindications from labels |
| **Phase 3** | NIH DSLD | Brand-name supplement → ingredient resolution |
| **Phase 4** | SIDER | Side effect frequency data (common vs rare) |
| **Phase 5** | VigiBase | International adverse event coverage |

**Phase 1 + 2 + 3 together give us the biggest impact for ~3-5 days of work.** They improve existing functionality (better search via RxNorm), add label-based side effects, and let users enter supplement brand names instead of individual ingredients. All three are free REST APIs with no backend required.
