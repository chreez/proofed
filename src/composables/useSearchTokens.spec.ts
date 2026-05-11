import { describe, it, expect } from 'vitest'
import {
  bakeTokens,
  bakeMatchesText,
  recipeStatus,
  recipeTokens,
  recipeMatchesText,
  filterByTags,
  type BakeSearchItem,
  type RecipeSearchItem,
} from './useSearchTokens'

const bake: BakeSearchItem = {
  recipeName: 'Sourdough Chocolate Chip Cookies',
  date: '2026-04-22',
  version: 'v1.1',
  status: 'complete',
  summary: 'Bumped salt to 7g',
  weather: { condition: 'Clear sky' },
}
const bakeInProgress: BakeSearchItem = {
  recipeName: 'Tartine Rugelach',
  date: '2026-05-11',
  version: 'v1.0',
  status: 'in_progress',
  summary: null,
  weather: null,
}

describe('bakeTokens', () => {
  it('derives name word tokens (>=3 chars)', () => {
    const t = bakeTokens(bake)
    expect(t).toContain('name:sourdough')
    expect(t).toContain('name:chocolate')
    expect(t).toContain('name:chip')
    expect(t).toContain('name:cookies')
  })
  it('derives weather token from condition', () => {
    expect(bakeTokens(bake)).toContain('weather:clear sky')
  })
  it('omits weather token when weather is null', () => {
    expect(bakeTokens(bakeInProgress).find(t => t.startsWith('weather:'))).toBeUndefined()
  })
  it('derives status token (in_progress → "in progress")', () => {
    expect(bakeTokens(bakeInProgress)).toContain('status:in progress')
  })
  it('derives status token (complete)', () => {
    expect(bakeTokens(bake)).toContain('status:complete')
  })
  it('derives month token from date', () => {
    expect(bakeTokens(bake)).toContain('month:apr')
    expect(bakeTokens(bakeInProgress)).toContain('month:may')
  })
  it('omits month token when date is malformed', () => {
    expect(bakeTokens({ ...bake, date: 'not-a-date' }).find(t => t.startsWith('month:'))).toBeUndefined()
  })
  it('derives version token', () => {
    expect(bakeTokens(bake)).toContain('version:v1.1')
  })
})

describe('bakeMatchesText', () => {
  it('matches by recipe name', () => {
    expect(bakeMatchesText(bake, 'sourdough')).toBe(true)
  })
  it('matches by version', () => {
    expect(bakeMatchesText(bake, 'v1.1')).toBe(true)
  })
  it('matches by summary text', () => {
    expect(bakeMatchesText(bake, 'salt')).toBe(true)
  })
  it('matches by weather condition', () => {
    expect(bakeMatchesText(bake, 'clear sky')).toBe(true)
  })
  it('matches by status label', () => {
    expect(bakeMatchesText(bakeInProgress, 'in progress')).toBe(true)
  })
  it('matches by month name', () => {
    expect(bakeMatchesText(bake, 'apr')).toBe(true)
  })
  it('handles null summary + null weather without throwing', () => {
    expect(bakeMatchesText(bakeInProgress, 'tartine')).toBe(true)
    expect(bakeMatchesText(bakeInProgress, 'clear sky')).toBe(false)
  })
  it('returns false for no match', () => {
    expect(bakeMatchesText(bake, 'xyzzz')).toBe(false)
  })
})

const recipe: RecipeSearchItem = {
  name: 'Tartine Baguette',
  category: 'baking',
  sourceAuthor: 'Tartine',
  sourceType: 'adapted',
  baked: true,
  outdated: false,
  inProgress: false,
  description: 'Open crumb sourdough',
}
const recipeUnbaked: RecipeSearchItem = {
  name: 'Thai Tea Boba',
  category: 'drinks',
  sourceAuthor: null,
  sourceType: 'original',
  baked: false,
  outdated: false,
  inProgress: false,
  description: null,
}
const recipeInProgress: RecipeSearchItem = { ...recipe, inProgress: true }
const recipeOutdated: RecipeSearchItem = { ...recipe, outdated: true }

describe('recipeStatus', () => {
  it('returns in-progress when inProgress is true', () => {
    expect(recipeStatus(recipeInProgress)).toBe('in-progress')
  })
  it('returns outdated when outdated but not in-progress', () => {
    expect(recipeStatus(recipeOutdated)).toBe('outdated')
  })
  it('returns baked when baked and not outdated/in-progress', () => {
    expect(recipeStatus(recipe)).toBe('baked')
  })
  it('returns unbaked otherwise', () => {
    expect(recipeStatus(recipeUnbaked)).toBe('unbaked')
  })
})

describe('recipeTokens', () => {
  it('derives name tokens', () => {
    expect(recipeTokens(recipe)).toContain('name:tartine')
    expect(recipeTokens(recipe)).toContain('name:baguette')
  })
  it('derives category token', () => {
    expect(recipeTokens(recipe)).toContain('category:baking')
  })
  it('derives source token lowercased', () => {
    expect(recipeTokens(recipe)).toContain('source:tartine')
  })
  it('omits source token when null', () => {
    expect(recipeTokens(recipeUnbaked).find(t => t.startsWith('source:'))).toBeUndefined()
  })
  it('derives type token', () => {
    expect(recipeTokens(recipe)).toContain('type:adapted')
    expect(recipeTokens(recipeUnbaked)).toContain('type:original')
  })
  it('derives status token from recipeStatus', () => {
    expect(recipeTokens(recipe)).toContain('status:baked')
    expect(recipeTokens(recipeUnbaked)).toContain('status:unbaked')
    expect(recipeTokens(recipeInProgress)).toContain('status:in-progress')
    expect(recipeTokens(recipeOutdated)).toContain('status:outdated')
  })
})

describe('recipeMatchesText', () => {
  it('matches by name', () => {
    expect(recipeMatchesText(recipe, 'tartine')).toBe(true)
  })
  it('matches by description', () => {
    expect(recipeMatchesText(recipe, 'open crumb')).toBe(true)
  })
  it('matches by category', () => {
    expect(recipeMatchesText(recipe, 'baking')).toBe(true)
  })
  it('matches by source', () => {
    expect(recipeMatchesText(recipe, 'Tartine')).toBe(true)
  })
  it('matches by status label', () => {
    expect(recipeMatchesText(recipeUnbaked, 'unbaked')).toBe(true)
  })
  it('handles null fields without throwing', () => {
    expect(recipeMatchesText(recipeUnbaked, 'boba')).toBe(true)
    expect(recipeMatchesText(recipeUnbaked, 'xyzzy')).toBe(false)
  })
})

describe('filterByTags', () => {
  const items = [
    { id: 'a', tokens: ['cat:x', 'cat:y'] },
    { id: 'b', tokens: ['cat:x'] },
    { id: 'c', tokens: ['cat:y'] },
  ]
  const tokensFn = (item: typeof items[number]) => item.tokens

  it('returns all items when filter is empty', () => {
    const out = filterByTags(items, tokensFn, [])
    expect(out).toHaveLength(3)
  })
  it('returns only matching items for single tag', () => {
    const out = filterByTags(items, tokensFn, ['cat:y'])
    expect(out.map(i => i.id)).toEqual(['a', 'c'])
  })
  it('AND-filters with multiple tags', () => {
    const out = filterByTags(items, tokensFn, ['cat:x', 'cat:y'])
    expect(out.map(i => i.id)).toEqual(['a'])
  })
  it('returns empty when no items match', () => {
    const out = filterByTags(items, tokensFn, ['cat:z'])
    expect(out).toEqual([])
  })
})
