# PF-268 — Ingredient inventory + stock purchase planning (design)

> Status: design draft, no code shipped. PF-256 Slice S3.
>
> Owner-of-record: design author (this doc). Executor agent reads top-to-bottom
> and treats §Open Questions as defaults already chosen unless the user
> overrides during execution kickoff.

## 1. Goal & scope

Turn a `ProductionPlan` (PF-256 S0) into:

1. A **shopping list** — what to buy this week given on-hand inventory and
   planned bakes.
2. A **bulk-tier suggestion** — when a recipe rollup crosses the break-even
   threshold, surface "buy the 25 lb sack, save $X over N bakes."
3. An **inventory lens** at `/inventory` — see what's on hand, what's
   planned, what's needed, and what's expiring.

Out of scope (this design, will spawn follow-ups):
- Barcode / camera scan input for on-hand inventory.
- Multi-store comparison (HEB vs Costco vs restaurant supply).
- Automatic pantry depletion at bake time (only at `/bake-log` skill writes —
  call out as future hook, do not implement here).
- True-cost utility math (water/electric/gas) — that's DRAFT-23.

## 2. Data shapes

All shapes live in `src/types/inventory.ts` (new file). Mirrors the
`production.ts` style — flat, JSON-serializable, provenance-tagged.

### 2.1 Canonical ingredient catalog

A new static JSON at `public/ingredients/catalog.json`. Same authoring
pattern as `cost-rates.json` (one file, hand-curated, agent-editable). The
catalog is the **identity layer** — every recipe ingredient id resolves to
exactly one canonical entry.

```ts
export interface CanonicalIngredient {
  /** Stable canonical key (kebab-case). Used as the dedup key everywhere. */
  id: string                          // e.g. "ap-flour"
  /** Human display name. */
  name: string                        // "All-Purpose Flour"
  /** Category — drives expiry defaults and UI grouping. */
  category:
    | 'flour' | 'sugar' | 'fat' | 'dairy' | 'egg'
    | 'leaven' | 'spice' | 'liquid' | 'produce'
    | 'protein' | 'pantry' | 'sourdough'
  /** Aliases that map TO this canonical. Recipe ingredient ids and
   *  cost-rates.json keys both flow through this. */
  aliases: string[]                   // ["flour","ap_flour","ap-flour","all-purpose-flour"]
  /** Default shelf life in days from purchase / opening. `null` = shelf-stable
   *  (>1yr in airtight storage). Mirrors USDA FoodKeeper for category defaults. */
  shelfLifeDays: number | null        // 30 for eggs, 60 for butter, null for sugar
  /** True if expiry should surface "expiring soon" warnings. */
  perishable: boolean
  /** Bulk tiers available at the default store (HEB). Optional — items without
   *  tiers fall back to cost-rates.json single ratePerGram. */
  bulkTiers?: BulkTier[]
}

export interface BulkTier {
  /** Pack size in grams (e.g. 2268 = 5 lb, 11340 = 25 lb). */
  sizeGrams: number
  /** Pack price in dollars at the store. */
  price: number
  /** Convenience: price / sizeGrams. Authored, not computed, so cost-rates
   *  refresh skills can keep this in sync without recomputing on read. */
  ratePerGram: number
  /** Product name for shopping list display. */
  sourceProduct: string
  /** Optional: tier-specific expiry risk. 25 lb flour at home humidity
   *  starts going off ~120 days; we surface this as a perishability flag.
   *  null = same as catalog default. */
  perishabilityRiskDays?: number | null
}
```

### 2.2 On-hand inventory state

```ts
export interface InventoryItem {
  /** Opaque uuid for delete / update. */
  id: string
  /** Catalog canonical id — single source of truth for identity. */
  canonicalId: string
  /** Grams currently on hand. Manually entered MVP; future scan flows update
   *  this. Always integer grams. */
  amountGrams: number
  /** ISO 8601 date of purchase. Used to compute expiresAt when not set. */
  purchasedAt: string
  /** When the package was opened (some perishables only count from open
   *  date). Optional. */
  openedAt?: string
  /** Computed or user-entered expiry date. ISO 8601. When absent and the
   *  catalog item is perishable, resolver uses purchasedAt + shelfLifeDays. */
  expiresAt?: string
  /** Lot purchase price (the bulk pack the item came from). */
  lotPrice?: number
  /** Lot size at purchase (so we can show "1.2 of 5 lb sack remaining"). */
  lotSizeGrams?: number
  /** Provenance flag — who/what added this row. */
  addedBy: 'user' | 'agent'
  /** ISO 8601 add timestamp. */
  addedAt: string
}

export interface InventoryState {
  items: InventoryItem[]
  /** Bumped on every save. */
  updated: string
}
```

### 2.3 Shopping list output (derived, not persisted)

```ts
export interface ShoppingListEntry {
  canonicalId: string
  name: string
  category: CanonicalIngredient['category']
  /** Total grams demanded by the current ProductionPlan. */
  demandGrams: number
  /** Total grams on hand (sum of non-expired InventoryItems). */
  onHandGrams: number
  /** demand - onHand, clamped to 0. */
  shortfallGrams: number
  /** Recommended bulk tier when shortfall + projected weekly use crosses the
   *  break-even threshold. Else the smallest tier that covers shortfall. */
  recommendedTier: BulkTier
  /** Cost of `recommendedTier`. */
  estimatedCost: number
  /** Per-recipe breakdown so the user sees "30g for cinnamon buns +
   *  500g for sourdough." */
  contributions: Array<{ recipeId: string; grams: number; entries: number }>
  /** Items in inventory that expire before the next planned use of this
   *  ingredient — surface as a warning. */
  expiringSoon?: Array<{ itemId: string; expiresAt: string; amountGrams: number }>
}
```

## 3. Storage & files

| Concern | Location | Lifecycle |
|---|---|---|
| Canonical catalog | `public/ingredients/catalog.json` | Hand-authored / agent-edited. Versioned in git. |
| On-hand inventory | `localStorage['bake-inventory-current']` | Per-user, JSON `InventoryState`. Mirror of `bake-production-current` pattern from PF-256 S0. |
| Shopping list | Derived in `useShoppingList()` composable | Never persisted. Recomputed on plan or inventory change. |
| Bulk-tier prices | Authored inside catalog | Refreshed by `cost` skill alongside `cost-rates.json`. |

LocalStorage shape (parallels `ProductionPlan`):

```ts
// bake-inventory-current
{
  "items": [
    {
      "id": "01HV...",
      "canonicalId": "ap-flour",
      "amountGrams": 4500,
      "purchasedAt": "2026-05-08",
      "lotPrice": 12.48,
      "lotSizeGrams": 11340,
      "addedBy": "user",
      "addedAt": "2026-05-08T19:14:00Z"
    }
  ],
  "updated": "2026-05-08T19:14:00Z"
}
```

## 4. Identity dedup heuristic

The identity problem: `cost-rates.json` already has `flour`, `ap_flour`,
`ap-flour`, `levain_flour` all pointing at the same AP flour product. Recipe
ingredient ids vary across recipes (`flour-soaker`, `bread_flour`, `salt`,
`fine-sea-salt`, …). The shopping rollup must collapse all of these into
canonical buckets or the list is unusable.

**Algorithm (catalog-driven, no fuzzy matching):**

1. Build a `Map<alias, canonicalId>` at app startup from
   `catalog.json` (every entry contributes `id` + all `aliases`).
2. For each planned `Ingredient` in `Stage.gather.ingredients[]`:
   - Look up `ingredient.id` in the alias map → canonical id.
   - If miss: fall back to normalized name match (`name.toLowerCase().replace(/\s+/g,'-')`).
   - If still miss: emit an `UnmappedIngredient` warning surfaced in the
     `/inventory` lens header. The shopping list still functions but flags
     gaps for the executor agent to address (spawn drafts: "Add canonical
     entry for X").
3. Cost-rates keys are themselves aliased into the catalog at build time
   (a small dev script can seed the catalog from existing `cost-rates.json`
   keys → executor will write this).

**Why catalog-driven and not fuzzy:**
- Determinism. The user must trust that 30g of "flour" in recipe A and
  "ap_flour" in recipe B sum to 60g in the cart.
- Surfacing misses creates a backlog of "add to catalog" drafts rather
  than silently merging the wrong things (e.g. **bread flour** must NOT
  merge into AP flour even though both are "flour" — bulk price differs).

**Conflict pairs called out explicitly:**

| Recipe alias | Canonical | Notes |
|---|---|---|
| `flour`, `ap_flour`, `ap-flour`, `levain_flour`, `all-purpose-flour` | `ap-flour` | All AP, same price tier. |
| `bread_flour`, `bread-flour` | `bread-flour` | Separate canonical. Bulk tiers different. |
| `whole_wheat_flour` | `whole-wheat-flour` | Separate canonical. |
| `salt`, `fine-salt`, `fine-sea-salt`, `noodle_salt` | `fine-sea-salt` | All Morton iodized in current rates; flaky-salt is separate canonical. |
| `flaky-salt` | `flaky-salt` | Maldon — different price, different use, do NOT merge. |
| `butter`, `unsalted-butter`, `glaze-butter` | `unsalted-butter` | Same product, just allocated differently. |
| `egg`, `eggs`, `egg-yolks` | `eggs` | Yolks priced at whole-egg gram rate (matches cost-rates today). |

## 5. Bulk-tier math

Two pure functions live in `src/lib/inventory.ts` (new file).

### 5.1 `pricePerGram(weightGrams, tiers): { ratePerGram, tier }`

Given a target weight to buy and a sorted array of `BulkTier`, return the
**cheapest** tier whose `sizeGrams >= weightGrams` AND whose
`perishabilityRiskDays` does not exceed `projectedConsumeDays` (passed in by
caller).

Edge case: when no tier is large enough, return the **largest** tier — the
user just has to buy multiple. Caller multiplies.

### 5.2 `bulkBreakeven(bulkCost, baselineRatePerGram, projectedUseGramsPerWeek): { weeks, bakesEquivalent }`

```
weeks = bulkCost / (baselineRatePerGram * projectedUseGramsPerWeek - bulkRatePerGram * projectedUseGramsPerWeek)
```

Simplifies to:

```
weeks = bulkCost / (savingsPerGram * projectedUseGramsPerWeek)
```

Where `savingsPerGram = baselineRatePerGram - bulkRatePerGram`.

Worked example (AP flour, 5 lb vs 25 lb):
- 5 lb sack: $2.58, 2268g → $0.001137/g (the current `cost-rates.json` value).
- 25 lb sack: ~$10.48 (illustrative HEB price), 11340g → $0.000924/g.
- Savings per gram: $0.000213.
- If user bakes 2× sourdough/week (≈500g flour each) → 1000g/week use.
- Break-even: $10.48 / ($0.000213 × 1000) ≈ **49 weeks**.
- Conclusion for the lens: 5 lb is the right call unless the user actually
  bakes 4+ loaves/week. The math surfaces this honestly.

### 5.3 Perishability gate

Before recommending a tier, check `tier.perishabilityRiskDays` (or catalog
default). If `projectedConsumeDays > perishabilityRiskDays` AND the savings
don't cross the break-even before the perishability window, fall back to
the next-smaller tier with a note: *"25 lb saves $4 over 6 months, but
you'll only use 8 lb in that time — buying 5 lb."*

This is the rule that prevents the lens from telling someone to buy a
50 lb sack of flour for one bake.

## 6. Demand rollup spec

Pure function: `computeShoppingList(plan, inventory, catalog, recipes, projectedConsumePerWeek): ShoppingListEntry[]`

```
for entry in plan.entries:
  recipe = recipes[entry.recipeId]
  multiplier = effectiveYield(entry) / recipe.config.stats.defaultYield   // batches × baseYield, with override
  for stage in recipe.stages:
    for ingredient in stage.gather?.ingredients ?? []:
      canonicalId = catalog.aliasMap[ingredient.id] ?? normalizedFallback(ingredient.name)
      demand[canonicalId] += ingredient.total * multiplier
      contributions[canonicalId].push({ recipeId, grams, entries: 1 })

for canonicalId in demand:
  onHand = sum(item.amountGrams for item in inventory.items
               where item.canonicalId == canonicalId
               and not isExpired(item))
  shortfall = max(0, demand[canonicalId] - onHand)
  recommendedTier = pickTier(catalog[canonicalId].bulkTiers, shortfall, projectedConsumePerWeek)
  entry = ShoppingListEntry { canonicalId, demand, onHand, shortfall, recommendedTier, ... }
```

**Snapshot precedence** (mirrors `RecipePrintView` rule from PF-237):
- If `plan.entry` references a bake date with a `cook_log` entry → prefer
  `cook_log[].ingredients` snapshot.
- Else prefer the recipe's current-version `change_log[].ingredients`
  snapshot.
- Else fall back to `stages[].gather.ingredients`.
- Always honor `multiplier`.

This means the same plan reproduces deterministically even when recipes
are edited mid-week.

## 7. `/inventory` lens UX (sketch)

Route: `/inventory`. Sibling of `/production`. Three columns desktop, stacked
mobile.

```
┌─ Inventory ────────────────────────────────────────────────────────────┐
│                                                                        │
│  ON HAND                  PLANNED                  TO BUY              │
│  ─────────                ─────────                ──────              │
│  ap-flour       4.5 kg    ap-flour       1.8 kg    butter      225 g   │
│  butter         500 g     butter          730 g    eggs        6 ct    │
│  eggs           4 ct      eggs           10 ct     salt        ✓ have  │
│  salt           450 g     salt            12 g     ─── bulk? ───       │
│  ▲ 25 lb flour                                     suggest 25lb sack:  │
│    purchased 2026-05-08                            $10.48 / breakeven  │
│    ⚠ expiring 2026-09-05                           49 wks. KEEP 5lb.   │
│                                                                        │
│  [+ add on-hand]          [open Production Plan]   [copy list]         │
│                                                                        │
│  Unmapped ingredients (2): "pork_femur_bones", "thai_tea_mix"          │
│  → add to canonical catalog                                            │
└────────────────────────────────────────────────────────────────────────┘
```

Interactions:
- **+ add on-hand** → modal: canonical id (typeahead from catalog), grams,
  purchased date, optional opened date, optional lot price/size.
- **Each To Buy row** is selectable; selected rows compose a clipboard
  payload via `copyToClipboard` (F28 compliance).
- **Bulk suggestion** is a per-row inline accordion, never the headline —
  the lens defaults to "buy what you need," not "always go bulk."
- **Expiring soon** rows are highlighted amber when the bake plan won't
  consume them in time.
- **Unmapped ingredients** footer is the single nudge to maintain the
  catalog — clicking one opens a "create canonical entry" form (or
  spawns a draft task; executor decides).

Tooltips: every column header + every derived number gets a tooltip
(PF-256 F43). Numbers carry provenance dots (user / agent / derived) like
the rest of the bakery-ops surface.

## 8. Integration with `/pricing` cost factor stack

When `ShoppingListEntry.recommendedTier` is **accepted** by the user (an
explicit click — does not auto-apply), the user's profile records a
`bulkOverride` for that `canonicalId`:

```ts
// localStorage['bake-cost-profile'] (extends existing pricing profile)
{
  "bulkOverrides": {
    "ap-flour": { "tierSizeGrams": 11340, "ratePerGram": 0.000924, "acceptedAt": "..." }
  }
}
```

The `/pricing` lens's CP calc consults `bulkOverrides` BEFORE
`cost-rates.json`. When found, ingredient cost = `amount * bulkRate`. The
lens surfaces "unlocked: 25 lb tier" badge with provenance `bulk`.

When the user runs out of the bulk lot (inventory amount drops below the
next reorder threshold), the override expires automatically — `/inventory`
nudges "your bulk AP flour is depleted; reverting to 5 lb rate."

No backend, no auth — this is all localStorage state, mirrors PF-256 S0
patterns.

## 9. Agent skill surface (future, called out only)

`/inventory` skill (out of scope for this design — spawn draft):
- Read scratchpad / chat input → `+30g salt added to pantry`.
- Read bake-log writes → automatically deplete on-hand for the ingredients
  the bake consumed (uses the cook_log ingredient snapshot).
- Read receipts (future) → bulk-add InventoryItems with lot data.

Hook point: at `/bake-log` write, the skill should be able to call
`inventoryDeplete(canonicalId, grams, lotId?)`. Wire this in S3 follow-up,
not now.

## 10. Open questions (defaults chosen)

1. **Where does `projectedUseGramsPerWeek` come from for bulk math?**
   Default: derive from `cook_log` lifetime cadence + average ingredient
   use over the last 8 weeks. Fallback to "1 plan = 1 week" when cook_log is
   sparse. User can override per-ingredient in `/inventory`.

2. **Multi-store?** Default: HEB only, mirrors current `cost-rates.json`
   single-source-of-truth pattern. Catalog has a `store` field reserved
   but unused.

3. **Inventory reconciliation drift?** Default: trust the user. No
   reconciliation prompts in MVP. Future: nightly "did you bake today?"
   nudge.

4. **Pantry vs fridge zones?** Default: single inventory pool. Catalog
   `category` is the only zoning signal. Future: per-storage-location
   sub-buckets if user requests.

5. **Currency / locale?** Default: USD, dollars. Hardcoded to match
   `cost-rates.json` today.

6. **Auth / multi-user?** Default: single-user localStorage, matches every
   other lens. Out of scope.

## 11. Validation criteria additions (for executor)

When this task moves to implementation, the executor agent should add to
`.claude/rules/validation/checklist.md`:

| ID | Feature | Check |
|---|---|---|
| F4x | Catalog completeness | Every ingredient id used in any `public/recipes/*.json` resolves to a canonical id (no `UnmappedIngredient` warnings in fresh build). |
| F4x | Shopping list determinism | `computeShoppingList(plan, ø inventory, catalog, recipes)` returns the same totals when called twice on identical input (pure). |
| F4x | Bulk break-even sanity | `bulkBreakeven` never returns negative weeks; perishability gate fires when `weeks > perishabilityRiskDays / 7`. |
| F4x | Inventory persistence | Items added via `/inventory` survive page reload (localStorage). |
| F4x | Bulk override CP coupling | Accepting a bulk tier in `/inventory` changes the `/pricing` CP for the affected recipes within the same session. |

## 12. Follow-up drafts spawned

| Draft | Title | Depends on |
|---|---|---|
| DRAFT-102 | Build ingredient canonical catalog seed | — |
| DRAFT-103 | /inventory route + composables (S3-A) | DRAFT-102 |
| DRAFT-104 | /inventory agent skill — chat-driven on-hand mutation | DRAFT-103 |
| DRAFT-105 | Bake-log → inventory depletion hook | DRAFT-104 |
| DRAFT-106 | Bulk-tier price refresh in /cost skill | DRAFT-102 |
| DRAFT-111 | /pricing CP integration with bulk overrides (S3-C) | DRAFT-103, DRAFT-104 |

Each draft includes a `Source: PF-268 design notes §X` pointer back to the
relevant design section. None of them are groomed yet — the executor agent
or future grooming pass picks them up individually.

## 13. References

- PF-256 — Bakery Ops umbrella; this is Slice S3.
- PF-237 — Ingredient snapshot rules (cook_log / change_log precedence).
- DRAFT-23 — Adjacent: true-cost calculator. Different concern (utilities).
- `src/types/production.ts` — Pattern for shared-state types.
- `public/recipes/cost-rates.json` — Existing per-gram rate source.
- F28 — Clipboard via `copyToClipboard` (used by "copy list" action).
- F43 — Tooltips on every interactive element (referenced in PF-256 epic).
