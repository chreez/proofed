/**
 * PF-267: Backfill throughput timing fields on recipe meta.
 *
 * Adds 4 optional numeric fields to `meta` derived by walking
 * `stages[].states[]` and classifying each `RecipeState` into one of four
 * buckets:
 *
 *   prep_active_min       hands-on baker time (active counter / stove work)
 *   proof_passive_min     passive rests, ferments, retards, cool-on-rack
 *   oven_occupancy_min    total oven slot footprint (preheat + bake)
 *   bake_min              active oven time (bake/roast only, no preheat)
 *
 * Classification heuristic (in order — first match wins):
 *
 *   1. PREHEAT      state.id.includes('preheat')
 *                   → oven_occupancy_min only.
 *                   Strict id-only predicate avoids the
 *                   `PREP_WORKSPACE 'Preheat & Gather'` false positive
 *                   flagged in PF-255.3 spike notes §6 (title contains
 *                   "preheat" but the state's primary action is gathering
 *                   tools, not preheating).
 *
 *   2. BAKE/ROAST   state.id includes 'bake' or 'roast' (case-insensitive),
 *                   OR the parent stage's id/title matches /bake/i.
 *                   → bake_min + oven_occupancy_min.
 *
 *   3. PASSIVE      timer === true (not preheat, not bake).
 *                   → proof_passive_min.
 *                   Per the task heuristic, this folds `cool` states with
 *                   `timer:true` (e.g. "Cool on Rack", 60 min) into
 *                   proof_passive_min because the baker is free during
 *                   cool. The oven is also free during cool — that's the
 *                   important invariant for the scheduler. If a future
 *                   field `cool_min` is split out, this can be refined.
 *
 *   4. ACTIVE       default fallthrough (timer:false, not preheat/bake).
 *                   → prep_active_min.
 *
 * States with `duration_min` of null/undefined contribute 0 to all buckets.
 *
 * Idempotency: if the 4 computed fields already match the recipe's stored
 * meta values exactly, the recipe is skipped — no version bump.
 *
 * Per-recipe touched: patch version bump (vX.Y.Z → vX.Y.Z+1), change_log
 * entry with PF-237 ingredient snapshot, append to change_log[] tail.
 *
 * Run: npx tsx scripts/backfill-recipe-timing.ts
 */

import { readFileSync, writeFileSync, readdirSync } from 'node:fs'
import { resolve } from 'node:path'

const RECIPES_DIR = resolve('public/recipes')
const TODAY = '2026-05-12'

interface IngredientSnapshot {
  stageId: string
  stageName: string
  ingredients: unknown[]
}

interface RecipeStateLike {
  id: string
  title: string
  duration_min?: number | null
  timer?: boolean
}

interface RecipeStageLike {
  id: string
  title: string
  states: string[]
  gather?: { ingredients?: unknown[] } | null
}

interface RecipeLike {
  version: string
  meta: Record<string, unknown> & {
    prep_active_min?: number
    proof_passive_min?: number
    oven_occupancy_min?: number
    bake_min?: number
  }
  stages: RecipeStageLike[]
  states: RecipeStateLike[]
  change_log?: Array<Record<string, unknown>>
}

interface TimingResult {
  prep_active_min: number
  proof_passive_min: number
  oven_occupancy_min: number
  bake_min: number
}

type Bucket = 'preheat' | 'bake' | 'passive' | 'active'

function isBakeStage(stage: RecipeStageLike): boolean {
  return /bake/i.test(stage.id) || /bake/i.test(stage.title)
}

function classifyState(
  state: RecipeStateLike,
  stage: RecipeStageLike
): Bucket {
  const id = (state.id ?? '').toLowerCase()
  const title = (state.title ?? '').toLowerCase()

  // 1. Strict preheat: id-only match (title contains "preheat" but other
  //    primary action is the spike-flagged false-positive case).
  if (id.includes('preheat')) return 'preheat'

  // 2. Bake/roast keyword on state id OR title, OR state lives in a
  //    bake-named stage. Any of these → oven occupancy + bake_min.
  if (
    /\b(bake|roast)\b/.test(id) ||
    /\b(bake|roast)\b/.test(title) ||
    id.includes('bake') ||
    id.includes('roast') ||
    title.includes('bake') ||
    title.includes('roast') ||
    isBakeStage(stage)
  ) {
    return 'bake'
  }

  // 3. timer:true → passive (proof, rest, ferment, retard, cool-on-rack)
  if (state.timer === true) return 'passive'

  // 4. Default: active hands-on work
  return 'active'
}

function computeTiming(recipe: RecipeLike): TimingResult {
  const stateById = new Map<string, RecipeStateLike>()
  for (const st of recipe.states ?? []) stateById.set(st.id, st)

  let prep_active_min = 0
  let proof_passive_min = 0
  let oven_occupancy_min = 0
  let bake_min = 0

  for (const stage of recipe.stages ?? []) {
    for (const stateId of stage.states ?? []) {
      const state = stateById.get(stateId)
      if (!state) continue
      const dur = state.duration_min
      if (typeof dur !== 'number' || dur <= 0) continue

      const bucket = classifyState(state, stage)
      switch (bucket) {
        case 'preheat':
          oven_occupancy_min += dur
          break
        case 'bake':
          bake_min += dur
          oven_occupancy_min += dur
          break
        case 'passive':
          proof_passive_min += dur
          break
        case 'active':
          prep_active_min += dur
          break
      }
    }
  }

  return { prep_active_min, proof_passive_min, oven_occupancy_min, bake_min }
}

function buildSnapshot(recipe: RecipeLike): IngredientSnapshot[] {
  return (recipe.stages ?? [])
    .filter(
      (s) =>
        Array.isArray(s.gather?.ingredients) &&
        (s.gather?.ingredients?.length ?? 0) > 0
    )
    .map((s) => ({
      stageId: s.id,
      stageName: s.title,
      ingredients: structuredClone(s.gather!.ingredients!),
    }))
}

function bumpPatch(version: string): string {
  const m = version.match(/^v(\d+)\.(\d+)\.(\d+)$/)
  if (!m) throw new Error(`Cannot parse version: ${version}`)
  const [, maj, min, pat] = m
  return `v${maj}.${min}.${Number(pat) + 1}`
}

function timingsEqual(a: TimingResult, b: Partial<TimingResult>): boolean {
  return (
    a.prep_active_min === b.prep_active_min &&
    a.proof_passive_min === b.proof_passive_min &&
    a.oven_occupancy_min === b.oven_occupancy_min &&
    a.bake_min === b.bake_min
  )
}

interface SummaryRow {
  id: string
  oldVersion: string
  newVersion: string | null
  timing: TimingResult
  action: 'updated' | 'skipped'
  reason?: string
}

function processFile(filename: string): SummaryRow {
  const path = resolve(RECIPES_DIR, filename)
  const raw = readFileSync(path, 'utf-8')
  const recipe = JSON.parse(raw) as RecipeLike
  const id = filename.replace(/\.json$/, '')

  const timing = computeTiming(recipe)

  // Idempotency check
  const current: Partial<TimingResult> = {
    prep_active_min: recipe.meta.prep_active_min,
    proof_passive_min: recipe.meta.proof_passive_min,
    oven_occupancy_min: recipe.meta.oven_occupancy_min,
    bake_min: recipe.meta.bake_min,
  }
  if (timingsEqual(timing, current)) {
    return {
      id,
      oldVersion: recipe.version,
      newVersion: null,
      timing,
      action: 'skipped',
      reason: 'timing fields already match',
    }
  }

  // Mutate meta
  recipe.meta.prep_active_min = timing.prep_active_min
  recipe.meta.proof_passive_min = timing.proof_passive_min
  recipe.meta.oven_occupancy_min = timing.oven_occupancy_min
  recipe.meta.bake_min = timing.bake_min

  // Version bump
  const oldVersion = recipe.version
  const newVersion = bumpPatch(oldVersion)
  recipe.version = newVersion

  // Change_log entry + PF-237 snapshot
  const ingredientsSnapshot = buildSnapshot(recipe)
  if (!Array.isArray(recipe.change_log)) recipe.change_log = []
  recipe.change_log.push({
    version: newVersion,
    date: TODAY,
    summary:
      `Backfill throughput timing fields on meta — prep_active=${timing.prep_active_min}m, ` +
      `proof_passive=${timing.proof_passive_min}m, oven_occupancy=${timing.oven_occupancy_min}m, ` +
      `bake=${timing.bake_min}m. Derived mechanically by walking stages[].states[] ` +
      `per PF-255.3 spike heuristic. (PF-267)`,
    ...(ingredientsSnapshot.length > 0 ? { ingredients: ingredientsSnapshot } : {}),
  })

  writeFileSync(path, JSON.stringify(recipe, null, 2) + '\n', 'utf-8')

  return {
    id,
    oldVersion,
    newVersion,
    timing,
    action: 'updated',
  }
}

function main(): void {
  const files = readdirSync(RECIPES_DIR)
    .filter(
      (f) =>
        f.endsWith('.json') && !['index.json', 'cost-rates.json'].includes(f)
    )
    .sort()

  const rows: SummaryRow[] = []
  for (const f of files) {
    try {
      rows.push(processFile(f))
    } catch (e) {
      console.error(`ERROR ${f}:`, e)
    }
  }

  // Print summary
  console.log('\n=== PF-267 Timing Backfill Summary ===\n')
  console.log(
    [
      'recipe'.padEnd(38),
      'old'.padEnd(10),
      'new'.padEnd(10),
      'prep'.padStart(5),
      'proof'.padStart(6),
      'oven'.padStart(5),
      'bake'.padStart(5),
      'action',
    ].join('  ')
  )
  console.log('-'.repeat(100))
  for (const r of rows) {
    console.log(
      [
        r.id.padEnd(38),
        r.oldVersion.padEnd(10),
        (r.newVersion ?? '—').padEnd(10),
        String(r.timing.prep_active_min).padStart(5),
        String(r.timing.proof_passive_min).padStart(6),
        String(r.timing.oven_occupancy_min).padStart(5),
        String(r.timing.bake_min).padStart(5),
        r.action + (r.reason ? ` (${r.reason})` : ''),
      ].join('  ')
    )
  }

  const updated = rows.filter((r) => r.action === 'updated').length
  const skipped = rows.filter((r) => r.action === 'skipped').length
  console.log(`\nUpdated: ${updated} | Skipped: ${skipped} | Total: ${rows.length}`)

  // Aggregate stats
  const stats = rows.reduce(
    (acc, r) => {
      acc.totalPrep += r.timing.prep_active_min
      acc.totalProof += r.timing.proof_passive_min
      acc.totalOven += r.timing.oven_occupancy_min
      acc.totalBake += r.timing.bake_min
      if (r.timing.proof_passive_min > acc.maxProof.val) {
        acc.maxProof = { val: r.timing.proof_passive_min, id: r.id }
      }
      if (r.timing.bake_min > acc.maxBake.val) {
        acc.maxBake = { val: r.timing.bake_min, id: r.id }
      }
      if (r.timing.prep_active_min > acc.maxPrep.val) {
        acc.maxPrep = { val: r.timing.prep_active_min, id: r.id }
      }
      return acc
    },
    {
      totalPrep: 0,
      totalProof: 0,
      totalOven: 0,
      totalBake: 0,
      maxProof: { val: 0, id: '' },
      maxBake: { val: 0, id: '' },
      maxPrep: { val: 0, id: '' },
    }
  )
  const n = rows.length || 1
  console.log(
    `\nAvg prep_active_min:    ${(stats.totalPrep / n).toFixed(1)}\n` +
      `Avg proof_passive_min:  ${(stats.totalProof / n).toFixed(1)}\n` +
      `Avg oven_occupancy_min: ${(stats.totalOven / n).toFixed(1)}\n` +
      `Avg bake_min:           ${(stats.totalBake / n).toFixed(1)}\n` +
      `Max proof: ${stats.maxProof.val}m (${stats.maxProof.id})\n` +
      `Max bake:  ${stats.maxBake.val}m (${stats.maxBake.id})\n` +
      `Max prep:  ${stats.maxPrep.val}m (${stats.maxPrep.id})`
  )
}

main()
