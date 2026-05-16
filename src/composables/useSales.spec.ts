import { describe, it, expect, beforeEach } from 'vitest'

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
  loadActiveSession,
  saveActiveSession,
  clearActiveSession,
  loadHistory,
  saveHistory,
  openSession,
  recordTransaction,
  deleteTransaction,
  recordSale,
  closeSession,
  setSessionLabel,
  appendToHistory,
  sessionTotals,
  aggregateSold,
  aggregateRevenue,
  HISTORY_CAP,
} from './useSales'
import type { MarketSession, SalesTransaction, TransactionItem } from '@/types/sales'

/** New-shape (PF-256.6) session helper. */
function makeSession(overrides: Partial<MarketSession> = {}): MarketSession {
  return {
    id: 's-1',
    openedAt: '2026-05-12T10:00:00Z',
    initialPlan: [
      { recipeId: 'r1', plannedUnits: 8, unitPrice: 5 },
      { recipeId: 'r2', plannedUnits: 4, unitPrice: 10 },
    ],
    transactions: [],
    ...overrides,
  }
}

/** Legacy (PF-256.5) session helper. */
function makeLegacySession(overrides: Partial<MarketSession> = {}): MarketSession {
  return {
    id: 's-legacy',
    openedAt: '2026-05-12T10:00:00Z',
    sales: [
      { recipeId: 'r1', plannedUnits: 8, soldUnits: 0, unitPrice: 5 },
      { recipeId: 'r2', plannedUnits: 4, soldUnits: 0, unitPrice: 10 },
    ],
    ...overrides,
  }
}

function makeTx(overrides: Partial<SalesTransaction> = {}): SalesTransaction {
  const items: TransactionItem[] = overrides.items ?? [
    { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
  ]
  return {
    id: overrides.id ?? `tx-${Math.random().toString(36).slice(2, 8)}`,
    occurredAt: overrides.occurredAt ?? '2026-05-12T11:00:00Z',
    items,
    totalAsk: overrides.totalAsk ?? items.reduce((acc, i) => acc + i.lineTotal, 0),
    notes: overrides.notes,
  }
}

beforeEach(() => {
  __ls_store = {}
})

describe('loadActiveSession', () => {
  it('returns null when localStorage is empty', () => {
    expect(loadActiveSession()).toBeNull()
  })

  it('returns null when stored JSON is malformed', () => {
    localStorage.setItem('bake-sales-active', '{not valid')
    expect(loadActiveSession()).toBeNull()
  })

  it('returns null when stored shape is invalid', () => {
    localStorage.setItem('bake-sales-active', JSON.stringify({ id: '', openedAt: '' }))
    expect(loadActiveSession()).toBeNull()
  })

  it('reads a valid new-shape persisted session', () => {
    const session = makeSession()
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const loaded = loadActiveSession()
    expect(loaded?.id).toBe('s-1')
    expect(loaded?.initialPlan).toHaveLength(2)
    expect(loaded?.transactions).toEqual([])
  })

  it('reads a valid legacy-shape persisted session and back-fills initialPlan + transactions', () => {
    const session = makeLegacySession()
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const loaded = loadActiveSession()
    expect(loaded?.id).toBe('s-legacy')
    expect(loaded?.sales).toHaveLength(2)
    // PF-256.6 back-compat: legacy active sessions get initialPlan derived from
    // sales[] and an empty transactions[] so the New Sale flow works.
    expect(loaded?.initialPlan).toHaveLength(2)
    expect(loaded?.transactions).toEqual([])
  })

  it('preserves optional label and transaction notes', () => {
    const tx = makeTx({ notes: 'Cash payment, regular customer' })
    const session = makeSession({ label: 'Saturday Market', transactions: [tx] })
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const loaded = loadActiveSession()
    expect(loaded?.label).toBe('Saturday Market')
    expect(loaded?.transactions?.[0].notes).toBe('Cash payment, regular customer')
  })

  it('filters out malformed transaction items', () => {
    const session = {
      id: 's-1',
      openedAt: '2026-05-12T10:00:00Z',
      initialPlan: [{ recipeId: 'r1', plannedUnits: 8, unitPrice: 5 }],
      transactions: [
        {
          id: 'tx-1',
          occurredAt: '2026-05-12T11:00:00Z',
          items: [
            { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
            { recipeId: '', units: 1, unitPrice: 1, lineTotal: 1 }, // invalid
            null, // invalid
          ],
          totalAsk: 10,
        },
      ],
    }
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const loaded = loadActiveSession()
    expect(loaded?.transactions?.[0].items).toHaveLength(1)
    expect(loaded?.transactions?.[0].items[0].recipeId).toBe('r1')
  })
})

describe('saveActiveSession / clearActiveSession', () => {
  it('round-trips a new-shape session', () => {
    const session = makeSession()
    saveActiveSession(session)
    const loaded = loadActiveSession()
    expect(loaded).toEqual(session)
  })

  it('clearActiveSession removes the key', () => {
    saveActiveSession(makeSession())
    expect(loadActiveSession()).not.toBeNull()
    clearActiveSession()
    expect(loadActiveSession()).toBeNull()
  })
})

describe('loadHistory / saveHistory', () => {
  it('returns empty array when key absent', () => {
    expect(loadHistory()).toEqual([])
  })

  it('returns empty array when JSON malformed', () => {
    localStorage.setItem('bake-sales-history', '{nope')
    expect(loadHistory()).toEqual([])
  })

  it('returns empty array when shape is not an array', () => {
    localStorage.setItem('bake-sales-history', JSON.stringify({ id: 'x' }))
    expect(loadHistory()).toEqual([])
  })

  it('round-trips closed sessions sorted newest first', () => {
    const a = makeSession({ id: 'a', closedAt: '2026-05-10T20:00:00Z' })
    const b = makeSession({ id: 'b', closedAt: '2026-05-11T20:00:00Z' })
    saveHistory([a, b])
    const loaded = loadHistory()
    expect(loaded.map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('drops sessions without closedAt', () => {
    const a = makeSession({ id: 'a', closedAt: '2026-05-10T20:00:00Z' })
    const b = makeSession({ id: 'b' }) // still active
    saveHistory([a, b])
    expect(loadHistory().map((s) => s.id)).toEqual(['a'])
  })

  it('caps history at HISTORY_CAP entries', () => {
    const many = Array.from({ length: HISTORY_CAP + 5 }, (_, i) =>
      makeSession({
        id: `s-${i}`,
        closedAt: `2026-05-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
      }),
    )
    saveHistory(many)
    const loaded = loadHistory()
    expect(loaded.length).toBe(HISTORY_CAP)
    expect(loaded[0].id).toBe(`s-${HISTORY_CAP + 4}`)
  })

  it('preserves legacy sessions in history', () => {
    const legacy = makeLegacySession({ id: 'legacy', closedAt: '2026-05-10T20:00:00Z' })
    saveHistory([legacy])
    const loaded = loadHistory()
    expect(loaded[0].sales).toBeDefined()
    expect(loaded[0].transactions).toBeUndefined()
  })
})

describe('openSession', () => {
  it('snapshots plan entries into initialPlan with empty transactions', () => {
    const s = openSession({
      planEntries: [
        { recipeId: 'r1', unitsPerBake: 8 },
        { recipeId: 'r2', unitsPerBake: 4 },
      ],
      recipeSellPrices: { r1: 5, r2: 10 },
    })
    expect(s.initialPlan).toHaveLength(2)
    expect(s.initialPlan?.[0]).toEqual({ recipeId: 'r1', plannedUnits: 8, unitPrice: 5 })
    expect(s.initialPlan?.[1]).toEqual({ recipeId: 'r2', plannedUnits: 4, unitPrice: 10 })
    expect(s.transactions).toEqual([])
    expect(s.sales).toBeUndefined()
    expect(typeof s.id).toBe('string')
    expect(s.id.length).toBeGreaterThan(0)
    expect(s.closedAt).toBeUndefined()
  })

  it('defaults unitPrice to 0 when recipeSellPrices lacks the recipe', () => {
    const s = openSession({
      planEntries: [{ recipeId: 'r1', unitsPerBake: 8 }],
      recipeSellPrices: {},
    })
    expect(s.initialPlan?.[0].unitPrice).toBe(0)
  })

  it('attaches a trimmed label when provided', () => {
    const s = openSession({
      planEntries: [],
      recipeSellPrices: {},
      label: '  Saturday Market  ',
    })
    expect(s.label).toBe('Saturday Market')
  })

  it('omits label when empty string passed', () => {
    const s = openSession({
      planEntries: [],
      recipeSellPrices: {},
      label: '   ',
    })
    expect(s.label).toBeUndefined()
  })

  it('rounds non-integer units down', () => {
    const s = openSession({
      planEntries: [{ recipeId: 'r1', unitsPerBake: 8.9 }],
      recipeSellPrices: { r1: 1 },
    })
    expect(s.initialPlan?.[0].plannedUnits).toBe(8)
  })

  it('does not write legacy sales[] field', () => {
    const s = openSession({
      planEntries: [{ recipeId: 'r1', unitsPerBake: 8 }],
      recipeSellPrices: { r1: 5 },
    })
    expect(s.sales).toBeUndefined()
  })
})

describe('recordTransaction', () => {
  it('appends a transaction with generated id and timestamp', () => {
    const s = makeSession()
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
    ])
    expect(next.transactions).toHaveLength(1)
    expect(next.transactions?.[0].items).toHaveLength(1)
    expect(typeof next.transactions?.[0].id).toBe('string')
    expect(next.transactions?.[0].id.length).toBeGreaterThan(0)
    expect(typeof next.transactions?.[0].occurredAt).toBe('string')
    // Original untouched.
    expect(s.transactions).toEqual([])
  })

  it('computes totalAsk from item lineTotals', () => {
    const s = makeSession()
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
      { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
    ])
    expect(next.transactions?.[0].totalAsk).toBe(20)
  })

  it('re-computes lineTotal from units × unitPrice', () => {
    const s = makeSession()
    // Pass lineTotal=0 — helper should recompute.
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: 3, unitPrice: 4, lineTotal: 0 },
    ])
    expect(next.transactions?.[0].items[0].lineTotal).toBe(12)
    expect(next.transactions?.[0].totalAsk).toBe(12)
  })

  it('clamps negative units to 0', () => {
    const s = makeSession()
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: -3, unitPrice: 5, lineTotal: -15 },
    ])
    expect(next.transactions?.[0].items[0].units).toBe(0)
    expect(next.transactions?.[0].items[0].lineTotal).toBe(0)
    expect(next.transactions?.[0].totalAsk).toBe(0)
  })

  it('handles non-finite units / unitPrice gracefully', () => {
    const s = makeSession()
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: Number.NaN, unitPrice: 5, lineTotal: 0 },
      { recipeId: 'r2', units: 2, unitPrice: Number.POSITIVE_INFINITY, lineTotal: 0 },
    ])
    expect(next.transactions?.[0].items[0].units).toBe(0)
    expect(next.transactions?.[0].items[1].unitPrice).toBe(0)
  })

  it('attaches trimmed notes when provided', () => {
    const s = makeSession()
    const next = recordTransaction(
      s,
      [{ recipeId: 'r1', units: 1, unitPrice: 5, lineTotal: 5 }],
      '  Venmo  ',
    )
    expect(next.transactions?.[0].notes).toBe('Venmo')
  })

  it('omits notes when blank', () => {
    const s = makeSession()
    const next = recordTransaction(
      s,
      [{ recipeId: 'r1', units: 1, unitPrice: 5, lineTotal: 5 }],
      '   ',
    )
    expect(next.transactions?.[0].notes).toBeUndefined()
  })

  it('appends preserving prior transactions', () => {
    const tx1 = makeTx({ id: 'tx-1' })
    const s = makeSession({ transactions: [tx1] })
    const next = recordTransaction(s, [
      { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
    ])
    expect(next.transactions).toHaveLength(2)
    expect(next.transactions?.[0].id).toBe('tx-1')
  })

  it('floors fractional units', () => {
    const s = makeSession()
    const next = recordTransaction(s, [
      { recipeId: 'r1', units: 2.9, unitPrice: 5, lineTotal: 0 },
    ])
    expect(next.transactions?.[0].items[0].units).toBe(2)
    expect(next.transactions?.[0].items[0].lineTotal).toBe(10)
  })
})

describe('deleteTransaction', () => {
  it('removes the named transaction', () => {
    const tx1 = makeTx({ id: 'tx-1' })
    const tx2 = makeTx({ id: 'tx-2' })
    const s = makeSession({ transactions: [tx1, tx2] })
    const next = deleteTransaction(s, 'tx-1')
    expect(next.transactions).toHaveLength(1)
    expect(next.transactions?.[0].id).toBe('tx-2')
  })

  it('is a no-op when txId not present', () => {
    const tx1 = makeTx({ id: 'tx-1' })
    const s = makeSession({ transactions: [tx1] })
    const next = deleteTransaction(s, 'ghost')
    expect(next.transactions).toHaveLength(1)
  })

  it('returns a new session (immutable)', () => {
    const tx1 = makeTx({ id: 'tx-1' })
    const s = makeSession({ transactions: [tx1] })
    const next = deleteTransaction(s, 'tx-1')
    expect(next).not.toBe(s)
    expect(s.transactions).toHaveLength(1) // original untouched
  })

  it('handles a session with no transactions array', () => {
    const s: MarketSession = { id: 's', openedAt: 'x', initialPlan: [] }
    const next = deleteTransaction(s, 'whatever')
    expect(next.transactions).toEqual([])
  })
})

describe('aggregateSold', () => {
  it('sums units across all transactions for a recipe', () => {
    const tx1 = makeTx({
      items: [
        { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
        { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
      ],
    })
    const tx2 = makeTx({
      items: [{ recipeId: 'r1', units: 3, unitPrice: 5, lineTotal: 15 }],
    })
    const s = makeSession({ transactions: [tx1, tx2] })
    expect(aggregateSold(s, 'r1')).toBe(5)
    expect(aggregateSold(s, 'r2')).toBe(1)
  })

  it('returns 0 for a recipe not in any transaction', () => {
    const s = makeSession({ transactions: [makeTx()] })
    expect(aggregateSold(s, 'ghost')).toBe(0)
  })

  it('falls back to legacy sales[].soldUnits when no transactions', () => {
    const legacy = makeLegacySession({
      sales: [
        { recipeId: 'r1', plannedUnits: 8, soldUnits: 5, unitPrice: 5 },
        { recipeId: 'r2', plannedUnits: 4, soldUnits: 2, unitPrice: 10 },
      ],
    })
    expect(aggregateSold(legacy, 'r1')).toBe(5)
    expect(aggregateSold(legacy, 'r2')).toBe(2)
  })

  it('prefers transactions over sales[] when both exist', () => {
    const tx = makeTx({ items: [{ recipeId: 'r1', units: 7, unitPrice: 5, lineTotal: 35 }] })
    const s: MarketSession = {
      id: 's',
      openedAt: 'x',
      transactions: [tx],
      sales: [{ recipeId: 'r1', plannedUnits: 8, soldUnits: 99, unitPrice: 5 }],
    }
    expect(aggregateSold(s, 'r1')).toBe(7)
  })

  it('returns 0 for empty session with no shape', () => {
    const s: MarketSession = { id: 's', openedAt: 'x', initialPlan: [] }
    expect(aggregateSold(s, 'r1')).toBe(0)
  })
})

describe('aggregateRevenue', () => {
  it('sums lineTotal across all transactions for a recipe', () => {
    const tx1 = makeTx({
      items: [{ recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 }],
    })
    const tx2 = makeTx({
      items: [{ recipeId: 'r1', units: 3, unitPrice: 4, lineTotal: 12 }],
    })
    const s = makeSession({ transactions: [tx1, tx2] })
    expect(aggregateRevenue(s, 'r1')).toBe(22)
  })

  it('falls back to legacy sales[].soldUnits × unitPrice', () => {
    const legacy = makeLegacySession({
      sales: [{ recipeId: 'r1', plannedUnits: 8, soldUnits: 3, unitPrice: 4 }],
    })
    expect(aggregateRevenue(legacy, 'r1')).toBe(12)
  })
})

describe('sessionTotals', () => {
  it('reports transactionCount/itemsSold/revenue/totalPlanned for new-shape session', () => {
    const tx1 = makeTx({
      items: [
        { recipeId: 'r1', units: 2, unitPrice: 5, lineTotal: 10 },
        { recipeId: 'r2', units: 1, unitPrice: 10, lineTotal: 10 },
      ],
    })
    const tx2 = makeTx({
      items: [{ recipeId: 'r1', units: 3, unitPrice: 5, lineTotal: 15 }],
    })
    const s = makeSession({ transactions: [tx1, tx2] })
    const t = sessionTotals(s)
    expect(t.transactionCount).toBe(2)
    expect(t.itemsSold).toBe(6)
    expect(t.revenue).toBe(35)
    expect(t.totalPlanned).toBe(12) // 8 + 4
  })

  it('reports zeros for a freshly opened session', () => {
    const s = makeSession()
    const t = sessionTotals(s)
    expect(t.transactionCount).toBe(0)
    expect(t.itemsSold).toBe(0)
    expect(t.revenue).toBe(0)
    expect(t.totalPlanned).toBe(12)
  })

  it('reports legacy-shape session via sales[] fallback', () => {
    const legacy = makeLegacySession({
      sales: [
        { recipeId: 'r1', plannedUnits: 8, soldUnits: 5, unitPrice: 5 },
        { recipeId: 'r2', plannedUnits: 4, soldUnits: 2, unitPrice: 10 },
      ],
    })
    const t = sessionTotals(legacy)
    expect(t.transactionCount).toBe(0)
    expect(t.itemsSold).toBe(7)
    expect(t.revenue).toBe(45) // 5*5 + 2*10
    expect(t.totalPlanned).toBe(12)
  })

  it('handles empty initialPlan + transactions', () => {
    const s: MarketSession = { id: 's', openedAt: 'x', initialPlan: [], transactions: [] }
    const t = sessionTotals(s)
    expect(t).toEqual({ transactionCount: 0, itemsSold: 0, revenue: 0, totalPlanned: 0 })
  })
})

describe('recordSale (legacy)', () => {
  it('updates a legacy session row immutably', () => {
    const s = makeLegacySession()
    const next = recordSale(s, 'r1', 5)
    expect(next).not.toBe(s)
    expect(next.sales?.[0].soldUnits).toBe(5)
    expect(next.sales?.[1].soldUnits).toBe(0)
    expect(s.sales?.[0].soldUnits).toBe(0)
  })

  it('clamps negatives to 0', () => {
    const s = makeLegacySession()
    const next = recordSale(s, 'r1', -3)
    expect(next.sales?.[0].soldUnits).toBe(0)
  })
})

describe('closeSession', () => {
  it('stamps closedAt on a fresh copy', () => {
    const s = makeSession()
    const closed = closeSession(s)
    expect(closed.closedAt).toBeDefined()
    expect(typeof closed.closedAt).toBe('string')
    expect(s.closedAt).toBeUndefined()
  })
})

describe('setSessionLabel', () => {
  it('sets a trimmed label', () => {
    const next = setSessionLabel(makeSession(), '  Sunday Pop-up  ')
    expect(next.label).toBe('Sunday Pop-up')
  })

  it('clears the label when given an empty string', () => {
    const s = makeSession({ label: 'old' })
    const next = setSessionLabel(s, '')
    expect(next.label).toBeUndefined()
  })

  it('clears the label when given undefined', () => {
    const s = makeSession({ label: 'old' })
    const next = setSessionLabel(s, undefined)
    expect(next.label).toBeUndefined()
  })
})

describe('appendToHistory', () => {
  it('pushes a closed session to history, newest first', () => {
    const a = makeSession({ id: 'a', closedAt: '2026-05-10T20:00:00Z' })
    saveHistory([a])
    const b = makeSession({ id: 'b', closedAt: '2026-05-11T20:00:00Z' })
    const result = appendToHistory(b)
    expect(result.map((s) => s.id)).toEqual(['b', 'a'])
  })

  it('refuses to append an unclosed session', () => {
    const a = makeSession({ id: 'a', closedAt: '2026-05-10T20:00:00Z' })
    saveHistory([a])
    const active = makeSession({ id: 'active' })
    const result = appendToHistory(active)
    expect(result.map((s) => s.id)).toEqual(['a'])
  })

  it('deduplicates by id when re-appending', () => {
    const a = makeSession({ id: 'a', closedAt: '2026-05-10T20:00:00Z' })
    saveHistory([a])
    const aPrime = makeSession({ id: 'a', closedAt: '2026-05-12T20:00:00Z' })
    const result = appendToHistory(aPrime)
    expect(result.length).toBe(1)
    expect(result[0].closedAt).toBe('2026-05-12T20:00:00Z')
  })
})
