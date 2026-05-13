---
id: DRAFT-95
title: 'Bakery Ops Assistant — full-service local (bake + schedule + sell)'
status: Draft
assignee: []
created_date: '2026-05-12'
labels:
  - epic
  - bakery-ops
  - umbrella
dependencies: []
---

## Description

<!-- SECTION:DESCRIPTION:BEGIN -->
Umbrella epic. Reframes PF-255 (pricing planner) as one narrow first slice of a much larger ambition: a full-service local baking + scheduling + selling assistant. Captured during PF-255 rework clarify loop on 2026-05-12 after the user named the actual goal.

### Audiences

- **Primary**: personal use — maximize the user's own time, support real baking workflow this week and ongoing.
- **Secondary**: portfolio / proof-of-capability — system architecture must read as "this could run a real bakery" to a hiring manager or bakery owner who lands on the site. No fake demo data; the user's real usage is the demo.

### Vision (one paragraph)

A local-first (no backend; JSON files + localStorage), agent-in-loop application that helps a baker decide what to bake, plan production across an oven/fridge/baker constraint set, set honest prices, print labels for sale, and track sales. Every datum carries provenance and a confidence flag so the user and agent skills both know which numbers are solid and which are estimates. Bakery owners or partners can see the same surface and immediately understand the scaling path (multi-baker, inventory, batch optimization).

### Architecture

```
              Full-service baking + scheduling + selling assistant
              (local-only, JSON+localStorage, agent-in-loop, accuracy-flagged)
                                       │
                                       ▼
                            ┌─────────────────────┐
                            │  Production Plan    │ ← shared state, provenance-tagged
                            │  • recipes          │
                            │  • quantities       │
                            │  • prices           │
                            │  • scheduled times  │
                            │  • assigned bakers  │
                            └──────────┬──────────┘
                                       │
           ┌─────────┬──────────┬──────┼──────┬─────────┬───────────┐
           ▼         ▼          ▼      ▼      ▼         ▼           ▼
         PLAN     PRICE     LABELS  SCHED   SELL    FINANCIALS  DATA HEALTH
       what to   set       per-    drag-   cash    $/hr, CP,   provenance,
       bake +    prices    unit    to-     log,    maint       confidence,
       $/hr      w/ unit   nut +   queue,  inv     break-even  gaps view
                 cost      ingr +  multi-  reduce
                 stack     allerg  baker
```

### Lenses (views over the shared plan)

| Lens | Primary action | First number to surface | Status |
|------|----------------|-------------------------|--------|
| Plan | what am I making this week | $/hr per recipe, total batch profit | needs design |
| Pricing | set per-unit prices | suggested whole-dollar sell price | partial — PF-255.1 shipped narrow |
| Labels | print per-unit labels | nutrition + ingredients + allergens | needs design |
| Schedule | fit bakes into time / resources | drag-to-queue + profit/hr overlay | design done — PF-255.4 |
| Sell | record sales, deplete inventory | cash sold today, units remaining | needs design |
| Financials | break-even projection | weeks-to-cover-maintenance | needs design |
| Data Health | trust the numbers | % of fields high-confidence per recipe | needs design |

### Cost factor stack

Each lens that touches money composes a CP using some subset:

1. **Ingredients** — sum of `cook_log.cost.items[]` (PF-255.1 ships with this)
2. **Packaging** — per-recipe field (box, sleeve, sticker)
3. **Labor** — `prep_active_min × hourly_rate` (needs DRAFT-83 timing + global rate)
4. **Energy** — `bake_min × oven_kw × kwh_rate` (estimate, low confidence acceptable)
5. **Overhead allocation** — fixed monthly costs ÷ bakes per month
6. **Maintenance / aux** — equipment depreciation + service + sanitation ÷ monthly bakes; surfaces "weeks-to-break-even" projection
7. **Bulk amortization** — bulk capital ÷ projected use (formula captured in pf-255.2-spike-notes.md §4)

User opts each factor in/out via profile. v1 ships ingredients + labor as the recommended floor.

### Resources

- **Oven** — 1 slot (single home oven), exclusive use
- **Fridge** — N slots for cold retard, finite
- **Bakers** — capacity, $/hr, available windows; v1 = single baker
- **Ingredients** — inventory level, bulk-tier pricing (DRAFT-91)
- **Workspace** — parallel-action limit (only one dough rolled at a time)

### Hard requirements

1. **Local-only** — no backend, no auth. JSON files in `public/` and per-user state in `localStorage`. Exports as JSON snapshots.
2. **Agent-in-loop** — every lens that mutates state goes through an agent skill (mirrors `/bake-log` pattern). Skills can read the data layer without complex type indirection.
3. **Provenance** — every datum tagged with source (`user`, `agent`, `derived`, `recipe_default`).
4. **Confidence** — derived numbers carry `high/medium/low` like existing `bake_stats.confidence`.
5. **No fake demo data** — user's real usage is the only data. Empty states explain how to seed (link to /bake-log skill, recipe library, etc.).
6. **Pull-when-needed** — lenses are accessed when the user is in that flow; planning is the default home, others one click away.

### Use cases captured

1. **"What should I charge for these cinnamon buns?"** — per-unit price setting on a single recipe.
2. **"Is baking sourdough worth my time?"** — $/hr decision support across recipes.
3. **"What do I bake this weekend to make the most money?"** — sortable plan view, profit/hr ranking.
4. **"Print labels for the rolls I'm selling Saturday."** — per-unit label generation (nutrition + ingredients + allergens).
5. **"Shopping list for next week's bakes."** — ingredient rollup across planned recipes (DRAFT-91).
6. **"How long until my oven repair is covered?"** — maintenance break-even projection (new).
7. **"Track today's sales (cash)."** — sell-side, lower priority (later slice).

### Slice candidates

Each slice = one cohesive piece that ships independently:

- **S0 — Plan skeleton**: shared `ProductionPlan` state in localStorage + types + agent-readable JSON shape + a thin /ops/plan view showing planned recipes. Foundation for every other lens.
- **S1 — Plan + Price (rework PF-255.1)**: per-recipe unit label, whole-dollar pricing, compact data-driven table, ingredient + labor CP, opt-in tracking (DRAFT-90). Replaces the current /pricing.
- **S2 — Labels lens**: per-unit nutrition + ingredients + allergens, printable.
- **S3 — Plan + Inventory**: ingredient rollup → shopping list (DRAFT-91).
- **S4 — Plan + Schedule**: drag-to-queue per PF-255.4 design (needs DRAFT-83 timing first).
- **S5 — Data Health view**: provenance + confidence per field, gap surface (extends DRAFT-94 step times).
- **S6 — Sell lens**: cash sales log, deplete inventory.
- **S7 — Financials / break-even**: maintenance/overhead projection.
- **S8 — Multi-baker, bulk, batch optimization** (DRAFT-92 / 93 / 94 territory).

### Reframe of existing PF-255 work

PF-255 epic + subtasks (.1-.6) **stay closed** — the work shipped and the design docs are valid. But the scope was narrow. This epic (DRAFT-95) is what the user actually meant. PF-255 becomes "the first narrow slice that proved the data philosophy works."

The 11 follow-up drafts spawned during PF-255 execution all roll up under DRAFT-95:

- DRAFT-80, 83 (dup) — throughput backfill → unblocks S4 schedule
- DRAFT-81, 84 (dup) — config.stats backfill → S0 / S1
- DRAFT-82 — nutrition → S2 labels
- DRAFT-85 — cost.items refresh → S1 pricing accuracy
- DRAFT-86 — itemsPerBatch field → S4 schedule
- DRAFT-87 — D4 timer audit → data quality, S5
- DRAFT-88 — estimatedCost seed → S1 pricing accuracy
- DRAFT-89 — tooltips primitive → applies to all lenses
- DRAFT-90 — units + opt-in tracking → S1 rework
- DRAFT-91 — inventory + bulk → S3
- DRAFT-92 — multi-baker → S8
- DRAFT-93 — passive batching → S8
- DRAFT-94 — observed times + per-state assignment → S5 / S8

### Open decisions (to resolve in grooming)

1. URL/nav shape: `/ops/{plan,price,labels,...}` vs `/pricing` retained with lens toggle?
2. v1 spine: S0 (Plan skeleton alone, ships fastest), S1 (rework pricing + Plan together), or another?
3. Provenance schema — extend existing `source: user|agent` pattern on StateNote, or new dedicated wrapper?
4. Single profile vs multiple profiles per user (home baker vs side hustle vs portfolio demo)?
5. Empty-state design — what does first-time `/ops/plan` show when there are no planned bakes?

### Definition of "shippable" (set the bar higher than PF-255.1)

- Visual review by user on actual personal data, not synthetic — must feel useful in their next bake session.
- Tooltips on every interactive element (F43 enforced).
- Compact, data-driven layout (spreadsheet-grade density, not narrative cards).
- Provenance + confidence visible on derived numbers.
- Agent skill (mirroring `/bake-log`) is callable for any state mutation.

### Next steps

1. User picks v1 spine slice (S0 / S1 / other) in grooming.
2. Groom S0 (Plan skeleton) as DRAFT-95.1 — it's the dependency for every other slice anyway.
3. Sequence slice order with user.
4. Dedupe DRAFT-80⇔83 and DRAFT-81⇔84 before either cluster is groomed.
<!-- SECTION:DESCRIPTION:END -->
