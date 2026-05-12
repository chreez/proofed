import { describe, it, expect, beforeEach, vi } from 'vitest'

// Install a working localStorage mock BEFORE importing the SUT.
// Other specs (useScratchpad) install their own globalThis mock that may not
// expose .clear() — we shadow it here so this file's tests are deterministic.
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
  emptyProfile,
  slugify,
  validateProfile,
  loadProfile,
  loadCommitted,
  saveProfile,
  saveCommitted,
  resolveMarkupPct,
  resolveSellPrice,
  isRecipeDirty,
  exportProfile,
} from './usePricingProfile'
import type { PricingProfile } from '@/types/pricing'
import { FALLBACK_MARKUP_PCT } from '@/types/pricing'

function makeProfile(overrides: Partial<PricingProfile> = {}): PricingProfile {
  return {
    ...emptyProfile('Test'),
    ...overrides,
  }
}

describe('slugify', () => {
  it('lowercases and hyphenates', () => {
    expect(slugify('Holiday 2026')).toBe('holiday-2026')
  })

  it('strips non-alphanumeric characters', () => {
    expect(slugify("Farmers' Market!!")).toBe('farmers-market')
  })

  it('collapses repeated hyphens and trims edges', () => {
    expect(slugify('  -- Default --  ')).toBe('default')
  })

  it('handles underscores like whitespace', () => {
    expect(slugify('holiday_2026_winter')).toBe('holiday-2026-winter')
  })
})

describe('emptyProfile', () => {
  it('returns a fresh profile with FALLBACK_MARKUP_PCT', () => {
    const p = emptyProfile()
    expect(p.name).toBe('Default')
    expect(p.default.markupPct).toBe(FALLBACK_MARKUP_PCT)
    expect(p.perRecipe).toEqual({})
    expect(p.version).toBe('1.0.0')
    expect(p.created).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(p.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('accepts a custom name', () => {
    expect(emptyProfile('Wholesale').name).toBe('Wholesale')
  })
})

describe('validateProfile', () => {
  it('accepts a well-formed profile', () => {
    const p = makeProfile()
    const result = validateProfile(p)
    expect('error' in result).toBe(false)
  })

  it('rejects non-objects', () => {
    expect(validateProfile(null)).toEqual({ error: 'not an object' })
    expect(validateProfile('string')).toEqual({ error: 'not an object' })
  })

  it('rejects missing required fields', () => {
    expect(validateProfile({})).toMatchObject({ error: expect.stringContaining('name') })
    expect(validateProfile({ name: 'x' })).toMatchObject({ error: expect.stringContaining('version') })
    expect(validateProfile({ name: 'x', version: '1' })).toMatchObject({ error: expect.stringContaining('created') })
    expect(validateProfile({ name: 'x', version: '1', created: 'd' })).toMatchObject({ error: expect.stringContaining('updated') })
    expect(validateProfile({ name: 'x', version: '1', created: 'd', updated: 'd' })).toMatchObject({ error: expect.stringContaining('default') })
  })

  it('rejects malformed default.markupPct', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: {}, perRecipe: {},
    })
    expect(r).toMatchObject({ error: expect.stringContaining('default.markupPct') })
  })

  it('rejects malformed perRecipe entries', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: { markupPct: 65 },
      perRecipe: { foo: null },
    })
    expect(r).toMatchObject({ error: expect.stringContaining('perRecipe[foo]') })
  })

  it('rejects perRecipe with wrong-typed fields', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: { markupPct: 65 },
      perRecipe: { foo: { markupPct: 'not-a-number' } },
    })
    expect(r).toMatchObject({ error: expect.stringContaining('markupPct') })
  })

  it('rejects perRecipe with bad sellPrice type', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: { markupPct: 65 },
      perRecipe: { foo: { sellPrice: 'free' } },
    })
    expect(r).toMatchObject({ error: expect.stringContaining('sellPrice') })
  })

  it('rejects perRecipe with bad notes type', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: { markupPct: 65 },
      perRecipe: { foo: { notes: 123 } },
    })
    expect(r).toMatchObject({ error: expect.stringContaining('notes') })
  })

  it('rejects missing perRecipe', () => {
    const r = validateProfile({
      name: 'x', version: '1', created: 'd', updated: 'd',
      default: { markupPct: 65 },
    })
    expect(r).toMatchObject({ error: expect.stringContaining('perRecipe') })
  })
})

describe('resolveMarkupPct', () => {
  it('returns per-recipe override when set', () => {
    const p = makeProfile({ perRecipe: { foo: { markupPct: 200 } } })
    expect(resolveMarkupPct('foo', p)).toBe(200)
  })

  it('falls back to profile default when no override', () => {
    const p = makeProfile({ default: { markupPct: 80 } })
    expect(resolveMarkupPct('foo', p)).toBe(80)
  })

  it('respects 0 as an intentional override value', () => {
    const p = makeProfile({ perRecipe: { foo: { markupPct: 0 } } })
    expect(resolveMarkupPct('foo', p)).toBe(0)
  })

  it('falls back to FALLBACK_MARKUP_PCT when default is malformed', () => {
    const p = makeProfile()
    ;(p.default as { markupPct: number | unknown }).markupPct = Number.NaN
    expect(resolveMarkupPct('foo', p)).toBe(FALLBACK_MARKUP_PCT)
  })
})

describe('resolveSellPrice', () => {
  it('returns the explicit sellPrice when set', () => {
    const p = makeProfile({ perRecipe: { foo: { sellPrice: 9.5 } } })
    expect(resolveSellPrice('foo', p)).toBe(9.5)
  })

  it('returns null when no manual override', () => {
    const p = makeProfile()
    expect(resolveSellPrice('foo', p)).toBeNull()
  })

  it('returns null for NaN sellPrice', () => {
    const p = makeProfile({ perRecipe: { foo: { sellPrice: Number.NaN } } })
    expect(resolveSellPrice('foo', p)).toBeNull()
  })
})

describe('isRecipeDirty', () => {
  it('returns false when current and committed entries match', () => {
    const current = makeProfile({ perRecipe: { foo: { markupPct: 100 } } })
    const committed = makeProfile({ perRecipe: { foo: { markupPct: 100 } } })
    expect(isRecipeDirty('foo', current, committed)).toBe(false)
  })

  it('returns true when current diverges from committed', () => {
    const current = makeProfile({ perRecipe: { foo: { markupPct: 150 } } })
    const committed = makeProfile({ perRecipe: { foo: { markupPct: 100 } } })
    expect(isRecipeDirty('foo', current, committed)).toBe(true)
  })

  it('treats absent entries as equal to empty entry', () => {
    const current = makeProfile()
    const committed = makeProfile()
    expect(isRecipeDirty('foo', current, committed)).toBe(false)
  })

  it('treats null committed as missing baseline', () => {
    const current = makeProfile({ perRecipe: { foo: { markupPct: 150 } } })
    expect(isRecipeDirty('foo', current, null)).toBe(true)
  })

  it('returns false when current has no entry and committed has no entry (null)', () => {
    const current = makeProfile()
    expect(isRecipeDirty('foo', current, null)).toBe(false)
  })

  it('detects changes in notes field', () => {
    const current = makeProfile({ perRecipe: { foo: { notes: 'updated' } } })
    const committed = makeProfile({ perRecipe: { foo: { notes: 'original' } } })
    expect(isRecipeDirty('foo', current, committed)).toBe(true)
  })

  it('detects changes in sellPrice field', () => {
    const current = makeProfile({ perRecipe: { foo: { sellPrice: 12 } } })
    const committed = makeProfile({ perRecipe: { foo: { sellPrice: 10 } } })
    expect(isRecipeDirty('foo', current, committed)).toBe(true)
  })
})

describe('loadProfile / saveProfile (localStorage)', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('returns empty profile when key missing', () => {
    const p = loadProfile()
    expect(p.name).toBe('Default')
    expect(p.perRecipe).toEqual({})
  })

  it('round-trips a saved profile', () => {
    const p = makeProfile({ perRecipe: { foo: { markupPct: 175 } } })
    saveProfile(p)
    const loaded = loadProfile()
    expect(loaded.perRecipe.foo.markupPct).toBe(175)
    expect(loaded.name).toBe(p.name)
  })

  it('falls back to empty on malformed JSON', () => {
    localStorage.setItem('pricing-profile-current', '{not json')
    const p = loadProfile()
    expect(p.name).toBe('Default')
  })

  it('falls back to empty when stored profile fails validation', () => {
    localStorage.setItem('pricing-profile-current', JSON.stringify({ name: 'bad' }))
    const p = loadProfile()
    expect(p.name).toBe('Default')
  })
})

describe('loadCommitted / saveCommitted (localStorage)', () => {
  beforeEach(() => {
    __ls_store = {}
  })

  it('returns null when key missing', () => {
    expect(loadCommitted()).toBeNull()
  })

  it('round-trips a committed profile', () => {
    const p = makeProfile()
    saveCommitted(p)
    expect(loadCommitted()?.name).toBe(p.name)
  })

  it('returns null on malformed JSON', () => {
    localStorage.setItem('pricing-profile-committed', '{not json')
    expect(loadCommitted()).toBeNull()
  })

  it('returns null when stored fails validation', () => {
    localStorage.setItem('pricing-profile-committed', JSON.stringify({}))
    expect(loadCommitted()).toBeNull()
  })
})

describe('exportProfile', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.restoreAllMocks()
  })

  it('triggers a download with the expected filename pattern', () => {
    const createObjectURL = vi.fn(() => 'blob:fake-url')
    const revokeObjectURL = vi.fn()
    URL.createObjectURL = createObjectURL
    URL.revokeObjectURL = revokeObjectURL

    const clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const p = makeProfile({ name: 'Holiday 2026' })
    exportProfile(p)

    expect(createObjectURL).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(revokeObjectURL).toHaveBeenCalled()
  })

  it('persists the bumped profile back to localStorage on export', () => {
    URL.createObjectURL = vi.fn(() => 'blob:fake')
    URL.revokeObjectURL = vi.fn()
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})

    const p = makeProfile({ name: 'X', perRecipe: { foo: { markupPct: 200 } } })
    exportProfile(p)

    const saved = loadProfile()
    expect(saved.name).toBe('X')
    expect(saved.perRecipe.foo.markupPct).toBe(200)

    const committed = loadCommitted()
    expect(committed?.name).toBe('X')
  })
})
