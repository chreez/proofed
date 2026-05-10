/**
 * Backfill per-version + per-bake ingredient snapshots into all recipe JSON
 * files (PF-237).
 *
 * Idempotent: re-running on a recipe whose snapshots already exist must NOT
 * modify them. Only fills missing snapshots.
 *
 * Per-version: writes `change_log[].ingredients` for each entry by cloning
 * the *current* recipe gather state. (Historical versions no longer have the
 * exact per-version ingredient list — this backfill assumes the current
 * gather is a reasonable proxy for all listed versions. Going forward, the
 * /feedback skill should write a snapshot at the moment of each version
 * bump so it captures the actual baseline at that moment.)
 *
 * Per-bake: writes `cook_log[].ingredients` by cloning the matching version
 * snapshot (or current gather if no version match). No experimental deltas
 * are inferred — the backfill produces a baseline-aligned snapshot. Real
 * deltas are written by /bake-log going forward.
 *
 * Usage:
 *   npx tsx scripts/sync-ingredient-snapshots.ts                  # all recipes
 *   npx tsx scripts/sync-ingredient-snapshots.ts --dry-run        # report only
 *   npx tsx scripts/sync-ingredient-snapshots.ts public/recipes/foo.json
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs'
import { resolve, basename } from 'path'
import type {
  Recipe,
  IngredientSnapshotGroup,
  Ingredient,
  ChangeLogEntry,
  CookLogEntry,
} from '../src/types/recipe'

interface SyncStats {
  file: string
  versionsAdded: number
  versionsSkipped: number
  bakesAdded: number
  bakesSkipped: number
  changed: boolean
}

/**
 * Build a per-stage ingredient snapshot from a recipe's current gather state.
 * Filters stages without ingredients. Deep-clones to avoid sharing references.
 */
function buildSnapshotFromGather(recipe: Recipe): IngredientSnapshotGroup[] {
  return recipe.stages
    .filter(stage => stage.gather?.ingredients && stage.gather.ingredients.length > 0)
    .map(stage => ({
      stageId: stage.id,
      stageName: stage.title,
      ingredients: (stage.gather!.ingredients as Ingredient[]).map(ing => cloneIngredient(ing)),
    }))
}

function cloneIngredient(ing: Ingredient): Ingredient {
  return {
    id: ing.id,
    name: ing.name,
    total: ing.total,
    unit: ing.unit,
    breakdown: ing.breakdown
      ? ing.breakdown.map(b => ({ label: b.label, amount: b.amount }))
      : null,
    ...(ing.sourcedFrom !== undefined ? { sourcedFrom: ing.sourcedFrom } : {}),
    ...(ing.confidence !== undefined ? { confidence: ing.confidence } : {}),
    ...(ing.rationale !== undefined ? { rationale: ing.rationale } : {}),
  }
}

function cloneSnapshot(snapshot: IngredientSnapshotGroup[]): IngredientSnapshotGroup[] {
  return snapshot.map(g => ({
    stageId: g.stageId,
    stageName: g.stageName,
    ingredients: g.ingredients.map(cloneIngredient),
  }))
}

/**
 * Pure, testable sync function — operates on an in-memory recipe and returns
 * `{ recipe, stats, changed }`. The CLI shell calls this per-file then
 * decides whether to write. Idempotent: an already-synced recipe returns
 * `changed: false` with no edits.
 */
export function syncRecipeSnapshots(input: Recipe, fileLabel: string): {
  recipe: Recipe
  stats: SyncStats
} {
  const recipe: Recipe = JSON.parse(JSON.stringify(input))
  const stats: SyncStats = {
    file: fileLabel,
    versionsAdded: 0,
    versionsSkipped: 0,
    bakesAdded: 0,
    bakesSkipped: 0,
    changed: false,
  }

  const currentGatherSnapshot = buildSnapshotFromGather(recipe)
  // If the recipe has zero gather ingredients, there's nothing to snapshot.
  if (currentGatherSnapshot.length === 0) {
    return { recipe, stats }
  }

  // Backfill change_log[].ingredients
  if (recipe.change_log && recipe.change_log.length > 0) {
    for (const entry of recipe.change_log) {
      const e = entry as ChangeLogEntry
      if (e.ingredients && e.ingredients.length > 0) {
        stats.versionsSkipped++
        continue
      }
      e.ingredients = cloneSnapshot(currentGatherSnapshot)
      stats.versionsAdded++
      stats.changed = true
    }
  }

  // Backfill cook_log[].ingredients
  if (recipe.cook_log && recipe.cook_log.length > 0) {
    for (const entry of recipe.cook_log) {
      const e = entry as CookLogEntry
      if (e.ingredients && e.ingredients.length > 0) {
        stats.bakesSkipped++
        continue
      }
      // Prefer the matching version's snapshot if present, else current gather.
      const versionSnapshot = recipe.change_log?.find(c => c.version === e.version)?.ingredients
      const baseline =
        versionSnapshot && versionSnapshot.length > 0
          ? versionSnapshot
          : currentGatherSnapshot
      e.ingredients = cloneSnapshot(baseline)
      stats.bakesAdded++
      stats.changed = true
    }
  }

  return { recipe, stats }
}

function listRecipeFiles(): string[] {
  const dir = resolve(process.cwd(), 'public/recipes')
  return readdirSync(dir)
    .filter(f => f.endsWith('.json') && f !== 'index.json' && f !== 'cost-rates.json')
    .map(f => resolve(dir, f))
}

function processFile(filePath: string, dryRun: boolean): SyncStats {
  const raw = readFileSync(filePath, 'utf-8')
  const recipe: Recipe = JSON.parse(raw)
  const { recipe: updated, stats } = syncRecipeSnapshots(recipe, basename(filePath))

  if (stats.changed && !dryRun) {
    writeFileSync(filePath, JSON.stringify(updated, null, 2) + '\n', 'utf-8')
  }
  return stats
}

function main(): void {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')
  const fileArgs = args.filter(a => !a.startsWith('--'))
  const files = fileArgs.length > 0 ? fileArgs.map(f => resolve(f)) : listRecipeFiles()

  console.log(`sync-ingredient-snapshots: processing ${files.length} recipe(s)${dryRun ? ' (dry run)' : ''}`)
  console.log('')

  let totalVersionsAdded = 0
  let totalBakesAdded = 0
  let recipesChanged = 0

  for (const file of files) {
    const stats = processFile(file, dryRun)
    if (stats.changed) recipesChanged++
    totalVersionsAdded += stats.versionsAdded
    totalBakesAdded += stats.bakesAdded
    const status = stats.changed ? 'WRITE' : '  --  '
    console.log(
      `[${status}] ${stats.file}: +${stats.versionsAdded} versions, +${stats.bakesAdded} bakes ` +
        `(skipped ${stats.versionsSkipped} versions, ${stats.bakesSkipped} bakes)`
    )
  }

  console.log('')
  console.log(
    `Summary: ${recipesChanged}/${files.length} recipes changed, ` +
      `+${totalVersionsAdded} version snapshots, +${totalBakesAdded} bake snapshots`
  )
  if (dryRun) console.log('(dry run — no files written)')
}

// Run main only when invoked as a script, not when imported by tests.
if (import.meta.url.endsWith(process.argv[1] ?? '') || process.argv[1]?.endsWith('sync-ingredient-snapshots.ts')) {
  main()
}
