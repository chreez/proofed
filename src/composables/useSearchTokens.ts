export const MONTH_LABELS = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'] as const

export interface BakeSearchItem {
  recipeName: string
  date: string
  version: string
  status?: 'in_progress' | 'complete'
  summary: string | null
  weather: { condition: string } | null
}

export interface RecipeSearchItem {
  name: string
  category: string
  sourceAuthor: string | null
  sourceType: 'original' | 'adapted' | null
  baked: boolean
  outdated: boolean
  inProgress: boolean
  description: string | null
}

function nameTokens(name: string): string[] {
  return name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(w => w.length >= 3).map(w => `name:${w}`)
}

function monthFromDate(date: string): string | null {
  const idx = parseInt(date.split('-')[1] ?? '0', 10) - 1
  return idx >= 0 && idx < 12 ? MONTH_LABELS[idx] : null
}

export function bakeTokens(entry: BakeSearchItem): string[] {
  const tokens = new Set<string>(nameTokens(entry.recipeName))
  if (entry.weather?.condition) tokens.add(`weather:${entry.weather.condition.toLowerCase()}`)
  tokens.add(`status:${entry.status === 'in_progress' ? 'in progress' : 'complete'}`)
  const month = monthFromDate(entry.date)
  if (month) tokens.add(`month:${month}`)
  tokens.add(`version:${entry.version}`)
  return [...tokens]
}

export function bakeMatchesText(entry: BakeSearchItem, q: string): boolean {
  const ql = q.toLowerCase()
  const month = monthFromDate(entry.date) ?? ''
  return [
    entry.recipeName,
    entry.version,
    entry.summary ?? '',
    entry.weather?.condition ?? '',
    entry.status === 'in_progress' ? 'in progress' : 'complete',
    month,
  ].join(' ').toLowerCase().includes(ql)
}

export function recipeStatus(item: RecipeSearchItem): 'in-progress' | 'outdated' | 'baked' | 'unbaked' {
  if (item.inProgress) return 'in-progress'
  if (item.outdated) return 'outdated'
  if (item.baked) return 'baked'
  return 'unbaked'
}

export function recipeTokens(item: RecipeSearchItem): string[] {
  const tokens = new Set<string>(nameTokens(item.name))
  tokens.add(`category:${item.category}`)
  if (item.sourceAuthor) tokens.add(`source:${item.sourceAuthor.toLowerCase()}`)
  if (item.sourceType) tokens.add(`type:${item.sourceType}`)
  tokens.add(`status:${recipeStatus(item)}`)
  return [...tokens]
}

export function recipeMatchesText(item: RecipeSearchItem, q: string): boolean {
  const ql = q.toLowerCase()
  return [
    item.name,
    item.description ?? '',
    item.category,
    item.sourceAuthor ?? '',
    item.sourceType ?? '',
    recipeStatus(item),
  ].join(' ').toLowerCase().includes(ql)
}

export function filterByTags<T>(items: readonly T[], tokensFn: (item: T) => string[], filterTags: readonly string[]): T[] {
  if (!filterTags.length) return [...items]
  return items.filter((item) => {
    const tokens = new Set(tokensFn(item))
    return filterTags.every((t) => tokens.has(t))
  })
}
