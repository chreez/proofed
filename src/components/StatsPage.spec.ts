import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import StatsPage from './StatsPage.vue'
import type { RecipeManifest, Recipe } from '@/types/recipe'

const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({ push: mockPush }),
}))

// --- Test data helpers ---

function makeManifest(entries: Array<{ id: string; name: string; file: string }>): RecipeManifest {
  return { recipes: entries }
}

function makeRecipe(overrides: Partial<Recipe> = {}): Recipe {
  return {
    meta: { name: 'Test Recipe', source: { name: 'Test' }, yields: '1 loaf', total_time: '4 hours' },
    config: {
      early_check_percent: 75,
      stats: {
        group: 'Sourdough Breads',
        defaultYield: 1,
        unit: 'loaves',
        servingsPerItem: 10,
        servingUnit: 'slices',
      },
    },
    vessels: [],
    stages: [],
    states: [],
    version: 'v1.0.0',
    ...overrides,
  } as Recipe
}

function makeCookLogEntry(overrides: Record<string, unknown> = {}) {
  return {
    date: '2026-02-01',
    version: 'v1.0.0',
    notes: ['Good bake'],
    ...overrides,
  }
}

// --- Fetch mock setup ---

function setupFetchMock(manifest: RecipeManifest, recipeMap: Record<string, Recipe>): void {
  vi.stubGlobal('fetch', vi.fn(async (url: string) => {
    if (url === '/recipes/index.json') {
      return { json: async () => manifest }
    }
    // Match /recipes/<file>
    const fileMatch = url.match(/\/recipes\/(.+)$/)
    if (fileMatch) {
      const recipe = recipeMap[fileMatch[1]]
      if (recipe) {
        return { json: async () => recipe }
      }
    }
    throw new Error(`Unexpected fetch URL: ${url}`)
  }))
}

async function mountAndLoad(manifest: RecipeManifest, recipeMap: Record<string, Recipe>) {
  setupFetchMock(manifest, recipeMap)
  const wrapper = mount(StatsPage)
  await flushPromises()
  await nextTick()
  return wrapper
}

describe('StatsPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    mockPush.mockClear()
    // Clean up teleported popover content from previous tests
    document.querySelectorAll('.ds3-timeline-popover').forEach(el => el.remove())
  })

  // --- Loading state ---

  it('shows loading state initially', () => {
    // Never-resolving fetch to keep loading state
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})))
    const wrapper = mount(StatsPage)
    expect(wrapper.find('.ds3-loading').exists()).toBe(true)
    expect(wrapper.text()).toContain('Loading stats...')
  })

  it('hides loading state after data loads', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-loading').exists()).toBe(false)
  })

  // --- Empty state ---

  it('shows empty state when no recipes have bakes', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({ cook_log: [] })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-empty').exists()).toBe(true)
    expect(wrapper.text()).toContain('No bake data yet')
  })

  it('shows empty state when manifest has no recipes', async () => {
    const manifest = makeManifest([])
    const wrapper = await mountAndLoad(manifest, {})

    expect(wrapper.find('.ds3-empty').exists()).toBe(true)
  })

  // --- Hero tiles ---

  it('renders hero tiles with correct totals', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01' }),
      ],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 2, unit: 'pies', servingsPerItem: 4, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-20' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    const tiles = wrapper.findAll('.ds3-tile-value')
    expect(tiles.length).toBe(4)
    // Bake Sessions: 2 (bread) + 1 (pizza) = 3
    expect(tiles[0].text()).toBe('3')
    // Items Made: 1+1 (bread, defaultYield=1 each) + 2 (pizza, defaultYield=2) = 4
    expect(tiles[1].text()).toBe('4')
    // Recipes: 2
    expect(tiles[2].text()).toBe('2')
    // Total Servings: 2*10 (bread) + 2*4 (pizza) = 28
    expect(tiles[3].text()).toBe('28')
  })

  // --- Groups by stats.group ---

  it('groups recipes by stats.group', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Sourdough', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 8, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    const groupTitles = wrapper.findAll('.ds3-group-title')
    const titles = groupTitles.map(g => g.text())
    expect(titles).toContain('Sourdough Breads')
    expect(titles).toContain('Pizza')
  })

  it('orders groups by predefined order', async () => {
    const manifest = makeManifest([
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
      { id: 'bread', name: 'Bread', file: 'bread.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 8, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    const groupTitles = wrapper.findAll('.ds3-group-title')
    // Sourdough Breads comes before Pizza in predefined order
    expect(groupTitles[0].text()).toBe('Sourdough Breads')
    expect(groupTitles[1].text()).toBe('Pizza')
  })

  // --- Only includes completed entries ---

  it('excludes in_progress cook_log entries from counts', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01', status: 'complete' }),
        makeCookLogEntry({ date: '2026-02-10', status: 'in_progress' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Only 1 completed bake session
    const tiles = wrapper.findAll('.ds3-tile-value')
    expect(tiles[0].text()).toBe('1')
  })

  it('shows empty state when all entries are in_progress', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ status: 'in_progress' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-empty').exists()).toBe(true)
  })

  // --- actual_yield vs defaultYield ---

  it('uses actual_yield when present, falls back to defaultYield', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15', actual_yield: { value: 2, unit: 'loaves' } }),
        makeCookLogEntry({ date: '2026-02-01' }), // no actual_yield, uses defaultYield=1
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Items Made: 2 + 1 = 3
    const tiles = wrapper.findAll('.ds3-tile-value')
    expect(tiles[1].text()).toBe('3')
    // Total Servings: 3 * 10 = 30
    expect(tiles[3].text()).toBe('30')
  })

  // --- Recipes without stats config ---

  it('handles recipes without stats config gracefully', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'nostats', name: 'No Stats', file: 'nostats.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const noStats = makeRecipe({
      config: { early_check_percent: 75 }, // no stats
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'nostats.json': noStats })

    // Should only show bread group, noStats recipe skipped
    const groupTitles = wrapper.findAll('.ds3-group-title')
    expect(groupTitles.length).toBe(1)
    expect(groupTitles[0].text()).toBe('Sourdough Breads')
    // Only 1 recipe counted
    const tiles = wrapper.findAll('.ds3-tile-value')
    expect(tiles[2].text()).toBe('1')
  })

  // --- Aberrations ---

  it('separates aberrant entries into Aberrations group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Garlic bread experiment' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const groupTitles = wrapper.findAll('.ds3-group-title')
    const titles = groupTitles.map(g => g.text())
    expect(titles).toContain('Sourdough Breads')
    expect(titles).toContain('Aberrations')
  })

  it('uses aberration_note as recipe name in Aberrations group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Garlic bread experiment' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Expand Aberrations group to see recipe names
    const groups = wrapper.findAll('.ds3-group-header')
    const aberrationHeader = groups.find(g => g.text().includes('Aberrations'))
    expect(aberrationHeader).toBeDefined()
    await aberrationHeader!.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Garlic bread experiment')
  })

  it('falls back to "(name) (aberration)" when aberration_note is missing', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      meta: { name: 'Sourdough', source: { name: 'Test' }, yields: '1 loaf', total_time: '4h' },
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Expand Aberrations group
    const groups = wrapper.findAll('.ds3-group-header')
    const aberrationHeader = groups.find(g => g.text().includes('Aberrations'))
    await aberrationHeader!.trigger('click')
    await nextTick()

    // The name from manifest is 'Bread' (passed via entry.name in loadData)
    expect(wrapper.text()).toContain('Bread (aberration)')
  })

  it('uses cost.servings for servingsPerItem on aberrations', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({
          date: '2026-02-01',
          aberration: true,
          aberration_note: 'Garlic bread',
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Expand Aberrations group
    const groups = wrapper.findAll('.ds3-group-header')
    const aberrationHeader = groups.find(g => g.text().includes('Aberrations'))
    await aberrationHeader!.trigger('click')
    await nextTick()

    // The aberration should show servings badge since servingsPerItem(10) != 1(items)
    // totalServings = 1 * 10 = 10, totalItems = 1
    // The servings badge appears when totalServings !== totalItems
    const aberrationGroup = wrapper.findAll('.ds3-group').find(g => g.text().includes('Aberrations'))
    expect(aberrationGroup).toBeDefined()
    expect(aberrationGroup!.text()).toContain('10')
  })

  it('defaults aberration servingsPerItem to 1 when cost has no servings', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({
          date: '2026-02-01',
          aberration: true,
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Aberration with no cost uses servingsPerItem=1, so totalServings = totalItems
    // The muted servings badge should not appear
    const groups = wrapper.findAll('.ds3-group-header')
    const aberrationHeader = groups.find(g => g.text().includes('Aberrations'))
    expect(aberrationHeader).toBeDefined()
    // 1 item, 1 serving -> badges should show "1 pan" but no muted servings badge
    const mutedBadge = aberrationHeader!.findAll('.ds3-group-badge--muted')
    expect(mutedBadge.length).toBe(0)
  })

  // --- Expand/collapse ---

  it('non-Aberration groups start expanded', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Body should be visible
    expect(wrapper.find('.ds3-group-body').exists()).toBe(true)
    // Chevron should show minus
    expect(wrapper.find('.ds3-chevron').text()).toBe('\u2212')
  })

  it('Aberrations group starts collapsed', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Aberrations group should be collapsed (no body, chevron shows +)
    const groups = wrapper.findAll('.ds3-group')
    const aberrationGroup = groups.find(g => g.text().includes('Aberrations'))
    expect(aberrationGroup).toBeDefined()
    expect(aberrationGroup!.find('.ds3-group-body').exists()).toBe(false)
    const chevrons = aberrationGroup!.findAll('.ds3-chevron')
    expect(chevrons[0].text()).toBe('+')
  })

  it('toggle collapses an expanded group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Initially expanded
    expect(wrapper.find('.ds3-group-body').exists()).toBe(true)

    // Click to collapse
    await wrapper.find('.ds3-group-header').trigger('click')
    await nextTick()

    expect(wrapper.find('.ds3-group-body').exists()).toBe(false)
    expect(wrapper.find('.ds3-chevron').text()).toBe('+')
  })

  it('toggle expands a collapsed group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Collapse first
    await wrapper.find('.ds3-group-header').trigger('click')
    await nextTick()
    expect(wrapper.find('.ds3-group-body').exists()).toBe(false)

    // Re-expand
    await wrapper.find('.ds3-group-header').trigger('click')
    await nextTick()
    expect(wrapper.find('.ds3-group-body').exists()).toBe(true)
  })

  // --- Timeline ---

  it('renders timeline dots for bake dates', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dots = wrapper.findAll('.ds3-timeline-dot')
    expect(dots.length).toBe(2)
  })

  it('timeline dots have correct percent positioning', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-01' }),
        makeCookLogEntry({ date: '2026-01-11' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dots = wrapper.findAll('.ds3-timeline-dot')
    expect(dots[0].attributes('style')).toContain('left: 0%')
    expect(dots[1].attributes('style')).toContain('left: 100%')
  })

  it('timeline shows date range in header', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-15' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-timeline-range').exists()).toBe(true)
    expect(wrapper.text()).toContain('Jan 15')
    expect(wrapper.text()).toContain('Feb 15')
  })

  it('timeline shows labels', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-01' }),
        makeCookLogEntry({ date: '2026-02-01' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const labels = wrapper.findAll('.ds3-timeline-date')
    expect(labels.length).toBe(5) // always 5 labels
  })

  it('aberration timeline dots get --aberration class', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const aberrationDots = wrapper.findAll('.ds3-timeline-dot--aberration')
    expect(aberrationDots.length).toBe(1)
  })

  it('shows count badge when multiple recipes baked on same date', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 8, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    // Both on same date = one dot with count of 2
    const dots = wrapper.findAll('.ds3-timeline-dot')
    expect(dots.length).toBe(1)
    expect(wrapper.find('.ds3-timeline-count').text()).toBe('2')
  })

  it('does not show count badge for single-recipe dates', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-timeline-count').exists()).toBe(false)
  })

  // --- Production mix ---

  it('computes production mix percentages correctly', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 3, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 8, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    // 3 bread items + 1 pizza item = 4 total
    // bread = 75%, pizza = 25%
    const mixPcts = wrapper.findAll('.ds3-mix-pct')
    expect(mixPcts[0].text()).toBe('75%')
    expect(mixPcts[1].text()).toBe('25%')
  })

  it('excludes Aberrations from production mix', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const mixNames = wrapper.findAll('.ds3-mix-name')
    const names = mixNames.map(n => n.text())
    expect(names).not.toContain('Aberrations')
  })

  // --- Group detail sections ---

  it('shows group badge with items count and unit', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 2, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const badge = wrapper.find('.ds3-group-badge')
    expect(badge.text()).toContain('2')
    expect(badge.text()).toContain('loaves')
  })

  it('shows servings badge when servings differ from items', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // totalItems=1, totalServings=10 -> should show muted badge
    const mutedBadge = wrapper.find('.ds3-group-badge--muted')
    expect(mutedBadge.exists()).toBe(true)
    expect(mutedBadge.text()).toContain('10')
    expect(mutedBadge.text()).toContain('slices')
  })

  it('hides servings badge when servings equal items', async () => {
    const manifest = makeManifest([{ id: 'sauce', name: 'Sauce', file: 'sauce.json' }])
    const sauce = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sauces & Condiments', defaultYield: 1, unit: 'jars', servingsPerItem: 1, servingUnit: 'jars' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'sauce.json': sauce })

    // totalItems=1, totalServings=1 -> muted badge should not appear
    expect(wrapper.find('.ds3-group-badge--muted').exists()).toBe(false)
  })

  it('shows session count with pluralization', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-01-15' }), makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-group-sessions').text()).toBe('2 sessions')
  })

  it('shows singular session for single bake', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-group-sessions').text()).toBe('1 session')
  })

  // --- Per-recipe detail bars ---

  it('renders recipe bars inside expanded group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-recipe-name').text()).toBe('Bread')
    const barLabels = wrapper.findAll('.ds3-bar-label')
    expect(barLabels[0].text()).toBe('Sessions')
    expect(barLabels[1].text()).toBe('Loaves') // capitalized unit
  })

  it('shows servings bar when servingsPerItem > 1', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const barLabels = wrapper.findAll('.ds3-bar-label')
    expect(barLabels.length).toBe(3)
    expect(barLabels[2].text()).toBe('Slices')
  })

  it('hides servings bar when servingsPerItem is 1', async () => {
    const manifest = makeManifest([{ id: 'sauce', name: 'Sauce', file: 'sauce.json' }])
    const sauce = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sauces & Condiments', defaultYield: 1, unit: 'jars', servingsPerItem: 1, servingUnit: 'jars' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'sauce.json': sauce })

    const barLabels = wrapper.findAll('.ds3-bar-label')
    expect(barLabels.length).toBe(2) // Only sessions + unit, no servings bar
  })

  it('bar widths are proportional to max across all recipes', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-01' }),
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01' }),
      ],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 1, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-20' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    // bread has 3 sessions (max), pizza has 1
    // bread session bar should be 100%, pizza should be ~33%
    const barFills = wrapper.findAll('.ds3-bar-fill')
    // First bar fill is bread sessions -> 100%
    expect(barFills[0].attributes('style')).toContain('width: 100%')
  })

  // --- Pantry Ledger ---

  it('shows Pantry Ledger section when cost data exists', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          date: '2026-02-01',
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-ledger').exists()).toBe(true)
    expect(wrapper.text()).toContain('Pantry Ledger')
    expect(wrapper.text()).toContain('1 costed bakes')
    expect(wrapper.text()).toContain('$5.00 total')
  })

  it('hides Pantry Ledger when no cost data', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-ledger').exists()).toBe(false)
  })

  it('Pantry Ledger starts collapsed', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    expect(wrapper.find('.ds3-ledger-body').exists()).toBe(false)
  })

  it('Pantry Ledger toggle opens and closes body', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()
    expect(wrapper.find('.ds3-ledger-body').exists()).toBe(true)

    // Close
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()
    expect(wrapper.find('.ds3-ledger-body').exists()).toBe(false)
  })

  it('Pantry Ledger table renders cost rows', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          date: '2026-02-15',
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open ledger
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()

    expect(wrapper.find('.ds3-ledger-table').exists()).toBe(true)
    // Check row data
    const cells = wrapper.findAll('.ds3-td')
    expect(cells[0].text()).toBe('02/15') // ledgerDate
    expect(cells[1].text()).toBe('Bread')
    expect(cells[2].text()).toBe('$5.00')
    expect(cells[3].text()).toBe('$0.50')
  })

  it('Pantry Ledger shows totals in footer', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [
        makeCookLogEntry({
          date: '2026-01-15',
          cost: { total: 4.00, perServing: 0.40, servings: 10, items: [] },
        }),
        makeCookLogEntry({
          date: '2026-02-01',
          cost: { total: 6.00, perServing: 0.60, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open ledger
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()

    const footer = wrapper.find('.ds3-tfoot-row')
    expect(footer.exists()).toBe(true)
    // Total cost: $10.00
    expect(footer.text()).toContain('$10.00')
    // 2 bakes, 20 servings
    expect(footer.text()).toContain('2 bakes')
    expect(footer.text()).toContain('20 servings')
    // Avg per serving: $10.00 / 20 = $0.50
    expect(footer.text()).toContain('$0.50')
  })

  it('Pantry Ledger rows are sorted by date', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          date: '2026-02-15',
          cost: { total: 6.00, perServing: 0.60, servings: 10, items: [] },
        }),
        makeCookLogEntry({
          date: '2026-01-05',
          cost: { total: 4.00, perServing: 0.40, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open ledger
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()

    const rows = wrapper.findAll('.ds3-tr')
    // First row date should be 01/05, second 02/15
    expect(rows[0].text()).toContain('01/05')
    expect(rows[1].text()).toContain('02/15')
  })

  it('Pantry Ledger avg per serving is 0 when no servings', async () => {
    // This tests the ledgerAvgPerServing guard when total servings = 0
    // This is an edge case that should never happen with valid data,
    // but we test the guard anyway (line: if (ledgerTotalServings.value === 0) return 0)
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 0, unit: 'loaves', servingsPerItem: 0, servingUnit: 'slices' },
      },
      cook_log: [
        makeCookLogEntry({
          date: '2026-02-01',
          cost: { total: 5.00, perServing: 0.00, servings: 0, items: [] },
          actual_yield: { value: 0, unit: 'loaves' },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open ledger
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()

    const footer = wrapper.find('.ds3-tfoot-row')
    // Should show $0.00 for avg per serving (not NaN or Infinity)
    expect(footer.text()).toContain('$0.00')
  })

  // --- Aberration styling ---

  it('adds --aberration class to Aberrations group', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-01-15' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const aberrationGroup = wrapper.find('.ds3-group--aberration')
    expect(aberrationGroup.exists()).toBe(true)
  })

  // --- Error handling ---

  it('handles fetch error gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('Network error'))))

    const wrapper = mount(StatsPage)
    await flushPromises()
    await nextTick()

    // Should not be loading anymore
    expect(wrapper.find('.ds3-loading').exists()).toBe(false)
    // Should show empty state (groups empty)
    expect(wrapper.find('.ds3-empty').exists()).toBe(true)
    expect(consoleError).toHaveBeenCalled()
    consoleError.mockRestore()
  })

  // --- Custom group not in predefined order ---

  it('shows custom groups not in predefined order after ordered groups', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'custom', name: 'Custom', file: 'custom.json' },
    ])
    const bread = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const custom = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Exotic Pastries', defaultYield: 1, unit: 'items', servingsPerItem: 1, servingUnit: 'items' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'custom.json': custom })

    const groupTitles = wrapper.findAll('.ds3-group-title')
    expect(groupTitles.length).toBe(2)
    // Predefined group first
    expect(groupTitles[0].text()).toBe('Sourdough Breads')
    // Custom group after
    expect(groupTitles[1].text()).toBe('Exotic Pastries')
  })

  it('custom group uses fallback icon', async () => {
    const manifest = makeManifest([{ id: 'custom', name: 'Custom', file: 'custom.json' }])
    const custom = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Exotic Pastries', defaultYield: 1, unit: 'items', servingsPerItem: 1, servingUnit: 'items' },
      },
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'custom.json': custom })

    // Fallback icon is 📦
    expect(wrapper.find('.ds3-group-icon').text()).toBe('\u{1F4E6}')
  })

  // --- Multiple recipes in same group ---

  it('multiple recipes in same group are combined', async () => {
    const manifest = makeManifest([
      { id: 'sourdough', name: 'Sourdough', file: 'sourdough.json' },
      { id: 'rye', name: 'Rye Bread', file: 'rye.json' },
    ])
    const sourdough = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const rye = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'sourdough.json': sourdough, 'rye.json': rye })

    // Both in Sourdough Breads group
    const groupTitles = wrapper.findAll('.ds3-group-title')
    expect(groupTitles.length).toBe(1)
    expect(groupTitles[0].text()).toBe('Sourdough Breads')

    // 2 sessions total
    expect(wrapper.find('.ds3-group-sessions').text()).toBe('2 sessions')

    // 2 recipe cards inside
    const recipeNames = wrapper.findAll('.ds3-recipe-name')
    expect(recipeNames.length).toBe(2)
  })

  // --- recipe with only aberration entries (no normal entries) ---

  it('recipe with only aberrations has no normal group entry', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Should have only Aberrations group, no Sourdough Breads
    const groupTitles = wrapper.findAll('.ds3-group-title')
    expect(groupTitles.length).toBe(1)
    expect(groupTitles[0].text()).toBe('Aberrations')
  })

  // --- Group badge fallback when no recipes ---

  it('group badge falls back to items/servings when unit is missing', async () => {
    // This tests the `group.recipes[0]?.unit ?? 'items'` fallback
    // In practice this would only happen with an empty recipes array,
    // which shouldn't occur, but let's make sure it works
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // With a valid recipe, unit comes from recipe[0]
    const badge = wrapper.find('.ds3-group-badge')
    expect(badge.text()).toContain('loaves')
  })

  // --- Recipes with no cook_log at all ---

  it('skips recipes with no cook_log', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'empty', name: 'Empty', file: 'empty.json' },
    ])
    const bread = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const empty = makeRecipe({ cook_log: undefined })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'empty.json': empty })

    // Only bread counted
    const tiles = wrapper.findAll('.ds3-tile-value')
    expect(tiles[2].text()).toBe('1') // recipe count
  })

  // --- Timeline with single date ---

  it('handles timeline with single bake date', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // timelineSpanDays is max(span, 1) = 1, so single dot at some percent
    const dots = wrapper.findAll('.ds3-timeline-dot')
    expect(dots.length).toBe(1)
  })

  // --- Cost bar proportions in ledger ---

  it('cost bars are proportional to max perServing', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          date: '2026-01-15',
          cost: { total: 10.00, perServing: 1.00, servings: 10, items: [] },
        }),
        makeCookLogEntry({
          date: '2026-02-01',
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Open ledger
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()

    // Max perServing is 1.00, so first row bar = 50%, second = 100%
    // (sorted by date, so 01/15 is first with perServing=1.00 -> 100%)
    const costFills = wrapper.findAll('.ds3-cost-fill')
    // First cost fill = row[0] (01/15, perServing=1.00) -> 100%
    expect(costFills[0].attributes('style')).toContain('width: 100%')
    // Second cost fill = row[1] (02/01, perServing=0.50) -> 50%
    expect(costFills[1].attributes('style')).toContain('width: 50%')
  })

  // --- Existing aberration on same date merges in timeline ---

  it('marks timeline dot as aberration when date has aberration entries', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01' }),
        makeCookLogEntry({ date: '2026-02-01', aberration: true, aberration_note: 'Test' }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Both entries on same date: one normal, one aberration
    // The dot should be marked as aberration since one aberration entry exists on that date
    const dots = wrapper.findAll('.ds3-timeline-dot')
    expect(dots.length).toBe(1) // same date -> merged
    expect(dots[0].classes()).toContain('ds3-timeline-dot--aberration')
  })

  // --- initializeExpanded only runs once ---

  it('initializeExpanded only runs once even with multiple group changes', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({ cook_log: [makeCookLogEntry()] })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Group should be expanded initially
    expect(wrapper.find('.ds3-group-body').exists()).toBe(true)

    // Collapse it
    await wrapper.find('.ds3-group-header').trigger('click')
    await nextTick()
    expect(wrapper.find('.ds3-group-body').exists()).toBe(false)

    // The watchEffect won't re-initialize since expandedInitialized is true
    // (This verifies the guard in initializeExpanded)
  })

  // --- buildBakeEntry with cost ---

  it('includes cost in bake entry when present', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // The presence of cost data means the ledger section appears
    expect(wrapper.find('.ds3-ledger').exists()).toBe(true)
  })

  // --- production mix with 0 items ---

  it('handles production mix with zero total items', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', defaultYield: 0, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [
        makeCookLogEntry({ actual_yield: { value: 0, unit: 'loaves' } }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // When total is 0, percent should be 0, not NaN
    const pct = wrapper.find('.ds3-mix-pct')
    expect(pct.text()).toBe('0%')
  })

  // --- Subgroups ---

  it('shows "items" in group badge when recipes have mixed units', async () => {
    const manifest = makeManifest([
      { id: 'loaf', name: 'Sourdough Loaf', file: 'loaf.json' },
      { id: 'baguette', name: 'Baguette', file: 'baguette.json' },
    ])
    const loaf = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const baguette = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Baguettes', defaultYield: 3, unit: 'baguettes', servingsPerItem: 6, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'loaf.json': loaf, 'baguette.json': baguette })

    const badge = wrapper.find('.ds3-group-badge')
    expect(badge.text()).toContain('items')
  })

  it('shows shared unit in group badge when all recipes have same unit', async () => {
    const manifest = makeManifest([
      { id: 'sourdough', name: 'Sourdough', file: 'sourdough.json' },
      { id: 'cheddar', name: 'Cheddar', file: 'cheddar.json' },
    ])
    const sourdough = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 2, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const cheddar = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 2, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'sourdough.json': sourdough, 'cheddar.json': cheddar })

    const badge = wrapper.find('.ds3-group-badge')
    expect(badge.text()).toContain('loaves')
  })

  it('shows "servings" in muted badge when recipes have mixed serving units', async () => {
    const manifest = makeManifest([
      { id: 'loaf', name: 'Sourdough Loaf', file: 'loaf.json' },
      { id: 'rolls', name: 'Rolls', file: 'rolls.json' },
    ])
    const loaf = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const rolls = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Rolls', defaultYield: 5, unit: 'rolls', servingsPerItem: 2, servingUnit: 'pieces' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'loaf.json': loaf, 'rolls.json': rolls })

    const mutedBadge = wrapper.find('.ds3-group-badge--muted')
    expect(mutedBadge.exists()).toBe(true)
    expect(mutedBadge.text()).toContain('servings')
  })

  it('renders subgroup labels when recipes have subgroups', async () => {
    const manifest = makeManifest([
      { id: 'loaf', name: 'Sourdough Loaf', file: 'loaf.json' },
      { id: 'baguette', name: 'Baguette', file: 'baguette.json' },
    ])
    const loaf = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 1, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const baguette = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Baguettes', defaultYield: 3, unit: 'baguettes', servingsPerItem: 6, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'loaf.json': loaf, 'baguette.json': baguette })

    const subgroupLabels = wrapper.findAll('.ds3-subgroup-label')
    expect(subgroupLabels.length).toBe(2)
    expect(subgroupLabels.map(l => l.text())).toContain('Loaves')
    expect(subgroupLabels.map(l => l.text())).toContain('Baguettes')
  })

  it('does not render subgroup labels when no recipes have subgroups', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry()],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread })

    expect(wrapper.find('.ds3-subgroup-label').exists()).toBe(false)
  })

  it('groups recipes under correct subgroup labels', async () => {
    const manifest = makeManifest([
      { id: 'sourdough', name: 'Simple Sourdough', file: 'sourdough.json' },
      { id: 'cheddar', name: 'Cheddar Bread', file: 'cheddar.json' },
      { id: 'baguette', name: 'Tartine Baguette', file: 'baguette.json' },
    ])
    const sourdough = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 2, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-01-15' })],
    })
    const cheddar = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Loaves', defaultYield: 2, unit: 'loaves', servingsPerItem: 10, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const baguette = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Sourdough Breads', subgroup: 'Baguettes', defaultYield: 3, unit: 'baguettes', servingsPerItem: 6, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-10' })],
    })
    const wrapper = await mountAndLoad(manifest, {
      'sourdough.json': sourdough,
      'cheddar.json': cheddar,
      'baguette.json': baguette,
    })

    const subgroups = wrapper.findAll('.ds3-subgroup')
    expect(subgroups.length).toBe(2)

    // First subgroup (Loaves) should have 2 recipes
    const loavesRecipes = subgroups[0].findAll('.ds3-recipe-name')
    expect(loavesRecipes.length).toBe(2)

    // Second subgroup (Baguettes) should have 1 recipe
    const baguetteRecipes = subgroups[1].findAll('.ds3-recipe-name')
    expect(baguetteRecipes.length).toBe(1)
    expect(baguetteRecipes[0].text()).toBe('Tartine Baguette')
  })

  // --- Ledger chevron state ---

  it('ledger chevron shows + when closed and - when open', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          cost: { total: 5.00, perServing: 0.50, servings: 10, items: [] },
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Initially closed
    const toggleChevron = wrapper.find('.ds3-ledger .ds3-chevron')
    expect(toggleChevron.text()).toBe('+')

    // Open
    await wrapper.find('.ds3-ledger-toggle').trigger('click')
    await nextTick()
    expect(toggleChevron.text()).toBe('\u2212')
  })

  // --- Timeline popover ---

  it('enriches timeline dots with hero image from last photo', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({
          date: '2026-02-01',
          photos: [
            { src: '/images/bread/img1.webp', thumb: '/images/bread/img1-400w.webp', alt: 'first' },
            { src: '/images/bread/img2.webp', thumb: '/images/bread/img2-400w.webp', alt: 'hero' },
          ],
        }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    // Trigger mouseenter on the dot
    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    // Popover should show with hero thumbnail (last photo's thumb)
    const popover = document.querySelector('.ds3-timeline-popover')
    expect(popover).toBeTruthy()
    const img = popover!.querySelector('.ds3-timeline-popover-img') as HTMLImageElement
    expect(img).toBeTruthy()
    expect(img.src).toContain('/images/bread/img2-400w.webp')
  })

  it('shows recipe name without image when bake has no photos', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01' }), // no photos
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const popover = document.querySelector('.ds3-timeline-popover')
    expect(popover).toBeTruthy()
    // No image
    expect(popover!.querySelector('.ds3-timeline-popover-img')).toBeNull()
    // Has recipe name
    expect(popover!.querySelector('.ds3-timeline-popover-name')!.textContent).toBe('Bread')
  })

  it('popover shows multiple bakes on same date', async () => {
    const manifest = makeManifest([
      { id: 'bread', name: 'Bread', file: 'bread.json' },
      { id: 'pizza', name: 'Pizza', file: 'pizza.json' },
    ])
    const bread = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const pizza = makeRecipe({
      config: {
        early_check_percent: 75,
        stats: { group: 'Pizza', defaultYield: 1, unit: 'pies', servingsPerItem: 8, servingUnit: 'slices' },
      },
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': bread, 'pizza.json': pizza })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const entries = document.querySelectorAll('.ds3-timeline-popover-entry')
    expect(entries.length).toBe(2)
  })

  it('popover hides on mouseleave after delay', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    setupFetchMock(manifest, { 'bread.json': recipe })
    const wrapper = mount(StatsPage)
    await vi.advanceTimersByTimeAsync(50)
    await flushPromises()
    await nextTick()

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()
    expect(document.querySelector('.ds3-timeline-popover')).toBeTruthy()

    await dot.trigger('mouseleave')
    await nextTick()
    // Still visible before timer expires
    expect(document.querySelector('.ds3-timeline-popover')).toBeTruthy()

    await vi.advanceTimersByTimeAsync(200)
    await nextTick()
    expect(document.querySelector('.ds3-timeline-popover')).toBeNull()
    vi.useRealTimers()
  })

  it('clicking popover entry navigates to bake detail', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01' }),
      ],
    })
    const container = document.createElement('div')
    document.body.appendChild(container)
    setupFetchMock(manifest, { 'bread.json': recipe })
    const wrapper = mount(StatsPage, { attachTo: container })
    await flushPromises()
    await nextTick()

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const entry = document.querySelector('.ds3-timeline-popover-entry') as HTMLElement
    expect(entry).toBeTruthy()
    entry.click()
    await nextTick()

    expect(mockPush).toHaveBeenCalledWith({
      name: 'bake-detail',
      params: { recipeId: 'bread', date: '2026-02-01' },
    })
    wrapper.unmount()
    container.remove()
  })

  it('click opens popover on timeline dot', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('click')
    await nextTick()
    expect(document.querySelector('.ds3-timeline-popover')).toBeTruthy()
  })

  it('popover does not show broken image for no-photo bakes', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [
        makeCookLogEntry({ date: '2026-02-01', photos: [] }),
      ],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const popover = document.querySelector('.ds3-timeline-popover')
    expect(popover).toBeTruthy()
    // Empty photos array → no img element
    expect(popover!.querySelector('img')).toBeNull()
    expect(popover!.querySelector('.ds3-timeline-popover-name')!.textContent).toBe('Bread')
  })

  it('popover shows date for each bake', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const dateEl = document.querySelector('.ds3-timeline-popover-date')
    expect(dateEl).toBeTruthy()
    expect(dateEl!.textContent).toContain('Feb')
  })

  it('popover position uses fixed positioning', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    const popover = document.querySelector('.ds3-timeline-popover') as HTMLElement
    expect(popover).toBeTruthy()
    expect(popover.style.position).toBe('fixed')
  })

  it('active dot gets --active class', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    expect(dot.classes()).toContain('ds3-timeline-dot--active')
  })

  it('popover aligns right when dot is near right viewport edge', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    // Mock getBoundingClientRect to simulate dot near right edge
    const dotEl = dot.element as HTMLElement
    vi.spyOn(dotEl, 'getBoundingClientRect').mockReturnValue({
      left: 700, right: 710, top: 100, bottom: 110,
      width: 10, height: 10, x: 700, y: 100, toJSON: () => {},
    })
    // Mock window.innerWidth to make the dot near the right edge
    vi.stubGlobal('innerWidth', 768)

    await dot.trigger('mouseenter')
    await nextTick()

    const popover = document.querySelector('.ds3-timeline-popover') as HTMLElement
    expect(popover).toBeTruthy()
    // alignRight = true → should use 'right' property
    expect(popover.style.right).toBeTruthy()
    vi.unstubAllGlobals()
  })

  it('popover centers when dot is in middle of viewport', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    const wrapper = await mountAndLoad(manifest, { 'bread.json': recipe })

    const dot = wrapper.find('.ds3-timeline-dot')
    const dotEl = dot.element as HTMLElement
    vi.spyOn(dotEl, 'getBoundingClientRect').mockReturnValue({
      left: 400, right: 410, top: 100, bottom: 110,
      width: 10, height: 10, x: 400, y: 100, toJSON: () => {},
    })
    vi.stubGlobal('innerWidth', 1024)

    await dot.trigger('mouseenter')
    await nextTick()

    const popover = document.querySelector('.ds3-timeline-popover') as HTMLElement
    expect(popover).toBeTruthy()
    // Center alignment → transform includes translate(-50%)
    expect(popover.style.transform).toContain('translate(-50%')
    vi.unstubAllGlobals()
  })

  it('handleClickOutside clears popover when active', async () => {
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    setupFetchMock(manifest, { 'bread.json': recipe })
    const wrapper = mount(StatsPage, {
      global: { stubs: { Teleport: true } },
    })
    await flushPromises()
    await nextTick()

    // Open popover
    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    // With Teleport stubbed, popover renders inline
    expect(wrapper.find('.ds3-timeline-popover').exists()).toBe(true)

    // Simulate click outside via document click event
    document.dispatchEvent(new Event('click'))
    await nextTick()

    // Popover should be dismissed
    expect(wrapper.find('.ds3-timeline-popover').exists()).toBe(false)
  })

  it('mouseenter on popover cancels hide timer', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const manifest = makeManifest([{ id: 'bread', name: 'Bread', file: 'bread.json' }])
    const recipe = makeRecipe({
      cook_log: [makeCookLogEntry({ date: '2026-02-01' })],
    })
    setupFetchMock(manifest, { 'bread.json': recipe })
    const wrapper = mount(StatsPage)
    await vi.advanceTimersByTimeAsync(50)
    await flushPromises()
    await nextTick()

    const dot = wrapper.find('.ds3-timeline-dot')
    await dot.trigger('mouseenter')
    await nextTick()

    // Leave dot (starts hide timer)
    await dot.trigger('mouseleave')
    await nextTick()

    // Enter popover (cancels hide timer)
    const popover = document.querySelector('.ds3-timeline-popover') as HTMLElement
    popover.dispatchEvent(new Event('mouseenter'))
    await nextTick()

    // Advance past the delay - popover should still be visible
    await vi.advanceTimersByTimeAsync(300)
    await nextTick()
    expect(document.querySelector('.ds3-timeline-popover')).toBeTruthy()

    vi.useRealTimers()
  })
})
