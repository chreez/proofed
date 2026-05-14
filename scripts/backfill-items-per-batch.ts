/**
 * PF-265: Add `config.stats.itemsPerBatch` to recipes whose `defaultYield`
 * spans multiple physical oven batches. Mechanical, idempotent.
 *
 * Run: npx tsx scripts/backfill-items-per-batch.ts
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

interface Plan {
  id: string
  itemsPerBatch: number
  /** Patch-bump from N.M.P → N.M.(P+1). Match PF-264 pattern. */
  nextVersion: string
  rationale: string
}

const plans: Plan[] = [
  {
    id: 'sourdough-chocolate-chip-cookies',
    itemsPerBatch: 6,
    nextVersion: 'v2.0.2',
    rationale:
      'Recipe states "No more than 6 cookies per sheet" + "Bake one sheet at a time" — 23 cookies → 4 batches.',
  },
  {
    id: 'sourdough-discard-cheese-crackers',
    itemsPerBatch: 45,
    nextVersion: 'v1.1.2',
    rationale:
      'meta.yields explicitly says "2 sheet pans" for 90 crackers → 45 crackers per sheet, 2 batches.',
  },
  {
    id: 'simple-sourdough',
    itemsPerBatch: 1,
    nextVersion: 'v3.6.1',
    rationale:
      'One dutch oven holds one loaf; bake instructions explicitly sequence "first loaf" then "second loaf from fridge" — 2 batches.',
  },
  {
    id: 'simple-sourdough-wheat',
    itemsPerBatch: 1,
    nextVersion: 'v1.1.1',
    rationale:
      'One dutch oven, one loaf at a time; second loaf waits in fridge — 2 batches.',
  },
  {
    id: 'sourdough-cheddar-cheese',
    itemsPerBatch: 1,
    nextVersion: 'v1.1.1',
    rationale:
      'One dutch oven, one loaf at a time; second loaf waits in fridge — 2 batches.',
  },
  {
    id: 'jalapeno-cheddar-sourdough',
    itemsPerBatch: 1,
    nextVersion: 'v2.1.3',
    rationale:
      'One dutch oven, one loaf at a time — 2 batches.',
  },
  {
    id: 'birote-salado',
    itemsPerBatch: 3,
    nextVersion: 'v1.2.1',
    rationale:
      'Recipe says "Load 2-3 rolls into the preheated dutch oven" — 5 rolls / 3 per batch = 2 batches.',
  },
  {
    id: 'ny-style-pizza',
    itemsPerBatch: 1,
    nextVersion: 'v1.5.1',
    rationale:
      'One baking steel, one pizza at a time; recipe explicitly says "Repeat the stretch, top, and bake process for the second pizza" — 2 batches.',
  },
  {
    id: 'sourdough-pizza-dough',
    itemsPerBatch: 1,
    nextVersion: 'v1.4.1',
    rationale:
      'One baking steel, one pizza at a time — 2 batches.',
  },
]

const TODAY = '2026-05-12'

for (const plan of plans) {
  const path = resolve(`public/recipes/${plan.id}.json`)
  const raw = readFileSync(path, 'utf-8')
  const recipe = JSON.parse(raw)

  // Idempotency: skip if itemsPerBatch already matches.
  const existing = recipe.config?.stats?.itemsPerBatch
  if (existing === plan.itemsPerBatch) {
    console.log(`SKIP ${plan.id} — itemsPerBatch already ${existing}`)
    continue
  }
  if (existing !== undefined && existing !== plan.itemsPerBatch) {
    console.log(
      `WARN ${plan.id} — existing itemsPerBatch=${existing}, plan=${plan.itemsPerBatch}. Skipping (manual review)`
    )
    continue
  }

  if (!recipe.config?.stats) {
    console.log(`ERROR ${plan.id} — no config.stats block. Skipping.`)
    continue
  }

  // Capture current ingredients snapshot (mirrors stages[].gather.ingredients)
  const ingredientsSnapshot = (recipe.stages ?? [])
    .filter((s: { gather?: { ingredients?: unknown[] } }) =>
      Array.isArray(s.gather?.ingredients) && (s.gather?.ingredients?.length ?? 0) > 0
    )
    .map((s: { id: string; title: string; gather: { ingredients: unknown[] } }) => ({
      stageId: s.id,
      stageName: s.title,
      ingredients: structuredClone(s.gather.ingredients),
    }))

  // Add itemsPerBatch
  recipe.config.stats.itemsPerBatch = plan.itemsPerBatch

  // Version bump
  const oldVersion = recipe.version
  recipe.version = plan.nextVersion

  // Change_log entry
  if (!Array.isArray(recipe.change_log)) recipe.change_log = []
  recipe.change_log.push({
    version: plan.nextVersion,
    date: TODAY,
    summary: `Add config.stats.itemsPerBatch=${plan.itemsPerBatch} for throughput modeling (PF-265). ${plan.rationale}`,
    ...(ingredientsSnapshot.length > 0 ? { ingredients: ingredientsSnapshot } : {}),
  })

  writeFileSync(path, JSON.stringify(recipe, null, 2) + '\n', 'utf-8')
  console.log(
    `OK ${plan.id} | ${oldVersion} → ${plan.nextVersion} | itemsPerBatch=${plan.itemsPerBatch}`
  )
}

console.log('\nDone.')
