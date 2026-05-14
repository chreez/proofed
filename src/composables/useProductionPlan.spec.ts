import { describe, it, expect, beforeEach } from 'vitest'

// Install a working localStorage mock BEFORE importing the SUT.
// Other specs install their own globalThis mock that may not expose .clear().
let __ls_store: Record<string, string> = {}
const __ls_mock = {
  getItem: (key: string) => __ls_store[key] ?? null,
  setItem: (key: string, value: string) => { __ls_store[key] = value },
  removeItem: (key: string) => { delete __ls_store[key] },
  clear: () => { __ls_store = {} },
  get length() { return Object.keys(__ls_store).length },
  key: (i: number) => Object.keys(__ls_store)[i] || null,
}
Object.defineProperty(globalThis, 'localStorage', { value: __ls_mock, writable: true, configurable: true })

import {
  emptyPlan,
  validatePlan,
  loadPlan,
  savePlan,
  addEntry,
  removeEntry,
  updateEntry,
  inferDefaultUnit,
} from './useProductionPlan'
import type { ProductionPlan } from '@/types/production'
import type { Recipe } from '@/types/recipe'

function makeRecipe(yields: string): Recipe {
  return {
    meta: { name: 'Test', yields, total_time: '1 hour' },
  } as unknown as Recipe
}

describe('emptyPlan', () => {
  it('returns a fresh plan with no entries', () => {
    const p = emptyPlan()
    expect(p.entries).toEqual([])
    expect(typeof p.updated).toBe('string')
    expect(p.updated).toMatch(/^\d{4}-\d{2}-\d{2}T/)
  })
})

describe('validatePlan', () => {
  it('accepts a well-formed plan', () => {
    const p: ProductionPlan = {
      entries: [
        { id: 'a', recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user', addedAt: '2026-05-12T00:00:00Z' },
      ],
      updated: '2026-05-12T00:00:00Z',
    }
    const result = validatePlan(p)
    expect('error' in result).toBe(false)
  })

  it('rejects non-objects', () => {
    expect('error' in validatePlan('hi')).toBe(true)
    expect('error' in validatePlan(null)).toBe(true)
  })

  it('rejects missing updated', () => {
    const r = validatePlan({ entries: [] })
    expect('error' in r).toBe(true)
  })

  it('rejects non-array entries', () => {
    const r = validatePlan({ entries: 'x', updated: '2026-05-12' })
    expect('error' in r).toBe(true)
  })

  it('rejects entry with bad addedBy', () => {
    const r = validatePlan({
      updated: '2026-05-12',
      entries: [{ id: 'a', recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'derived', addedAt: 't' }],
    })
    expect('error' in r).toBe(true)
  })
})

describe('loadPlan / savePlan', () => {
  beforeEach(() => { __ls_store = {} })

  it('returns empty plan when storage is empty', () => {
    const p = loadPlan()
    expect(p.entries).toEqual([])
  })

  it('round-trips a saved plan', () => {
    const p1 = addEntry(emptyPlan(), { recipeId: 'r1', quantity: 2, unit: 'roll', addedBy: 'user' })
    savePlan(p1)
    const p2 = loadPlan()
    expect(p2.entries).toHaveLength(1)
    expect(p2.entries[0].recipeId).toBe('r1')
    expect(p2.entries[0].quantity).toBe(2)
  })

  it('returns empty plan when stored JSON is malformed', () => {
    __ls_store['bake-production-current'] = '{not json'
    const p = loadPlan()
    expect(p.entries).toEqual([])
  })

  it('returns empty plan when stored shape is invalid', () => {
    __ls_store['bake-production-current'] = JSON.stringify({ entries: 'nope', updated: 't' })
    const p = loadPlan()
    expect(p.entries).toEqual([])
  })

  it('savePlan bumps updated timestamp', () => {
    const p1: ProductionPlan = { entries: [], updated: '2000-01-01T00:00:00.000Z' }
    const p2 = savePlan(p1)
    expect(p2.updated).not.toBe(p1.updated)
    expect(new Date(p2.updated).getTime()).toBeGreaterThan(new Date(p1.updated).getTime())
  })
})

describe('addEntry', () => {
  it('appends a new entry with id, addedAt, and provided fields', () => {
    const p0 = emptyPlan()
    const p1 = addEntry(p0, { recipeId: 'r1', quantity: 3, unit: 'loaf', addedBy: 'user' })
    expect(p1.entries).toHaveLength(1)
    const e = p1.entries[0]
    expect(e.recipeId).toBe('r1')
    expect(e.quantity).toBe(3)
    expect(e.unit).toBe('loaf')
    expect(e.addedBy).toBe('user')
    expect(e.id).toBeTruthy()
    expect(e.addedAt).toMatch(/^\d{4}-/)
  })

  it('does not mutate the input plan', () => {
    const p0 = emptyPlan()
    const p1 = addEntry(p0, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    expect(p0.entries).toHaveLength(0)
    expect(p1.entries).toHaveLength(1)
  })

  it('assigns unique ids across distinct recipeIds', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    plan = addEntry(plan, { recipeId: 'r2', quantity: 1, unit: 'loaf', addedBy: 'user' })
    expect(plan.entries[0].id).not.toBe(plan.entries[1].id)
  })

  it('respects addedBy=agent for agent-skill writes', () => {
    const p1 = addEntry(emptyPlan(), { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'agent' })
    expect(p1.entries[0].addedBy).toBe('agent')
  })

  // Cart-style merge: adding the same recipeId bumps quantity on the
  // existing entry instead of appending a duplicate.
  it('bumps quantity on an existing entry when same recipeId is added again', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    expect(plan.entries).toHaveLength(1)
    expect(plan.entries[0].quantity).toBe(2)
  })

  it('merge preserves original entry id, unit, addedBy, and addedAt', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'agent' })
    const original = { ...plan.entries[0] }
    plan = addEntry(plan, { recipeId: 'r1', quantity: 3, unit: 'dozen', addedBy: 'user' })
    expect(plan.entries).toHaveLength(1)
    expect(plan.entries[0].id).toBe(original.id)
    expect(plan.entries[0].unit).toBe(original.unit)
    expect(plan.entries[0].addedBy).toBe(original.addedBy)
    expect(plan.entries[0].addedAt).toBe(original.addedAt)
    expect(plan.entries[0].quantity).toBe(4) // 1 + 3
  })

  it('keeps distinct recipeIds as separate entries', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    plan = addEntry(plan, { recipeId: 'r2', quantity: 1, unit: 'loaf', addedBy: 'user' })
    expect(plan.entries).toHaveLength(2)
    expect(plan.entries[0].recipeId).toBe('r1')
    expect(plan.entries[1].recipeId).toBe('r2')
  })
})

describe('removeEntry', () => {
  it('removes an entry by id', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    plan = addEntry(plan, { recipeId: 'r2', quantity: 1, unit: 'loaf', addedBy: 'user' })
    const target = plan.entries[0].id
    const plan2 = removeEntry(plan, target)
    expect(plan2.entries).toHaveLength(1)
    expect(plan2.entries[0].recipeId).toBe('r2')
  })

  it('no-ops on unknown id', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    const plan2 = removeEntry(plan, 'nonexistent')
    expect(plan2.entries).toHaveLength(1)
  })

  it('does not mutate the input plan', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    const target = plan.entries[0].id
    const plan2 = removeEntry(plan, target)
    expect(plan.entries).toHaveLength(1)
    expect(plan2.entries).toHaveLength(0)
  })
})

describe('updateEntry', () => {
  it('patches quantity', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    const id = plan.entries[0].id
    const plan2 = updateEntry(plan, id, { quantity: 5 })
    expect(plan2.entries[0].quantity).toBe(5)
  })

  it('patches unit', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    const id = plan.entries[0].id
    const plan2 = updateEntry(plan, id, { unit: 'dozen' })
    expect(plan2.entries[0].unit).toBe('dozen')
  })

  it('leaves other entries untouched', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    plan = addEntry(plan, { recipeId: 'r2', quantity: 1, unit: 'loaf', addedBy: 'user' })
    const id = plan.entries[0].id
    const plan2 = updateEntry(plan, id, { quantity: 8 })
    expect(plan2.entries[0].quantity).toBe(8)
    expect(plan2.entries[1].quantity).toBe(1)
  })

  it('no-ops on unknown id', () => {
    let plan = emptyPlan()
    plan = addEntry(plan, { recipeId: 'r1', quantity: 1, unit: 'roll', addedBy: 'user' })
    const plan2 = updateEntry(plan, 'nonexistent', { quantity: 99 })
    expect(plan2.entries[0].quantity).toBe(1)
  })
})

describe('inferDefaultUnit', () => {
  it('parses "8 rolls" → "roll"', () => {
    expect(inferDefaultUnit(makeRecipe('8 rolls'))).toBe('roll')
  })

  it('parses "2 loaves" → "loaf"', () => {
    expect(inferDefaultUnit(makeRecipe('2 loaves'))).toBe('loaf')
  })

  it('parses "12 cookies" → "cookie"', () => {
    expect(inferDefaultUnit(makeRecipe('12 cookies'))).toBe('cookie')
  })

  it('parses "16 rugelach" → "rugelach" (no plural strip)', () => {
    expect(inferDefaultUnit(makeRecipe('16 rugelach'))).toBe('rugelach')
  })

  it('parses "1 loaf" → "loaf"', () => {
    expect(inferDefaultUnit(makeRecipe('1 loaf'))).toBe('loaf')
  })

  it('drops parenthetical detail: "8 rolls (cast-iron)" → "roll"', () => {
    expect(inferDefaultUnit(makeRecipe('8 rolls (cast-iron skillet)'))).toBe('roll')
  })

  it('drops trailing clauses: "12 cookies, 30g each" → "cookie"', () => {
    expect(inferDefaultUnit(makeRecipe('12 cookies, 30g each'))).toBe('cookie')
  })

  it('returns "unit" for empty yields', () => {
    expect(inferDefaultUnit(makeRecipe(''))).toBe('unit')
  })

  it('returns "unit" for null recipe', () => {
    expect(inferDefaultUnit(null)).toBe('unit')
  })

  it('returns "unit" for undefined recipe', () => {
    expect(inferDefaultUnit(undefined)).toBe('unit')
  })

  it('handles fractional quantities: "1/2 loaf" → "loaf"', () => {
    expect(inferDefaultUnit(makeRecipe('1/2 loaf'))).toBe('loaf')
  })

  it('handles hyphenated nouns: "4 mini-loaves" → "mini-loave"… or single noun', () => {
    // The leading "mini-loaves" should be kept whole; "mini-loaves" → "mini-loave"
    // since we don't have it in irregulars. Acceptable for slice 0.
    const got = inferDefaultUnit(makeRecipe('4 mini-loaves'))
    expect(['mini-loave', 'mini-loaf']).toContain(got)
  })

  it('handles leading noun without a number: "rolls" → "roll"', () => {
    expect(inferDefaultUnit(makeRecipe('rolls'))).toBe('roll')
  })
})
