---
id: PF-241
title: Bolognese — count-based notation for some ingredients
status: Done
assignee: []
created_date: '2026-05-07 18:27'
updated_date: '2026-05-10 03:31'
labels:
  - ux
  - recipes
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Recipe ba-bolognese: gram weights less actionable than count/size cues for some ingredients (onion medium, celery stalk, carrot small, bay leaf, nutmeg pinch). User feedback from 2026-05-07 bake: 'on this particular recipe, gram weights aren't as helpful.' Investigate per-ingredient display_unit override or stage-level toggle so the gather list can show 'medium onion' instead of '110g onion' where weight isn't the load-bearing measurement. Don't strip weights from JSON — render layer only.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 New optional schema field: Ingredient.display_amount?: string (free-form, e.g. 'medium', '1 stalk', 'pinch', 'to taste')
- [ ] #2 src/types/recipe.ts updates Ingredient interface with documentation: 'Optional render override. When present, gather list / print / copy show display_amount alongside grams. JSON total/unit remain authoritative for scaling, cost, nutrition; display_amount is render-only and does NOT auto-scale with multiplier.'
- [ ] #3 GatherSection.vue ingredient label when display_amount present: ${ing.name} — ${display_amount} (${fmt(scaledTotal, ing.unit)}) — display first, grams preserved in parens
- [ ] #4 GatherSection.vue ingredient label when display_amount absent: unchanged — ${ing.name} — ${fmt(scaledTotal, ing.unit)}
- [ ] #5 GatherSection.vue breakdown detail line is unchanged regardless of display_amount (breakdowns continue to show gram values per breakdown entry)
- [ ] #6 display_amount renders verbatim; it does NOT pluralize, scale, or modify based on multiplier (documented in Ingredient interface comment)
- [ ] #7 Experiment-adjusted ingredients still respect display_amount: render ${name} — ${display_amount} (${experimentAdjusted}${unit}) with experiment delta indicator preserved
- [ ] #8 RecipePrintView.vue ingredient render uses display_amount when set: ${name} — ${display_amount} (${amount}${unit}) matching gather format
- [ ] #9 Gather copy-to-clipboard (formatGatherForCopy) outputs ${name} — ${display_amount} (${amount}${unit}) when set, falls back to ${name} — ${amount}${unit} otherwise
- [ ] #10 RecipeMeta.vue allIngredients copy (line 88) uses display_amount when set with the same format pattern
- [ ] #11 Snapshot tests for GatherSection updated with one display_amount fixture; snapshot diff confirms display + grams both visible
- [ ] #12 Snapshot tests for RecipePrintView updated similarly
- [ ] #13 Component test on GatherSection: ingredient with display_amount='medium' and total=110 renders 'Onion (medium) — medium (110g)' at multiplier=1 AND 'Onion (medium) — medium (220g)' at multiplier=2 (display string unchanged, grams scaled)
- [ ] #14 Component test: ingredient without display_amount renders unchanged from current behavior (regression guard)
- [ ] #15 ba-bolognese.json populated with display_amount on at least these ingredients: onion ('medium'), celery ('1 stalk'), carrot ('small'), bay leaf ('1 leaf'), nutmeg ('pinch') — exact strings picked during implementation but documented in task notes
- [ ] #16 ba-bolognese.json minor version bump (handled in PF-242 if it lands first; otherwise this PR bumps and adds change_log entry mentioning display_amount additions)
- [ ] #17 No other recipes touched in this PR; opportunistic migration noted as follow-up
- [ ] #18 When display_amount is present on an ingredient, the recipe still passes D6 (breakdown sums match total); display_amount does not affect numeric checks
<!-- AC:END -->
