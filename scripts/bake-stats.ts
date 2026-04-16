/**
 * Generate a snapshot of all bake stats across recipes.
 *
 * Usage:
 *   npx tsx scripts/bake-stats.ts              # clipboard + file
 *   npx tsx scripts/bake-stats.ts --stdout      # JSON to stdout only
 *   npx tsx scripts/bake-stats.ts --no-clipboard # file only, skip clipboard
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

const RECIPES_DIR = join(__dirname, '..', 'public', 'recipes')
const SNAPSHOTS_DIR = join(__dirname, '..', 'data', 'snapshots')

interface IndexEntry {
  id: string
  name: string
  file: string
}

interface CookLogPhoto {
  src: string
  thumb: string
  alt: string
  usage?: string
}

interface CostItem {
  ingredientId: string
  ingredientName: string
  sourceType: string
  sourceName: string
  recipeAmount: number
  recipeUnit: string
  packageSize: string
  packagePrice: number
  cost: number
}

interface CookLogCost {
  costs: CostItem[]
  total: number
  perServing: number
  servings: number
}

interface CookLogEntry {
  date: string
  start_date?: string
  version: string
  summary: string
  notes?: string[]
  key_notes?: { text: string }[]
  step_notes?: Record<string, string>
  bake_stats?: Record<string, unknown>
  photos?: CookLogPhoto[]
  next_time?: { text: string; source?: string }[]
  cost?: CookLogCost
  actual_yield?: { value: number; unit: string }
  aberration?: boolean
  aberration_note?: string
}

interface RecipeConfig {
  early_check_percent?: number
  stats?: {
    group: string
    subgroup?: string
    defaultYield: number
    unit: string
    servingsPerItem: number
    servingUnit: string
  }
}

interface RecipeJSON {
  meta: {
    name: string
    source?: { name: string; url?: string; type?: string }
    yields: string
    total_time?: string
  }
  config?: RecipeConfig
  version: string
  cook_log?: CookLogEntry[]
  [key: string]: unknown
}

interface BakeTimestamps {
  first: string | null
  last: string | null
}

interface BakeEntry {
  date: string
  start_date?: string
  version: string
  yield: { value: number; unit: string }
  cost: number | null
  aberration: boolean
  aberration_note?: string
  timestamps: BakeTimestamps | null
}

interface RecipeStats {
  id: string
  name: string
  group: string
  subgroup: string | null
  current_version: string
  bake_count: number
  first_bake: string | null
  last_bake: string | null
  total_photos: number
  versions_used: string[]
  next_time_count: number
  aberrations: number
  has_bake_stats: boolean
  cost: {
    avg_per_bake: number | null
    avg_per_serving: number | null
    bakes_with_cost: number
    total_spent: number
  }
  bakes: BakeEntry[]
}

interface GroupStats {
  recipes: number
  recipes_baked: number
  bakes: number
}

interface Snapshot {
  snapshot_date: string
  totals: {
    recipes_in_index: number
    recipes_baked: number
    total_bakes: number
    total_photos: number
    date_range: { first: string | null; last: string | null }
    cost: {
      total_spent: number
      bakes_with_cost: number
      avg_per_bake: number | null
    }
  }
  by_group: Record<string, GroupStats>
  recipes: RecipeStats[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function extractTimestamps(
  bakeStats: Record<string, unknown> | undefined
): BakeTimestamps | null {
  if (!bakeStats) return null

  const times: string[] = []

  // Collect all time strings from bake_stats arrays
  for (const value of Object.values(bakeStats)) {
    if (!Array.isArray(value)) continue
    for (const item of value) {
      if (item && typeof item === 'object') {
        if ('time' in item && typeof item.time === 'string') times.push(item.time)
        if ('start_time' in item && typeof item.start_time === 'string')
          times.push(item.start_time)
      }
    }
  }

  if (times.length === 0) return null

  times.sort()
  return { first: times[0], last: times[times.length - 1] }
}

function buildSnapshot(): Snapshot {
  const indexRaw = readFileSync(join(RECIPES_DIR, 'index.json'), 'utf-8')
  const index: { recipes: IndexEntry[] } = JSON.parse(indexRaw)

  const allDates: string[] = []
  let totalBakes = 0
  let totalPhotos = 0
  let totalCostSpent = 0
  let bakesWithCost = 0
  let recipesBaked = 0
  const byGroup: Record<string, GroupStats> = {}

  const recipes: RecipeStats[] = index.recipes.map((entry) => {
    const raw = readFileSync(join(RECIPES_DIR, entry.file), 'utf-8')
    const recipe: RecipeJSON = JSON.parse(raw)
    const log = recipe.cook_log ?? []
    const stats = recipe.config?.stats
    const group = stats?.group ?? 'Ungrouped'
    const subgroup = stats?.subgroup ?? null

    // Init group
    if (!byGroup[group]) {
      byGroup[group] = { recipes: 0, recipes_baked: 0, bakes: 0 }
    }
    byGroup[group].recipes++

    if (log.length > 0) {
      recipesBaked++
      byGroup[group].recipes_baked++
    }

    totalBakes += log.length
    byGroup[group].bakes += log.length

    // Per-bake aggregation
    const dates = log.map((e) => e.date).sort()
    allDates.push(...dates)

    const photos = log.reduce((sum, e) => sum + (e.photos?.length ?? 0), 0)
    totalPhotos += photos

    const versionsUsed = [...new Set(log.map((e) => e.version))].sort()

    const nextTimeCount = log.reduce(
      (sum, e) => sum + (e.next_time?.length ?? 0),
      0
    )

    const aberrations = log.filter((e) => e.aberration).length

    const hasBakeStats = log.some((e) => e.bake_stats != null)

    // Build per-bake entries
    const defaultYield = stats?.defaultYield ?? 0
    const defaultUnit = stats?.unit ?? 'items'

    const bakes: BakeEntry[] = log.map((e) => {
      const entry: BakeEntry = {
        date: e.date,
        version: e.version,
        yield: e.actual_yield
          ? { value: e.actual_yield.value, unit: e.actual_yield.unit }
          : { value: defaultYield, unit: defaultUnit },
        cost: e.cost?.total ?? null,
        aberration: e.aberration ?? false,
        timestamps: extractTimestamps(e.bake_stats),
      }
      if (e.start_date) entry.start_date = e.start_date
      if (e.aberration_note) entry.aberration_note = e.aberration_note
      return entry
    })

    // Cost
    const costEntries = log.filter((e) => e.cost != null)
    let avgPerBake: number | null = null
    let avgPerServing: number | null = null
    let recipeTotalSpent = 0

    if (costEntries.length > 0) {
      recipeTotalSpent = costEntries.reduce(
        (sum, e) => sum + (e.cost?.total ?? 0),
        0
      )
      avgPerBake = round2(recipeTotalSpent / costEntries.length)

      const servingCosts = costEntries
        .filter((e) => e.cost?.perServing != null)
        .map((e) => e.cost!.perServing)
      if (servingCosts.length > 0) {
        avgPerServing = round2(
          servingCosts.reduce((a, b) => a + b, 0) / servingCosts.length
        )
      }

      totalCostSpent += recipeTotalSpent
      bakesWithCost += costEntries.length
    }

    return {
      id: entry.id,
      name: recipe.meta.name,
      group,
      subgroup,
      current_version: recipe.version,
      bake_count: log.length,
      first_bake: dates[0] ?? null,
      last_bake: dates[dates.length - 1] ?? null,
      total_photos: photos,
      versions_used: versionsUsed,
      next_time_count: nextTimeCount,
      aberrations,
      has_bake_stats: hasBakeStats,
      cost: {
        avg_per_bake: avgPerBake,
        avg_per_serving: avgPerServing,
        bakes_with_cost: costEntries.length,
        total_spent: round2(recipeTotalSpent),
      },
      bakes,
    }
  })

  // Sort recipes by bake count descending, then name
  recipes.sort((a, b) => b.bake_count - a.bake_count || a.name.localeCompare(b.name))

  const sortedDates = allDates.sort()

  return {
    snapshot_date: new Date().toISOString().split('T')[0],
    totals: {
      recipes_in_index: index.recipes.length,
      recipes_baked: recipesBaked,
      total_bakes: totalBakes,
      total_photos: totalPhotos,
      date_range: {
        first: sortedDates[0] ?? null,
        last: sortedDates[sortedDates.length - 1] ?? null,
      },
      cost: {
        total_spent: round2(totalCostSpent),
        bakes_with_cost: bakesWithCost,
        avg_per_bake:
          bakesWithCost > 0
            ? round2(totalCostSpent / bakesWithCost)
            : null,
      },
    },
    by_group: byGroup,
    recipes,
  }
}

function main(): void {
  const args = process.argv.slice(2)
  const stdoutOnly = args.includes('--stdout')
  const noClipboard = args.includes('--no-clipboard')

  const snapshot = buildSnapshot()
  const json = JSON.stringify(snapshot, null, 2)

  if (stdoutOnly) {
    process.stdout.write(json + '\n')
    return
  }

  // Save to file
  if (!existsSync(SNAPSHOTS_DIR)) {
    mkdirSync(SNAPSHOTS_DIR, { recursive: true })
  }
  const filename = `${snapshot.snapshot_date}.json`
  const filepath = join(SNAPSHOTS_DIR, filename)
  writeFileSync(filepath, json + '\n')
  process.stderr.write(`Saved: data/snapshots/${filename}\n`)

  // Clipboard
  if (!noClipboard) {
    try {
      execSync('pbcopy', { input: json })
      process.stderr.write('Copied to clipboard.\n')
    } catch {
      process.stderr.write('Warning: pbcopy failed, clipboard not updated.\n')
    }
  }

  // Summary to stderr
  const s = snapshot.totals
  process.stderr.write(
    `\n${s.recipes_baked}/${s.recipes_in_index} recipes baked | ${s.total_bakes} bakes | ${s.total_photos} photos\n`
  )
  if (s.cost.total_spent > 0) {
    process.stderr.write(
      `$${s.cost.total_spent} spent across ${s.cost.bakes_with_cost} costed bakes (avg $${s.cost.avg_per_bake}/bake)\n`
    )
  }
}

main()
