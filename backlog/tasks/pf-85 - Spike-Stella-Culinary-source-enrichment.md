---
id: PF-85
title: 'Spike: Stella Culinary source enrichment'
status: Done
assignee: []
created_date: '2026-02-09 04:18'
updated_date: '2026-02-09 05:45'
labels:
  - spike
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Check original Stella Culinary website for recipe details not covered in the YouTube video. Update source notes if found.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Attempt to locate Stella Culinary website recipe page (try Wayback Machine if main site is down)
- [ ] #2 If accessible: compare website content against current recipe JSON
- [ ] #3 If accessible: document any tips, ratios, or technique details not in the video
- [ ] #4 If inaccessible: document that source is unavailable, close spike as no-op
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Spike Findings: Stella Culinary Source Enrichment

### Site Status
- **stellaculinary.com** → 301 redirects to chefjacob.com (bare chat widget, no content)
- **Wayback Machine** → Full recipe archived Jan 2024 ✅

### Archived URLs
- Recipe: `https://web.archive.org/web/20240118123908/https://stellaculinary.com/recipes/baking-pastry/baking/bread/new-york-style-pizza-dough`
- Video page: `https://web.archive.org/web/20201112015325/https://stellaculinary.com/cooking-videos/stella-bread/sb-021-how-to-make-new-york-style-pizza-at-home`

### 5 Key Differences (Website vs JSON)

| # | Difference | Website | JSON | Impact |
|---|---|---|---|---|
| 1 | **Oil in autolyse** | Adds oil BEFORE autolyse | Adds oil AFTER (with salt/sugar) | JSON approach is arguably better for gluten dev |
| 2 | **Oven temp** | 500°F (260°C) | 550°F (288°C) | JSON adapted for baking steel |
| 3 | **Knead rest** | 3-4 min between kneads | 1-2 min | Minor |
| 4 | **Bulk ferment** | 2-3 hours | 2 hours | Minor |
| 5 | **Hand-knead alt** | Slap and fold option mentioned | Not in JSON | Could add as note |

### Browning Caution (NOT in JSON)
Website states: longer fermentation releases more free sugars → dough browns more rapidly. Relevant to PF-84 findings about extending proof time. Should be added as a note to cold-ferment steps.

### Recommendations
1. Add website URL as secondary source in `meta.source`
2. Document oil-in-autolyse as an intentional adaptation
3. Add browning caution note to cold-ferment steps
4. Document 500→550°F temp adaptation (baking steel)

### Sources
- [Stella Culinary Recipe (Wayback)](https://web.archive.org/web/20240118123908/https://stellaculinary.com/recipes/baking-pastry/baking/bread/new-york-style-pizza-dough)
- [Stella Culinary Video Page (Wayback)](https://web.archive.org/web/20201112015325/https://stellaculinary.com/cooking-videos/stella-bread/sb-021-how-to-make-new-york-style-pizza-at-home)
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Stella Culinary site is down but Wayback Machine has the full written recipe. Found 5 meaningful differences vs current JSON (oil timing, oven temp, rest durations, hand-knead alternative). Key discovery: browning caution for long proofs (more free sugars). Recommend updating source URLs and documenting intentional adaptations.
<!-- SECTION:FINAL_SUMMARY:END -->
