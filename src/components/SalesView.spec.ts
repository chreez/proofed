import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'

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

import SalesView from './SalesView.vue'

const mockRecipeList = ref([
  { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
  { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
])

const loadManifestMock = vi.fn(() => Promise.resolve())

vi.mock('@/composables/useRecipe', () => ({
  useRecipe: () => ({
    recipeList: mockRecipeList,
    loadManifest: loadManifestMock,
  }),
}))

vi.mock('@unhead/vue', () => ({
  useSeoMeta: vi.fn(),
}))

function makeFetchMock(recipeData: Record<string, unknown>) {
  return vi.fn((url: string) => {
    const path = String(url)
    const file = path.split('/').pop() ?? ''
    const data = recipeData[file] ?? { cook_log: [] }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(data),
    } as Response)
  })
}

function planJson(entries: Array<{ id: string; recipeId: string; batches?: number; unit?: string; yieldOverride?: number | null }>): string {
  return JSON.stringify({
    entries: entries.map((e) => ({
      id: e.id,
      recipeId: e.recipeId,
      batches: e.batches ?? 1,
      yieldOverride: e.yieldOverride ?? null,
      unit: e.unit ?? 'bun',
      addedBy: 'user',
      addedAt: '2026-05-12T00:00:00Z',
    })),
    updated: '2026-05-12T00:00:00Z',
  })
}

const RECIPE_FIXTURE = {
  'atk-cinnamon-buns-ultimate.json': {
    meta: { name: 'ATK Cinnamon Buns', yields: '8 buns' },
    cook_log: [
      { date: '2026-04-01', version: 'v1.0.0', notes: [], cost: { total: 4, perServing: 0.5, servings: 8, items: [] } },
    ],
  },
  'tartine-baguette.json': {
    meta: { name: 'Tartine Baguette', yields: '2 baguettes' },
    cook_log: [
      { date: '2026-04-05', version: 'v1.0.0', notes: [], cost: { total: 2, perServing: 1, servings: 2, items: [] } },
    ],
  },
}

describe('SalesView', () => {
  beforeEach(() => {
    __ls_store = {}
    vi.clearAllMocks()
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
      { id: 'tartine-baguette', name: 'Tartine Baguette', file: 'tartine-baguette.json' },
    ]
    global.fetch = makeFetchMock(RECIPE_FIXTURE)
    vi.stubGlobal('confirm', vi.fn(() => true))
  })

  it('shows empty state with CTA to /production when no plan and no history', async () => {
    const wrapper = mount(SalesView)
    await flushPromises()
    const empty = wrapper.find('[data-testid="sales-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('No bakes queued')
    const cta = wrapper.find('[data-testid="sales-empty-cta"]')
    expect(cta.exists()).toBe(true)
    expect(cta.attributes('href')).toBe('/production')
  })

  it('shows "start session" empty state when a plan exists but no session', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    const empty = wrapper.find('[data-testid="sales-empty"]')
    expect(empty.exists()).toBe(true)
    expect(empty.text()).toContain('No market session yet')
    const startBtns = wrapper.findAll('[data-testid^="sales-empty-start"], [data-testid="sales-start-btn"]')
    expect(startBtns.length).toBeGreaterThan(0)
  })

  it('opens a session from the production plan snapshot (writes initialPlan + empty transactions)', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([
        { id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', batches: 1, unit: 'bun' },
        { id: 'p2', recipeId: 'tartine-baguette', batches: 1, unit: 'baguette' },
      ]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()

    const start = wrapper.find('[data-testid="sales-start-btn"]')
    expect(start.exists()).toBe(true)
    await start.trigger('click')
    await flushPromises()

    const active = wrapper.find('[data-testid="sales-active"]')
    expect(active.exists()).toBe(true)

    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.initialPlan.length).toBe(2)
    expect(stored.initialPlan[0].recipeId).toBe('atk-cinnamon-buns-ultimate')
    expect(stored.initialPlan[0].plannedUnits).toBe(8)
    expect(stored.initialPlan[0].unitPrice).toBeCloseTo(1.25)
    expect(stored.transactions).toEqual([])
    expect(stored.sales).toBeUndefined()
  })

  it('honors sellPriceOverride from /pricing state when opening', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 150, sellPriceOverride: 4 } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.initialPlan[0].unitPrice).toBe(4)
  })

  it('opens the New Sale sheet on "+ New Sale" click', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(false)
    await wrapper.find('[data-testid="sales-new-sale-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(true)
  })

  it('records a transaction and updates session totals + persists', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([
        { id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' },
        { id: 'p2', recipeId: 'tartine-baguette', unit: 'baguette' },
      ]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()

    // Open New Sale sheet, build cart, complete.
    await wrapper.find('[data-testid="sales-new-sale-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="new-sale-inc-atk-cinnamon-buns-ultimate"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-atk-cinnamon-buns-ultimate"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-inc-tartine-baguette"]').trigger('click')
    await wrapper.find('[data-testid="new-sale-complete"]').trigger('click')
    await flushPromises()

    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.transactions.length).toBe(1)
    expect(stored.transactions[0].items.length).toBe(2)
    expect(stored.transactions[0].totalAsk).toBeGreaterThan(0)

    // Subtitle reflects the transaction.
    const subtitle = wrapper.find('[data-testid="sales-subtitle"]').text()
    expect(subtitle).toContain('1 sale')
    expect(subtitle).toContain('3 items')

    // Sheet closed after complete.
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(false)
    // Flash banner appears.
    expect(wrapper.find('[data-testid="sales-transaction-flash"]').exists()).toBe(true)
  })

  it('renders the transaction log with newest first', async () => {
    const session = {
      id: 's',
      openedAt: '2026-05-12T10:00:00Z',
      initialPlan: [
        { recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 },
      ],
      transactions: [
        {
          id: 'tx-early',
          occurredAt: '2026-05-12T10:30:00Z',
          items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 1, unitPrice: 5, lineTotal: 5 }],
          totalAsk: 5,
        },
        {
          id: 'tx-late',
          occurredAt: '2026-05-12T11:30:00Z',
          items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 2, unitPrice: 5, lineTotal: 10 }],
          totalAsk: 10,
        },
      ],
    }
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const wrapper = mount(SalesView)
    await flushPromises()
    const log = wrapper.find('[data-testid="sales-tx-log"]')
    expect(log.exists()).toBe(true)
    const rows = wrapper.findAll('[data-testid="sales-tx-log"] [data-tx-id]')
    expect(rows.length).toBe(2)
    expect(rows[0].attributes('data-tx-id')).toBe('tx-late')
    expect(rows[1].attributes('data-tx-id')).toBe('tx-early')
  })

  it('shows empty-tx state when active session has no transactions yet', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-tx-empty"]').exists()).toBe(true)
  })

  it('deletes a transaction via row delete', async () => {
    const session = {
      id: 's',
      openedAt: '2026-05-12T10:00:00Z',
      initialPlan: [{ recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 }],
      transactions: [
        {
          id: 'tx-1',
          occurredAt: '2026-05-12T10:30:00Z',
          items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 1, unitPrice: 5, lineTotal: 5 }],
          totalAsk: 5,
        },
      ],
    }
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const wrapper = mount(SalesView)
    await flushPromises()
    // Expand the row first to reveal the delete button.
    await wrapper.find('[data-testid="tx-row-toggle"]').trigger('click')
    await wrapper.find('[data-testid="tx-row-delete"]').trigger('click')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.transactions.length).toBe(0)
  })

  it('renders the By-recipe section (collapsed) on the active session', async () => {
    const session = {
      id: 's',
      openedAt: '2026-05-12T10:00:00Z',
      initialPlan: [
        { recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 },
        { recipeId: 'tartine-baguette', plannedUnits: 2, unitPrice: 10 },
      ],
      transactions: [
        {
          id: 'tx-1',
          occurredAt: '2026-05-12T10:30:00Z',
          items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 3, unitPrice: 5, lineTotal: 15 }],
          totalAsk: 15,
        },
      ],
    }
    localStorage.setItem('bake-sales-active', JSON.stringify(session))
    const wrapper = mount(SalesView)
    await flushPromises()
    const byrecipe = wrapper.find('[data-testid="sales-byrecipe"]')
    expect(byrecipe.exists()).toBe(true)
    // List exists in DOM (details opens on click, but is queryable). The
    // SalesRow components show aggregate sold = 3 for ATK.
    const list = wrapper.find('[data-testid="sales-byrecipe-list"]')
    expect(list.exists()).toBe(true)
    const rows = wrapper.findAllComponents({ name: 'SalesRow' })
    expect(rows.length).toBeGreaterThanOrEqual(2)
  })

  it('closes a session: clears active, appends to history, shows flash', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="sales-close-btn"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('bake-sales-active')).toBeNull()
    const history = JSON.parse(localStorage.getItem('bake-sales-history') ?? '[]')
    expect(history.length).toBe(1)
    expect(history[0].closedAt).toBeDefined()
    expect(wrapper.find('[data-testid="sales-flash"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="sales-history"]').exists()).toBe(true)
  })

  it('hydrates new-shape active session from localStorage on mount', async () => {
    localStorage.setItem(
      'bake-sales-active',
      JSON.stringify({
        id: 'preexisting',
        openedAt: '2026-05-12T00:00:00Z',
        label: 'Saturday Market',
        initialPlan: [
          { recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 },
        ],
        transactions: [
          {
            id: 'tx-1',
            occurredAt: '2026-05-12T11:00:00Z',
            items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 3, unitPrice: 5, lineTotal: 15 }],
            totalAsk: 15,
          },
        ],
      }),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-active"]').exists()).toBe(true)
    const subtitle = wrapper.find('[data-testid="sales-subtitle"]').text()
    expect(subtitle).toContain('Saturday Market')
    expect(subtitle).toContain('1 sale')
    expect(subtitle).toContain('3 items')
    expect(subtitle).toContain('$15.00')
  })

  it('renders legacy (PF-256.5) closed session in history with SalesRow fallback', async () => {
    localStorage.setItem(
      'bake-sales-history',
      JSON.stringify([
        {
          id: 'h1',
          openedAt: '2026-05-10T10:00:00Z',
          closedAt: '2026-05-10T18:00:00Z',
          label: 'Past Market',
          sales: [
            { recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, soldUnits: 8, unitPrice: 5 },
          ],
        },
      ]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    const toggle = wrapper.find('[data-testid="sales-history-toggle"]')
    expect(toggle.exists()).toBe(true)
    await toggle.trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-history-legacy"]').exists()).toBe(true)
    // History row inside is readonly.
    const row = wrapper.find('[data-testid="sales-history-legacy"] .sales-row')
    expect(row.classes()).toContain('sales-row--readonly')
  })

  it('renders new-shape closed session in history with transaction log', async () => {
    localStorage.setItem(
      'bake-sales-history',
      JSON.stringify([
        {
          id: 'h2',
          openedAt: '2026-05-11T10:00:00Z',
          closedAt: '2026-05-11T18:00:00Z',
          label: 'Sunday Pop-up',
          initialPlan: [
            { recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 },
          ],
          transactions: [
            {
              id: 'tx-h2-1',
              occurredAt: '2026-05-11T12:00:00Z',
              items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 2, unitPrice: 5, lineTotal: 10 }],
              totalAsk: 10,
            },
          ],
        },
      ]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-history-toggle"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-history-tx-log"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="sales-history-legacy"]').exists()).toBe(false)
  })

  it('updates the session label and persists', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    const input = wrapper.find('[data-testid="sales-label-input"]')
    await input.setValue('Sunday Pop-up')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.label).toBe('Sunday Pop-up')
  })

  it('does not close when user cancels confirm', async () => {
    vi.stubGlobal('confirm', vi.fn(() => false))
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="sales-close-btn"]').trigger('click')
    await flushPromises()
    expect(localStorage.getItem('bake-sales-active')).not.toBeNull()
    expect(wrapper.find('[data-testid="sales-active"]').exists()).toBe(true)
  })

  it('shows loading state before recipes resolve', () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    expect(wrapper.text()).toContain('Loading')
  })

  it('hydrates lazily when recipeList becomes non-empty after mount', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    mockRecipeList.value = []
    const wrapper = mount(SalesView)
    await flushPromises()
    expect(wrapper.text()).toContain('Loading')
    mockRecipeList.value = [
      { id: 'atk-cinnamon-buns-ultimate', name: 'ATK Ultimate Cinnamon Buns', file: 'atk-cinnamon-buns-ultimate.json' },
    ]
    await flushPromises()
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-empty"]').exists()).toBe(true)
  })

  it('header subtitle shows singular "sale" when transactionCount === 1', async () => {
    localStorage.setItem(
      'bake-sales-active',
      JSON.stringify({
        id: 's',
        openedAt: '2026-05-12T00:00:00Z',
        initialPlan: [{ recipeId: 'atk-cinnamon-buns-ultimate', plannedUnits: 8, unitPrice: 5 }],
        transactions: [
          {
            id: 'tx-only',
            occurredAt: '2026-05-12T11:00:00Z',
            items: [{ recipeId: 'atk-cinnamon-buns-ultimate', units: 1, unitPrice: 5, lineTotal: 5 }],
            totalAsk: 5,
          },
        ],
      }),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    expect(wrapper.find('[data-testid="sales-subtitle"]').text()).toContain('1 sale')
  })

  it('handles missing sellPrice gracefully (defaults to $0)', async () => {
    // Plan entry with no cost data → cpu is null → sell stays 0.
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'unknown-recipe', unit: 'unit' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.initialPlan[0].unitPrice).toBe(0)
  })

  it('honors markupPct from /pricing when no override is set', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    localStorage.setItem(
      'bake-pricing-current',
      JSON.stringify({
        perRecipe: { 'atk-cinnamon-buns-ultimate': { markupPct: 200, sellPriceOverride: null } },
        updated: '2026-05-12T00:00:00Z',
      }),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    // cpu = $0.50, sell = 0.5 × (1 + 2.0) = $1.50
    expect(stored.initialPlan[0].unitPrice).toBeCloseTo(1.5)
  })

  it('cancel from New Sale sheet closes without recording', async () => {
    localStorage.setItem(
      'bake-production-current',
      planJson([{ id: 'p1', recipeId: 'atk-cinnamon-buns-ultimate', unit: 'bun' }]),
    )
    const wrapper = mount(SalesView)
    await flushPromises()
    await wrapper.find('[data-testid="sales-start-btn"]').trigger('click')
    await flushPromises()
    await wrapper.find('[data-testid="sales-new-sale-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(true)
    await wrapper.find('[data-testid="new-sale-cancel-btn"]').trigger('click')
    await flushPromises()
    expect(wrapper.find('[data-testid="new-sale-sheet"]').exists()).toBe(false)
    const stored = JSON.parse(localStorage.getItem('bake-sales-active') ?? '{}')
    expect(stored.transactions).toEqual([])
  })
})
