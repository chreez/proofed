/**
 * PF-283: Technique-glossary matcher audit.
 *
 * Walks every recipe JSON in `public/recipes/*.json`, runs the current
 * substring matcher (mirror of `useTechniques.parseTextWithTechniques`)
 * against every `stages[].gather.ingredients[].name`, `states[].direction`,
 * and `states[].exit_condition`, then classifies each match.
 *
 * Output:
 *   - stdout summary: mismatch counts by category, top offenders
 *   - JSON dump: scratchpad/audit-techniques-{YYYY-MM-DD}.json
 *
 * Usage: `npm run audit:techniques`
 */
import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

interface Technique {
  title: string
  description: string
}
interface TechniquesData {
  techniques: Record<string, Technique>
}
interface RecipeIngredient {
  id?: string
  name?: string
}
interface RecipeGather {
  ingredients?: RecipeIngredient[]
}
interface RecipeStage {
  id?: string
  gather?: RecipeGather | null
}
interface RecipeState {
  id?: string
  direction?: string
  exit_condition?: string
}
interface Recipe {
  version?: string
  meta?: { name?: string }
  stages?: RecipeStage[]
  states?: RecipeState[]
}

type FieldKind = 'ingredient_name' | 'direction' | 'exit_condition'
type MismatchCategory = 'ingredient_context' | 'subset_match' | 'clean'

interface MatchRecord {
  recipe: string
  recipeVersion: string
  field: FieldKind
  fieldOwnerId: string
  fieldValue: string
  matchedKey: string
  tooltipTitle: string
  tooltipDescription: string
  category: MismatchCategory
  notes: string[]
}

// Mirror of matcher logic from src/composables/useTechniques.ts
function findAllMatches(
  text: string,
  keys: string[]
): Array<{ keyword: string; matchIndex: number }> {
  const sorted = [...keys].sort((a, b) => b.length - a.length)
  const lowerText = text.toLowerCase()
  const results: Array<{ keyword: string; matchIndex: number }> = []
  const consumed: boolean[] = new Array(lowerText.length).fill(false)

  for (const kw of sorted) {
    const lowerKw = kw.toLowerCase()
    let idx = 0
    while ((idx = lowerText.indexOf(lowerKw, idx)) !== -1) {
      const anyConsumed = consumed.slice(idx, idx + lowerKw.length).some(Boolean)
      if (!anyConsumed) {
        results.push({ keyword: kw, matchIndex: idx })
        for (let i = idx; i < idx + lowerKw.length; i++) consumed[i] = true
      }
      idx += lowerKw.length
    }
  }
  return results
}

const INGREDIENT_TERMS: Record<string, string[]> = {
  butter: ['butter'],
  eggs: ['egg', 'eggs'],
  flour: ['flour'],
  sugar: ['sugar'],
  cream_cheese: ['cream cheese'],
  yeast: ['yeast'],
  milk: ['milk'],
  water: ['water'],
  starter: ['starter', 'levain'],
  salt: ['salt'],
  cheese: ['cheese'],
  jalapeno: ['jalapeño', 'jalapeno']
}

function detectIngredientContext(name: string): string[] {
  const lower = name.toLowerCase()
  const found: string[] = []
  for (const [tag, terms] of Object.entries(INGREDIENT_TERMS)) {
    if (terms.some(t => lower.includes(t))) found.push(tag)
  }
  return found
}

function detectTooltipContext(tooltipTitle: string, tooltipDesc: string): string[] {
  const combined = (tooltipTitle + ' ' + tooltipDesc).toLowerCase()
  const found: string[] = []
  for (const [tag, terms] of Object.entries(INGREDIENT_TERMS)) {
    if (terms.some(t => combined.includes(t))) found.push(tag)
  }
  return found
}

function classify(
  fieldKind: FieldKind,
  fieldValue: string,
  keyword: string,
  tooltip: Technique
): { category: MismatchCategory; notes: string[] } {
  const notes: string[] = []
  const lowerField = fieldValue.toLowerCase()
  const lowerKw = keyword.toLowerCase()

  // Subset match: matched keyword is a proper substring inside a longer word/phrase
  // (e.g. "room temp" inside "room temperature")
  const idx = lowerField.indexOf(lowerKw)
  const charAfter = lowerField[idx + lowerKw.length] ?? ''
  const charBefore = idx > 0 ? lowerField[idx - 1] : ''
  const isWordCharBefore = /[a-z0-9]/.test(charBefore)
  const isWordCharAfter = /[a-z0-9]/.test(charAfter)
  if (isWordCharBefore || isWordCharAfter) {
    notes.push(`keyword "${keyword}" is a subset of surrounding word in field text`)
    return { category: 'subset_match', notes }
  }

  // Ingredient-context mismatch: only meaningful on ingredient name fields
  if (fieldKind === 'ingredient_name') {
    const fieldContext = detectIngredientContext(fieldValue)
    const tooltipContext = detectTooltipContext(tooltip.title, tooltip.description)
    if (fieldContext.length && tooltipContext.length) {
      const overlap = fieldContext.some(c => tooltipContext.includes(c))
      if (!overlap) {
        notes.push(
          `ingredient looks like [${fieldContext.join(',')}] but tooltip mentions [${tooltipContext.join(',')}]`
        )
        return { category: 'ingredient_context', notes }
      }
    }
  }

  return { category: 'clean', notes }
}

function main(): void {
  const root = process.cwd()
  const recipesDir = join(root, 'public', 'recipes')
  const techPath = join(root, 'public', 'techniques.json')

  const techData: TechniquesData = JSON.parse(readFileSync(techPath, 'utf-8'))
  const keys = Object.keys(techData.techniques)

  const files = readdirSync(recipesDir).filter(f => f.endsWith('.json') && f !== 'index.json')

  const records: MatchRecord[] = []

  for (const filename of files) {
    const path = join(recipesDir, filename)
    const r: Recipe = JSON.parse(readFileSync(path, 'utf-8'))
    const recipe = filename.replace('.json', '')
    const recipeVersion = r.version ?? '?'

    for (const stage of r.stages ?? []) {
      for (const ing of stage.gather?.ingredients ?? []) {
        const name = ing.name ?? ''
        if (!name) continue
        const matches = findAllMatches(name, keys)
        for (const m of matches) {
          const tooltip = techData.techniques[m.keyword]
          const { category, notes } = classify('ingredient_name', name, m.keyword, tooltip)
          records.push({
            recipe,
            recipeVersion,
            field: 'ingredient_name',
            fieldOwnerId: ing.id ?? '?',
            fieldValue: name,
            matchedKey: m.keyword,
            tooltipTitle: tooltip.title,
            tooltipDescription: tooltip.description,
            category,
            notes
          })
        }
      }
    }

    for (const s of r.states ?? []) {
      for (const kind of ['direction', 'exit_condition'] as const) {
        const value = s[kind] ?? ''
        if (!value) continue
        const matches = findAllMatches(value, keys)
        for (const m of matches) {
          const tooltip = techData.techniques[m.keyword]
          const { category, notes } = classify(kind, value, m.keyword, tooltip)
          records.push({
            recipe,
            recipeVersion,
            field: kind,
            fieldOwnerId: s.id ?? '?',
            fieldValue: value,
            matchedKey: m.keyword,
            tooltipTitle: tooltip.title,
            tooltipDescription: tooltip.description,
            category,
            notes
          })
        }
      }
    }
  }

  const byCat = {
    clean: records.filter(r => r.category === 'clean').length,
    subset_match: records.filter(r => r.category === 'subset_match').length,
    ingredient_context: records.filter(r => r.category === 'ingredient_context').length
  }

  console.log('\n=== technique-glossary audit ===')
  console.log(`recipes scanned: ${files.length}`)
  console.log(`total matches:   ${records.length}`)
  console.log(`  clean:                ${byCat.clean}`)
  console.log(`  subset_match:         ${byCat.subset_match}   (keyword inside larger word)`)
  console.log(`  ingredient_context:   ${byCat.ingredient_context}   (tooltip mentions different ingredient than field)`)
  console.log('')

  // Top offending keys
  const byKey = new Map<string, { total: number; mismatches: number }>()
  for (const r of records) {
    const cur = byKey.get(r.matchedKey) ?? { total: 0, mismatches: 0 }
    cur.total++
    if (r.category !== 'clean') cur.mismatches++
    byKey.set(r.matchedKey, cur)
  }
  console.log('=== keys by mismatch rate ===')
  const sortedKeys = [...byKey.entries()].sort(
    (a, b) => b[1].mismatches - a[1].mismatches || b[1].total - a[1].total
  )
  for (const [key, stats] of sortedKeys) {
    const rate = stats.total ? Math.round((stats.mismatches / stats.total) * 100) : 0
    console.log(`  ${key.padEnd(20)} mismatches=${stats.mismatches}/${stats.total}  (${rate}%)`)
  }
  console.log('')

  // Ingredient-context mismatches (the most critical class)
  const critical = records.filter(r => r.category === 'ingredient_context')
  if (critical.length) {
    console.log('=== ingredient-context mismatches (critical) ===')
    for (const r of critical) {
      console.log(
        `  [${r.recipe}] ${r.fieldOwnerId} "${r.fieldValue}"` +
          `\n    → matched "${r.matchedKey}" → tooltip "${r.tooltipTitle}"` +
          `\n    ${r.notes.join('; ')}`
      )
    }
    console.log('')
  }

  // JSON dump
  const outDir = join(root, 'scratchpad')
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const outPath = join(outDir, `audit-techniques-${new Date().toISOString().slice(0, 10)}.json`)
  writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: { recipesScanned: files.length, totalMatches: records.length, byCategory: byCat },
        keyStats: Object.fromEntries(byKey),
        records
      },
      null,
      2
    )
  )
  console.log(`JSON dump: ${outPath}`)
}

main()
