---
id: PF-94
title: 'Smart copy: grocery-friendly mise en place'
status: In Progress
assignee: []
created_date: '2026-02-10 03:10'
updated_date: '2026-02-11 21:39'
labels:
  - spike
dependencies: []
priority: low
ordinal: 49000
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Evaluate two approaches for a grocery-shopping-friendly copy-to-clipboard feature. Current F11 copies everything (all items, ignores checked state, includes vessels/equipment). Users want to copy just unchecked ingredients for shopping.

**Approach A**: Enhance existing per-section Copy button in GatherSection.vue — skip checked items, ingredients-only mode (or at least deprioritize vessels/equipment).

**Approach B**: New recipe-level "Shopping List" action that aggregates unchecked ingredients across ALL stages into one combined list. Single copy for the whole recipe.

Spike output: recommendation on which to implement, with rationale. Consider UX (grocery shopping workflow), implementation complexity, and whether both could coexist.
<!-- SECTION:DESCRIPTION:END -->

## Acceptance Criteria
<!-- AC:BEGIN -->
- [ ] #1 Spike documents the current copy behavior in GatherSection.vue (what gets copied, what's ignored, no checked-state filtering)
- [ ] #2 Spike evaluates Approach A: enhance existing per-stage Gather copy — section-level button copies all unchecked items (vessels + equipment + ingredients), each sub-category gets its own copy button for just that category's unchecked items
- [ ] #3 Spike evaluates Approach B: new cross-stage "Shopping List" action that aggregates unchecked items from ALL stages into one combined list, preserving the same two-level copy pattern (full list + per-category)
- [ ] #4 Each approach is evaluated against two user workflows: grocery shopping (clean buy-list on phone) and home prep (what's left to gather before starting)
- [ ] #5 Spike considers whether A and B can coexist (per-stage for prep, cross-stage for shopping) or if one supersedes the other
- [ ] #6 Spike output is a written recommendation in the parent task's implementation notes with rationale, covering UX fit, implementation complexity, and coexistence viability
- [ ] #7 Recommendation is specific enough to groom an implementation task from without re-evaluating the approaches
<!-- AC:END -->

## Implementation Notes

<!-- SECTION:NOTES:BEGIN -->
## PF-94 Spike: Smart Copy Recommendation

### Current Behavior

**GatherSection.vue** provides a single "Copy Mise en Place" button per stage. The `formatGatherForCopy()` function:

1. Copies **ALL items** regardless of checked state
2. Includes **all three categories**: Vessels, Equipment, and Ingredients
3. Format: plain text with section headers
4. Ingredients show `name — total + unit` but NOT the breakdown detail
5. Uses `navigator.clipboard.writeText()` with `IconButton.flashCopied()` feedback

**Progress state is available but unused by copy.** `GatherCategory.vue` already computes `uncheckedItems` and `checkedItems` via `useProgress().isItemChecked(id)`. Progress persists in **localStorage** keyed by `recipe-progress-{recipeId}`.

**RecipeMeta.vue** has a separate "Copy Recipe" button (Paprika export format) that already aggregates ingredients across all stages — proves cross-stage collection is straightforward.

### Data Landscape

All 9 current recipes have **exactly 1 stage with a gather section** (always the first stage, "Mise en Place"). No recipe splits ingredients across multiple stages. This means cross-stage aggregation (Approach B) adds zero value for current recipes.

Typical counts: 4–38 ingredients, 3–6 vessels, 4–13 equipment items.

### Approach A: Enhanced Per-Stage Gather Copy

**Two changes:**
1. Main "Copy" button copies only unchecked items. If all checked, show "Everything gathered!" feedback.
2. Per-category copy buttons (small clipboard icon next to category header) copy only unchecked items for that category.

**Pros:**
- Minimal new UI surface — enhances existing button, adds small icon buttons
- Directly addresses "copy what I still need" for both shopping and prep
- Localized to GatherSection.vue and GatherCategory.vue
- Checked state already computed in GatherCategory

**Cons:**
- Per-category buttons add some visual clutter
- Does not address (currently theoretical) multi-stage aggregation

**Complexity: Small** — 2-3 hours, mostly modifying `formatGatherForCopy()` to filter by checked state.

### Approach B: Cross-Stage Shopping List

New recipe-level action aggregating all unchecked ingredients from all stages.

**Pros:**
- Single-action "grab full shopping list" — ideal grocery workflow
- Future-proof for multi-stage gathers

**Cons:**
- **Adds zero value over A with current data** — all 9 recipes have exactly 1 gather stage
- Requires new component or significant additions to RecipeMeta/App.vue
- No obvious home for the button in current layout
- Must handle dedup for future multi-stage recipes
- More complex: new composable, cross-cutting aggregation logic

**Complexity: Medium** — 4-6 hours.

### Workflow Analysis

**Grocery Shopping:** Tie for current recipes. Approach A is simpler to reach (button is right where ingredients are).

**Home Prep:** Approach A wins — spatial proximity to the checklist items makes copy feel contextual.

### Coexistence Analysis

Can both coexist? Technically yes, but creates confusion: two copy actions for the same data in the single-gather case. The only scenario where B adds value over A is multi-stage gathers, which don't exist.

### Recommendation

**Implement Approach A: Enhanced per-stage gather copy with checked-state awareness.**

Rationale:
1. Immediate value for both workflows with minimal UI surface
2. Zero wasted complexity — doesn't build cross-stage infra for a non-existent pattern
3. Localized changes — confined to GatherSection/GatherCategory, low blast radius
4. Foundation for B — if multi-stage gathers arrive, the per-category copy pattern extends naturally
5. Progress infrastructure is already in place

### Implementation Sketch

1. **GatherSection.vue**: `formatGatherForCopy()` filters items where `isItemChecked(id)` is false. All checked → show "Everything gathered!" toast, don't copy.

2. **GatherCategory.vue**: Small clipboard icon in category header row. Copies unchecked items for that category only. Uses same `IconButton.flashCopied()` pattern. Only visible when unchecked items exist.

3. **Grocery-friendly format**: Ingredients-only copy produces clean list without headers/bullets:
   ```
   Unsalted Butter — 227g
   All-Purpose Flour — 531g
   ```

4. **Files to modify**: GatherSection.vue, GatherCategory.vue, tests + snapshots.

5. **Edge cases**: All checked → disable/hide copy. Empty category → already hidden. Progress reset → copies everything.
<!-- SECTION:NOTES:END -->
