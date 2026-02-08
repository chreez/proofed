---
id: PF-75
title: Nutrition table notebook-paper styling
status: Done
assignee: []
created_date: '2026-02-08 09:31'
updated_date: '2026-02-08 09:59'
labels:
  - ux
dependencies: []
priority: low
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Restyle the nutrition table rows with subtle "notebook paper" ruled lines. Current solid border-b border-stone-200 is too plain. Needs demo variants to explore line weight, dash patterns, and opacity that feel like ruled paper without being heavy.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [x] #1 Nutrition totals table rows use notebook-paper ruled line style (not solid border-b border-stone-200)
- [x] #2 Line style is subtle — light weight, feels like ruled paper without being heavy
- [x] #3 Header row (border-b border-stone-300) remains distinct from data rows
- [x] #4 Breakdown table (per-ingredient) is NOT changed (out of scope)
- [x] #5 Styling uses UnoCSS shortcuts or theme values from uno.config.ts (D13)
- [x] #6 Visual sign-off from user before commit (styling gate)
- [x] #7 npm run build passes
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## Research Synthesis (4 agents)\n\n### Top 3 Directions\n\n**1. Ruled-paper-as-background (gradient lines)**\nLines come from `repeating-linear-gradient` on the container, not `border-b` on rows. Text sits ON lines like writing on notebook paper. `line-height` must match gradient interval. Single header separator is \"the one border Tufte approves of.\" Warm stone-300 at 30-50% opacity.\n\n**2. Fading ruled line**\n`background-image: linear-gradient(to right, transparent, stone-300 15%, stone-300 85%, transparent)` on each row's `background-position: bottom`. Lines fade at edges like pencil on paper. No layout impact.\n\n**3. Fully borderless / typography-driven**\nNo lines at all. Structure via `font-variant-numeric: tabular-nums`, right-aligned numbers, weight hierarchy (semibold headers, regular data), generous padding. JetBrains Mono already has tabular figures. Vercel/Linear pattern.\n\n### Supporting Techniques\n- Retina hairline: `transform: scaleY(0.5)` on `::after` pseudo-element for true 0.5px lines\n- `box-shadow: 0 1px 0 0 rgba(0,0,0,0.04)` instead of borders (no layout impact, can blur for pencil feel)\n- `border-style: hidden` on `<table>` auto-hides outer edges\n- Accent-colored left margin line via `::before` (stone or accent at 25% opacity)\n\n### Design Principles (from research)\n- Tschichold/Tufte: \"Tables should not look like nets. Try to do without rules altogether.\"\n- Cookbook philosophy: white space = confidence. Current `py-1.5` could be roomier.\n- Nutrition = reference data — should feel lighter than recipe cards (1px not 2px borders)\n- FDA label style is anti-pattern for warm palette\n- Progressive disclosure already good (collapsible breakdown)\n\n### Enhancement Ideas (from recipe app research)\n- Calories as hero: larger font, own row with breathing room\n- Macro summary badges before table: `Protein 12g | Fat 8g | Carbs 45g`\n- Left border color-coding for macro groups instead of indent\n- Dot leader pattern (cookbook style) connecting label to value\n\n### Sources\n- A List Apart: Web Typography — Designing Tables to be Read\n- The Monospace Web (Oskar Wickstrom) — uses JetBrains Mono specifically\n- CSS-Tricks: Table borders, gradient borders, background-image borders\n- Tufte: Data-ink ratio principle\n- Annual Beta: Retina hairline CSS techniques\n- NYT Cooking, Pestle, Mela, Paprika design patterns\n- Stripe/Vercel/Linear/GitHub table styling analysis\n- Adobe Typekit cookbook typography guide\n- Dribbble/Behance nutrition card patterns"
<!-- SECTION:NOTES:END -->

## Final Summary

<!-- SECTION:FINAL_SUMMARY:BEGIN -->
Nutrition table rows now use fading pencil lines instead of solid borders. Each row has a background-image gradient that fades at both edges (transparent → stone-300/40 at 15% → stone-300/40 at 85% → transparent), positioned as a 1px line at the bottom. Feels like pencil on ruled paper. Header border-b border-stone-300 remains distinct. Demo scaffolding removed. Human visual sign-off confirmed.
<!-- SECTION:FINAL_SUMMARY:END -->
