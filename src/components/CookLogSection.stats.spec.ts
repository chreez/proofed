import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'
import type { CookLogEntry, Recipe, RecipeStats } from '@/types/recipe'

// Mock vue-router (same shim as CookLogSection.spec.ts)
const mockPush = vi.fn()
vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// ---------------------------------------------------------------------------
// PF-41 decision A2: header mini-tile stats row
// These tests live in a separate file from CookLogSection.spec.ts so they can
// ship independently of PF-179 (which has the existing spec + snapshot stashed).
// ---------------------------------------------------------------------------

function makeStats(overrides: Partial<RecipeStats> = {}): RecipeStats {
  return {
    group: 'bread',
    defaultYield: 1,
    unit: 'loaves',
    servingsPerItem: 8,
    servingUnit: 'slices',
    ...overrides,
  }
}

function makeRecipe(
  stats: RecipeStats | undefined,
  perServingCalories: number | null = null,
): Recipe {
  return {
    meta: {} as Recipe['meta'],
    config: {
      early_check_percent: 90,
      ...(stats ? { stats } : {}),
    },
    vessels: [],
    stages: [],
    states: [],
    version: '1.0.0',
    ...(perServingCalories != null
      ? {
          nutrition: {
            servings: 8,
            calculatedDate: '2026-03-01',
            dataSource: 'test',
            totals: {
              calories: perServingCalories * 8,
              protein: 0,
              totalFat: 0,
              saturatedFat: 0,
              carbohydrates: 0,
              sugar: 0,
              fiber: 0,
              sodium: 0,
            },
            perServing: {
              calories: perServingCalories,
              protein: 0,
              totalFat: 0,
              saturatedFat: 0,
              carbohydrates: 0,
              sugar: 0,
              fiber: 0,
              sodium: 0,
            },
            breakdown: [],
          },
        }
      : {}),
  }
}

const sampleEntries: CookLogEntry[] = [
  {
    date: '2026-02-05',
    version: '1.0.0',
    notes: ['Note A'],
    status: 'complete',
  },
  {
    date: '2026-02-10',
    version: '1.0.0',
    notes: ['Note B'],
  },
]

describe('CookLogSection — header stats row (PF-41 A2)', () => {
  it('does NOT render stats row when recipe prop is absent (backward-compat)', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sampleEntries,
        sectionId: 'cook-log-section',
      },
    })
    expect(wrapper.find('.cook-log-stats').exists()).toBe(false)
  })

  it('does NOT render stats row when recipe has no stats config', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sampleEntries,
        sectionId: 'cook-log-section',
        recipe: makeRecipe(undefined),
      },
    })
    expect(wrapper.find('.cook-log-stats').exists()).toBe(false)
  })

  it('does NOT render stats row when all entries are in_progress', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          { date: '2026-02-05', version: '1.0.0', notes: [], status: 'in_progress' },
        ],
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats()),
      },
    })
    expect(wrapper.find('.cook-log-stats').exists()).toBe(false)
  })

  it('renders stats row with sessions, items, servings, calories when recipe provided', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sampleEntries,
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats({ defaultYield: 1, servingsPerItem: 8 }), 150),
      },
    })
    const row = wrapper.find('.cook-log-stats')
    expect(row.exists()).toBe(true)

    const tiles = row.findAll('.cook-log-stats-tile')
    // sessions, items, servings (>1), calories = 4 tiles
    expect(tiles).toHaveLength(4)

    const text = row.text()
    expect(text).toContain('2')          // 2 sessions
    expect(text).toContain('sessions')
    expect(text).toContain('loaves')
    expect(text).toContain('~16')        // 2 × 1 × 8 = 16 servings
    expect(text).toContain('slices')
    expect(text).toContain('2.4k')       // 16 × 150 = 2400 → 2.4k
    expect(text).toContain('calories')
  })

  it('hides the servings tile when servingsPerItem === 1 (e.g. cookies)', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sampleEntries,
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats({ defaultYield: 12, servingsPerItem: 1, unit: 'cookies', servingUnit: 'cookies' })),
      },
    })
    const tiles = wrapper.findAll('.cook-log-stats-tile')
    // sessions, items, calories (no servings) = 3 tiles (no nutrition → shows em dash)
    expect(tiles).toHaveLength(3)
    const text = wrapper.find('.cook-log-stats').text()
    expect(text).toContain('cookies')
  })

  it('shows em-dash for calories when nutrition is absent', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sampleEntries,
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats()),
      },
    })
    const text = wrapper.find('.cook-log-stats').text()
    expect(text).toContain('—')
    expect(text).toContain('calories')
  })

  it('formats calories < 1000 as plain integer', () => {
    // 1 bake × 1 item × 2 servings × 100 cal = 200 calories
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{ date: '2026-02-05', version: '1.0.0', notes: [] }],
        sectionId: 'cook-log-section',
        recipe: makeRecipe(
          makeStats({ defaultYield: 1, servingsPerItem: 2 }),
          100,
        ),
      },
    })
    const text = wrapper.find('.cook-log-stats').text()
    expect(text).toContain('200')
    expect(text).not.toContain('0.2k')
  })

  it('uses actual_yield when computing items', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-02-05',
            version: '1.0.0',
            notes: [],
            actual_yield: { value: 3, unit: 'loaves' },
          },
        ],
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats({ defaultYield: 1, servingsPerItem: 8 })),
      },
    })
    const tiles = wrapper.findAll('.cook-log-stats-tile')
    // items tile should show 3, not 1
    expect(tiles[1].text()).toContain('3')
    // servings tile should show ~24 (3 × 8)
    expect(tiles[2].text()).toContain('~24')
  })

  it('includes aberration entries in the session count', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          { date: '2026-02-05', version: '1.0.0', notes: [] },
          { date: '2026-02-06', version: '1.0.0', notes: [], aberration: true },
        ],
        sectionId: 'cook-log-section',
        recipe: makeRecipe(makeStats()),
      },
    })
    const tiles = wrapper.findAll('.cook-log-stats-tile')
    expect(tiles[0].text()).toContain('2')
  })
})
