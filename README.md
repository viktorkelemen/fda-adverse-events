# MedCheck — FDA Adverse Event Explorer

Explore FDA adverse event reports for your medications. Input your current drugs, see the top reported adverse events for each, and flag drug combinations with high co-reporting rates.

## Stack

React 19 + Vite + TypeScript + Tailwind CSS v4

## Getting Started

```bash
npm install
npm run dev      # http://localhost:5173
npm run test     # vitest
npm run build    # production build
```

## How It Works

1. User adds one or more medications by name
2. App queries the [FDA FAERS API](https://open.fda.gov/apis/drug/event/) for each drug
3. Individual reports show the top 20 adverse events with bar chart visualization and total report count
4. For 2+ drugs, pairwise co-reported adverse events are fetched to surface potential interaction risks

## UI Exploration Notes

### Tested Scenarios

| Scenario | Result |
|----------|--------|
| **Empty state** | Analyze button is properly disabled. Footer is pinned to bottom via flex layout. |
| **Single drug (Aspirin)** | 601,477 total reports. Top 20 reactions render as horizontal bar charts, proportionally scaled to the max count. Reaction terms display lowercase, counts use locale formatting (commas). |
| **Multiple drugs (Atorvastatin + Metformin + Lisinopril)** | 3 individual drug cards + 3 pairwise interaction cards. All report counts populate correctly (326K, 419K, 316K). Interaction cards show amber styling with co-report counts (55K, 38K, 51K). |
| **Fake drug (xyzfakedrug123)** | Red error banner: "Some queries failed: FDA API error: 404". No results section displayed. |
| **Mixed valid + invalid (xyzfakedrug123 + Aspirin)** | Partial failure handled — error banner appears AND Aspirin results still render below. `Promise.allSettled` working correctly. |
| **Duplicate entry prevention** | Typing "aspirin" when ASPIRIN pill already exists clears input without calling onAdd. |
| **Enter key submission** | Works — adds medication on Enter keypress. |
| **Pill removal** | x button on pills removes the medication. Accessible via aria-label. |
| **Mobile (390x844)** | Layout adapts cleanly. Input + Add button remain side by side. Bar charts scale proportionally. Numbers stay aligned. No horizontal overflow. |
| **Dark mode** | All `dark:` variants are specified throughout components. Uses Tailwind v4 default (`prefers-color-scheme` media query). Not tested with OS-level dark mode toggle. |

### Known UX Issues

1. **No loading indicator beyond button text** — The "Analyzing..." text on the button is the only feedback during API calls. For a 3-drug query (8 parallel API calls), there's a 2-4 second wait with no visual progress.
2. **Old results clear immediately on re-analyze** — When clicking Analyze again, previous results vanish instantly before new ones load. Could flash empty state.
3. **No drug name validation/autocomplete** — Users must know the exact FDA drug name. Typos like "asprin" return a 404 with no suggestion. A typeahead against the FDA drug label API would help.
4. **Error message is technical** — "FDA API error: 404" is not user-friendly. Could say "No reports found for XYZFAKEDRUG123".

### Architecture Notes

- API calls use `Promise.all` for the count + report-count fetches within each function (parallel, no added latency)
- App-level uses `Promise.allSettled` so partial failures don't block successful results
- Input sanitization strips `"` and `\` to prevent FAERS query syntax injection
- Bar charts are pure CSS (width percentage of max count) — no charting library needed
