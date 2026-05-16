import { describe, it, expect, beforeEach, vi } from 'vitest'

// Install a working localStorage mock BEFORE importing the SUT.
let __ls_store: Record<string, string> = {}
const __ls_mock = {
  getItem: (key: string) => __ls_store[key] ?? null,
  setItem: (key: string, value: string) => {
    __ls_store[key] = value
  },
  removeItem: (key: string) => {
    delete __ls_store[key]
  },
  clear: () => {
    __ls_store = {}
  },
  get length() {
    return Object.keys(__ls_store).length
  },
  key: (i: number) => Object.keys(__ls_store)[i] || null,
}
Object.defineProperty(globalThis, 'localStorage', {
  value: __ls_mock,
  writable: true,
  configurable: true,
})

import {
  exportBakeryOpsSnapshot,
  downloadSnapshot,
  importBakeryOpsSnapshot,
  applyBakeryOpsSnapshot,
  snapshotDateSlug,
} from './useBakeryOpsSnapshot'
import { SNAPSHOT_VERSION, SCHEMA_VERSION } from '@/types/bakery-ops-snapshot'
import { loadPlan, savePlan } from './useProductionPlan'
import { loadPricing, savePricing } from './usePricing'
import {
  loadActiveSession,
  saveActiveSession,
  loadHistory,
  saveHistory,
} from './useSales'
import type { ProductionPlan } from '@/types/production'
import type { PricingState } from '@/types/pricing'
import type { MarketSession } from '@/types/sales'

function seedPlan(): ProductionPlan {
  const plan: ProductionPlan = {
    entries: [
      {
        id: 'p-1',
        recipeId: 'atk-cinnamon-buns',
        batches: 2,
        yieldOverride: null,
        unit: 'bun',
        addedBy: 'user',
        addedAt: '2026-05-12T10:00:00.000Z',
      },
    ],
    updated: '2026-05-12T10:00:00.000Z',
  }
  savePlan(plan)
  return plan
}

function seedPricing(): PricingState {
  const state: PricingState = {
    perRecipe: {
      'atk-cinnamon-buns': { markupPct: 200 },
    },
    updated: '2026-05-12T10:00:00.000Z',
  }
  savePricing(state)
  return state
}

function seedActive(): MarketSession {
  const session: MarketSession = {
    id: 's-active',
    openedAt: '2026-05-12T11:00:00.000Z',
    initialPlan: [{ recipeId: 'atk-cinnamon-buns', plannedUnits: 16, unitPrice: 5 }],
    transactions: [],
    label: 'Saturday Market',
  }
  saveActiveSession(session)
  return session
}

function seedHistory(): MarketSession[] {
  const history: MarketSession[] = [
    {
      id: 's-closed-1',
      openedAt: '2026-05-05T10:00:00.000Z',
      closedAt: '2026-05-05T14:00:00.000Z',
      initialPlan: [{ recipeId: 'atk-cinnamon-buns', plannedUnits: 16, unitPrice: 5 }],
      transactions: [
        {
          id: 'tx-1',
          occurredAt: '2026-05-05T11:30:00.000Z',
          items: [
            { recipeId: 'atk-cinnamon-buns', units: 2, unitPrice: 5, lineTotal: 10 },
          ],
          totalAsk: 10,
        },
      ],
    },
  ]
  saveHistory(history)
  return history
}

describe('useBakeryOpsSnapshot', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.restoreAllMocks()
  })

  describe('exportBakeryOpsSnapshot', () => {
    it('returns an envelope with the four cross-lens sections', () => {
      seedPlan()
      seedPricing()
      seedActive()
      seedHistory()
      const snap = exportBakeryOpsSnapshot()
      expect(snap.version).toBe(SNAPSHOT_VERSION)
      expect(snap.schema_version).toBe(SCHEMA_VERSION)
      expect(snap.productionPlan.entries).toHaveLength(1)
      expect(snap.pricing.perRecipe['atk-cinnamon-buns'].markupPct).toBe(200)
      expect(snap.activeSession?.id).toBe('s-active')
      expect(snap.history).toHaveLength(1)
      expect(snap.history[0].id).toBe('s-closed-1')
    })

    it('emits an ISO 8601 generated_at timestamp', () => {
      const snap = exportBakeryOpsSnapshot()
      // ISO 8601 with milliseconds + Z suffix.
      expect(snap.generated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/)
      // Round-trip through Date — should be a finite time value.
      expect(Number.isFinite(new Date(snap.generated_at).getTime())).toBe(true)
    })

    it('handles empty state gracefully (no plan, no pricing, no sessions)', () => {
      const snap = exportBakeryOpsSnapshot()
      expect(snap.productionPlan.entries).toHaveLength(0)
      expect(snap.pricing.perRecipe).toEqual({})
      expect(snap.activeSession).toBeNull()
      expect(snap.history).toEqual([])
    })
  })

  describe('downloadSnapshot', () => {
    it('creates an application/json Blob and triggers a download', () => {
      const createSpy = vi.fn(() => 'blob:mock-url')
      const revokeSpy = vi.fn()
      ;(globalThis as unknown as { URL: typeof URL }).URL = {
        ...URL,
        createObjectURL: createSpy as unknown as typeof URL.createObjectURL,
        revokeObjectURL: revokeSpy as unknown as typeof URL.revokeObjectURL,
      } as unknown as typeof URL

      const clickSpy = vi.fn()
      const origCreate = document.createElement.bind(document)
      const createElSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag) as HTMLAnchorElement
        if (tag === 'a') {
          el.click = clickSpy
        }
        return el
      })

      const snap = exportBakeryOpsSnapshot()
      downloadSnapshot(snap)

      expect(createSpy).toHaveBeenCalledTimes(1)
      const blob = createSpy.mock.calls[0][0] as Blob
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/json')
      expect(clickSpy).toHaveBeenCalledTimes(1)
      expect(revokeSpy).toHaveBeenCalledWith('blob:mock-url')

      createElSpy.mockRestore()
    })

    it('names the file bakery-ops-{YYYY-MM-DD}.json from generated_at', () => {
      ;(globalThis as unknown as { URL: typeof URL }).URL = {
        ...URL,
        createObjectURL: (() => 'blob:mock-url') as unknown as typeof URL.createObjectURL,
        revokeObjectURL: (() => {}) as unknown as typeof URL.revokeObjectURL,
      } as unknown as typeof URL

      let capturedDownload = ''
      const origCreate = document.createElement.bind(document)
      const createElSpy = vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
        const el = origCreate(tag) as HTMLAnchorElement
        if (tag === 'a') {
          el.click = () => {
            capturedDownload = el.download
          }
        }
        return el
      })

      const snap = exportBakeryOpsSnapshot()
      // Force a known date for deterministic assertion.
      snap.generated_at = '2026-05-12T15:30:00.000Z'
      downloadSnapshot(snap)

      // Local-timezone date can vary by runner — assert shape, not specific day.
      expect(capturedDownload).toMatch(/^bakery-ops-\d{4}-\d{2}-\d{2}\.json$/)

      createElSpy.mockRestore()
    })

    it('snapshotDateSlug falls back to today on unparseable input', () => {
      const slug = snapshotDateSlug('not-a-date')
      expect(slug).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    })
  })

  describe('importBakeryOpsSnapshot', () => {
    it('accepts a valid round-tripped JSON envelope', () => {
      seedPlan()
      seedPricing()
      const exported = exportBakeryOpsSnapshot()
      const json = JSON.parse(JSON.stringify(exported))
      const imported = importBakeryOpsSnapshot(json)
      expect(imported.version).toBe(SNAPSHOT_VERSION)
      expect(imported.schema_version).toBe(SCHEMA_VERSION)
      expect(imported.productionPlan.entries).toHaveLength(1)
    })

    it('throws on non-object input', () => {
      expect(() => importBakeryOpsSnapshot(null)).toThrow(/must be an object/)
      expect(() => importBakeryOpsSnapshot('a string')).toThrow(/must be an object/)
    })

    it('throws when required top-level fields are missing', () => {
      expect(() =>
        importBakeryOpsSnapshot({ schema_version: SCHEMA_VERSION, generated_at: 'x', productionPlan: {}, pricing: {}, history: [] }),
      ).toThrow(/version missing/)
      expect(() =>
        importBakeryOpsSnapshot({ version: '1.0.0', generated_at: 'x', productionPlan: {}, pricing: {}, history: [] }),
      ).toThrow(/schema_version missing/)
      expect(() =>
        importBakeryOpsSnapshot({ version: '1.0.0', schema_version: SCHEMA_VERSION, productionPlan: {}, pricing: {}, history: [] }),
      ).toThrow(/generated_at missing/)
      expect(() =>
        importBakeryOpsSnapshot({ version: '1.0.0', schema_version: SCHEMA_VERSION, generated_at: 'x', pricing: {}, history: [] }),
      ).toThrow(/productionPlan missing/)
      expect(() =>
        importBakeryOpsSnapshot({ version: '1.0.0', schema_version: SCHEMA_VERSION, generated_at: 'x', productionPlan: {}, history: [] }),
      ).toThrow(/pricing missing/)
      expect(() =>
        importBakeryOpsSnapshot({ version: '1.0.0', schema_version: SCHEMA_VERSION, generated_at: 'x', productionPlan: {}, pricing: {}, activeSession: null }),
      ).toThrow(/history must be an array/)
    })

    it('throws on wrong schema_version', () => {
      const bad = {
        version: '99.0.0',
        schema_version: 999,
        generated_at: '2026-05-12T00:00:00.000Z',
        productionPlan: { entries: [], updated: 'x' },
        pricing: { perRecipe: {}, updated: 'x' },
        activeSession: null,
        history: [],
      }
      expect(() => importBakeryOpsSnapshot(bad)).toThrow(/schema_version 999 not supported/)
    })

    it('rejects activeSession when it is neither null nor an object', () => {
      const bad = {
        version: '1.0.0',
        schema_version: SCHEMA_VERSION,
        generated_at: '2026-05-12T00:00:00.000Z',
        productionPlan: { entries: [], updated: 'x' },
        pricing: { perRecipe: {}, updated: 'x' },
        activeSession: 'should not be a string',
        history: [],
      }
      expect(() => importBakeryOpsSnapshot(bad)).toThrow(/activeSession must be object or null/)
    })
  })

  describe('applyBakeryOpsSnapshot', () => {
    it('writes each section to its localStorage key', () => {
      const snap = {
        version: '1.0.0',
        schema_version: SCHEMA_VERSION,
        generated_at: '2026-05-12T00:00:00.000Z',
        productionPlan: {
          entries: [
            {
              id: 'p-1',
              recipeId: 'atk-cinnamon-buns',
              batches: 3,
              yieldOverride: null,
              unit: 'bun',
              addedBy: 'user' as const,
              addedAt: '2026-05-12T00:00:00.000Z',
            },
          ],
          updated: '2026-05-12T00:00:00.000Z',
        },
        pricing: {
          perRecipe: { 'atk-cinnamon-buns': { markupPct: 175 } },
          updated: '2026-05-12T00:00:00.000Z',
        },
        activeSession: {
          id: 's-applied',
          openedAt: '2026-05-12T00:00:00.000Z',
          initialPlan: [{ recipeId: 'atk-cinnamon-buns', plannedUnits: 24, unitPrice: 5 }],
          transactions: [],
        },
        history: [],
      }
      applyBakeryOpsSnapshot(snap)
      expect(__ls_store['bake-production-current']).toBeTruthy()
      expect(__ls_store['bake-pricing-current']).toBeTruthy()
      expect(__ls_store['bake-sales-active']).toBeTruthy()
      expect(__ls_store['bake-sales-history']).toBe('[]')
    })

    it('removes bake-sales-active when activeSession is null', () => {
      // Pre-seed an active session so we can verify it gets cleared.
      saveActiveSession({
        id: 's-stale',
        openedAt: '2026-05-12T00:00:00.000Z',
        initialPlan: [],
        transactions: [],
      })
      expect(__ls_store['bake-sales-active']).toBeTruthy()
      applyBakeryOpsSnapshot({
        version: '1.0.0',
        schema_version: SCHEMA_VERSION,
        generated_at: '2026-05-12T00:00:00.000Z',
        productionPlan: { entries: [], updated: 'x' },
        pricing: { perRecipe: {}, updated: 'x' },
        activeSession: null,
        history: [],
      })
      expect(__ls_store['bake-sales-active']).toBeUndefined()
    })
  })

  describe('round-trip', () => {
    it('export → JSON → import → apply restores identical loadable state', () => {
      seedPlan()
      seedPricing()
      seedActive()
      seedHistory()
      const exported = exportBakeryOpsSnapshot()
      const serialized = JSON.stringify(exported)

      // Wipe state to simulate a fresh session.
      __ls_store = {}

      const imported = importBakeryOpsSnapshot(JSON.parse(serialized))
      applyBakeryOpsSnapshot(imported)

      const planAfter = loadPlan()
      const pricingAfter = loadPricing()
      const activeAfter = loadActiveSession()
      const historyAfter = loadHistory()

      expect(planAfter.entries).toEqual(exported.productionPlan.entries)
      expect(pricingAfter.perRecipe).toEqual(exported.pricing.perRecipe)
      expect(activeAfter?.id).toBe(exported.activeSession?.id)
      expect(historyAfter).toHaveLength(exported.history.length)
      expect(historyAfter[0].id).toBe(exported.history[0].id)
    })

    it('round-trip is idempotent — applying twice yields the same state', () => {
      seedPlan()
      seedPricing()
      const exported = exportBakeryOpsSnapshot()
      applyBakeryOpsSnapshot(exported)
      const firstPlan = loadPlan()
      applyBakeryOpsSnapshot(exported)
      const secondPlan = loadPlan()
      expect(secondPlan.entries).toEqual(firstPlan.entries)
    })
  })
})
