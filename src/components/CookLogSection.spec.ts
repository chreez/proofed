import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'

// Mock vue-router
const mockPush = vi.fn()

vi.mock('vue-router', () => ({
  useRouter: () => ({
    push: mockPush
  })
}))

describe('CookLogSection', () => {
  const defaultProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note 1', 'Note 2'],
      next_time: [{ text: 'Try this next time' }]
    }],
    sectionId: 'cook-log-section'
  }

  it('renders section title', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    expect(wrapper.find('h3').text()).toBe('Cook Log')
  })

  it('renders entries with stats in card view', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // Should show note count
    expect(wrapper.text()).toContain('2 notes')
    // Should NOT show full note text (notes only on bake detail page now)
    expect(wrapper.text()).not.toContain('Note 1')
  })

  it('renders all cook log entries', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-02-05',
            version: 'v1.0.0',
            notes: ['First note'],
            next_time: []
          },
          {
            date: '2026-02-04',
            version: 'v0.9.0',
            notes: ['Second note'],
            next_time: []
          }
        ],
        sectionId: 'cook-log-section'
      }
    })

    // Both entries show version badges
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('v0.9.0')
    // Notes should NOT be visible (only on bake detail page)
    expect(wrapper.text()).not.toContain('First note')
    expect(wrapper.text()).not.toContain('Second note')
  })

  it('handles entry with empty notes array', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: [],
          next_time: [{ text: 'Try this' }]
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should show counts
    expect(wrapper.text()).toContain('0 notes')
    expect(wrapper.text()).toContain('1 next-time')
  })

  it('handles entry with undefined next_time', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['A note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should not show next-time count
    expect(wrapper.text()).not.toContain('next-time')
  })

  it('formats dates correctly', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('2026')
  })

  it('shows end date only when start_date differs from date', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v2.0.0',
          notes: ['Multi-day'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Always shows end date, never a range
    expect(wrapper.text()).toContain('2026-02-20')
    expect(wrapper.text()).not.toContain('Feb 19\u201320')
  })

  it('shows "since" in in-progress badge when start_date exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          start_date: '2026-02-19',
          version: 'v2.0.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('In Progress (since Feb 19)')
  })

  it('shows plain "In Progress" when no start_date on in-progress entry', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-20',
          version: 'v2.0.0',
          status: 'in_progress' as const,
          notes: ['In progress bake'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('In Progress')
    expect(wrapper.text()).not.toContain('since')
  })

  it('shows standard date when start_date is absent', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: []
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should show full date with weekday, not range
    expect(wrapper.text()).toContain('2026-02-05')
  })

  it('shows summary text when present', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'First bake went great. Dough was perfect.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('First bake went great')
  })

  it('renders gracefully when summary is missing (AC#6)', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1', 'Note 2']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Should still show date + version + counts without summary
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('2 notes')
  })

  it('assigns bake permalink IDs to entries', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.find('#bake-2026-02-05').exists()).toBe(true)
  })

  it('shows no thumbnail when entry has no photos', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          summary: 'A summary.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    // No thumbnail — card without photo
    expect(wrapper.find('.w-20').exists()).toBe(false)
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('A summary.')
    expect(wrapper.text()).toContain('1 notes')
  })

  it('hides next_time count when not present', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('next-time')
  })

  it('copies section permalink when header link button is clicked', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    // Click the button inside the IconButton component
    const iconBtn = wrapper.findComponent({ name: 'IconButton' })
    await iconBtn.find('button').trigger('click')

    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('#cook-log-section')
    )
  })

  it('shows summary with photo banner', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'Great bake this time.',
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('Great bake this time.')
  })

  it('shows next_time count with photos', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          next_time: [{ text: 'Try X' }, { text: 'Try Y' }],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ]
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('2 next-time')
  })
})

describe('Summary expand', () => {
  it('summary starts with line-clamp-2 class', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    expect(summary.classes()).toContain('line-clamp-2')
  })

  it('removes line-clamp-2 when summary is clicked', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    await summary.trigger('click')

    expect(summary.classes()).not.toContain('line-clamp-2')
  })

  it('re-applies line-clamp-2 on second click', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A long summary that could be truncated.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    await summary.trigger('click')
    await summary.trigger('click')

    expect(summary.classes()).toContain('line-clamp-2')
  })

  it('summary has cursor-pointer class', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          summary: 'A summary.'
        }],
        sectionId: 'cook-log-section'
      }
    })

    const summary = wrapper.find('.text-sm.text-stone-500')
    expect(summary.classes()).toContain('cursor-pointer')
  })
})

describe('Bake detail link', () => {
  it('shows "View bake" link when recipeId is provided', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section',
        recipeId: 'test-recipe'
      }
    })

    expect(wrapper.text()).toContain('View bake')
  })

  it('does not show "View bake" link when recipeId is not provided', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('View bake')
  })

  it('navigates to bake detail page when "View bake" is clicked', async () => {
    mockPush.mockClear()

    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section',
        recipeId: 'test-recipe'
      }
    })

    const viewBakeLink = wrapper.find('.ml-auto.flex.items-center')
    await viewBakeLink.trigger('click')

    expect(mockPush).toHaveBeenCalledWith('/recipe/test-recipe/bake/2026-02-05')
  })
})

describe('Photo thumbnail', () => {
  const photosProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note'],
      photos: [
        { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'Photo A' },
        { src: '/img/b-800.webp', thumb: '/img/b-400.webp', alt: 'Photo B' },
        { src: '/img/c-800.webp', thumb: '/img/c-400.webp', alt: 'Photo C' }
      ]
    }],
    sectionId: 'cook-log-section'
  }

  it('shows hero thumbnail when entry has photos', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    // Hero is last photo (Photo C) shown as small thumbnail
    const thumbImg = wrapper.find('.w-20')
    expect(thumbImg.exists()).toBe(true)
    expect(thumbImg.attributes('alt')).toBe('Photo C')
  })

  it('shows photo count', () => {
    const wrapper = mount(CookLogSection, { props: photosProps })
    expect(wrapper.text()).toContain('3 photos')
  })
})

describe('Cost one-liner', () => {
  const costData = {
    total: 1.29,
    perServing: 1.29,
    servings: 1,
    items: [
      { ingredientId: 'flour', name: 'Flour', sourceType: 'heb' as const, sourceName: 'KA', amount: 500, unit: 'g', cost: 1.23 }
    ]
  }

  it('shows cost one-liner when entry.cost exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          cost: costData
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('$1.29 total')
    expect(wrapper.text()).toContain('$1.29/serving')
  })

  it('shows cost one-liner with photo card when entry.cost exists', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note'],
          photos: [
            { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'A' }
          ],
          cost: costData
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('$1.29 total')
    expect(wrapper.text()).toContain('$1.29/serving')
  })

  it('hides cost line when no cost data', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note']
        }],
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).not.toContain('total')
    expect(wrapper.text()).not.toContain('/serving')
  })
})

describe('Collapse when > 4 entries', () => {
  function makeEntry(date: string, version: string) {
    return {
      date,
      version,
      notes: ['Note'],
      next_time: []
    }
  }

  const sixEntries = [
    makeEntry('2026-02-06', 'v1.0.5'),
    makeEntry('2026-02-05', 'v1.0.4'),
    makeEntry('2026-02-04', 'v1.0.3'),
    makeEntry('2026-02-03', 'v1.0.2'),
    makeEntry('2026-02-02', 'v1.0.1'),
    makeEntry('2026-02-01', 'v1.0.0')
  ]

  it('renders all entries when count <= 4 (no button)', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sixEntries.slice(0, 4),
        sectionId: 'cook-log-section'
      }
    })

    // All 4 entries rendered
    expect(wrapper.findAll('[id^="bake-"]').length).toBe(4)
    // No show-more button
    expect(wrapper.text()).not.toContain('Show')
  })

  it('renders only newest 4 when count > 4 and shows expand button', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sixEntries,
        sectionId: 'cook-log-section'
      }
    })

    // Only 4 entries rendered
    const renderedIds = wrapper.findAll('[id^="bake-"]').map(e => e.attributes('id'))
    expect(renderedIds.length).toBe(4)
    // Newest 4 should be the first 4 sorted dates
    expect(renderedIds).toEqual([
      'bake-2026-02-06',
      'bake-2026-02-05',
      'bake-2026-02-04',
      'bake-2026-02-03'
    ])
    // Older entries NOT rendered
    expect(renderedIds).not.toContain('bake-2026-02-02')
    expect(renderedIds).not.toContain('bake-2026-02-01')
    // Button shows exact hidden count and uses plural "bakes"
    expect(wrapper.text()).toContain('Show 2 more bakes')
  })

  it('uses singular "bake" when exactly 1 entry is hidden', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sixEntries.slice(0, 5),
        sectionId: 'cook-log-section'
      }
    })

    expect(wrapper.text()).toContain('Show 1 more bake')
    expect(wrapper.text()).not.toContain('Show 1 more bakes')
  })

  it('expands to show all entries when button is clicked (one-way)', async () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: sixEntries,
        sectionId: 'cook-log-section'
      }
    })

    // Before click: 4 visible
    expect(wrapper.findAll('[id^="bake-"]').length).toBe(4)

    const button = wrapper.find('[data-testid="cook-log-expand-button"]')
    expect(button.exists()).toBe(true)
    await button.trigger('click')

    // After click: all 6 visible
    expect(wrapper.findAll('[id^="bake-"]').length).toBe(6)
    // Button removed (one-way)
    expect(wrapper.find('[data-testid="cook-log-expand-button"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Show')
  })

  it('sort order matches sortedCookLog (newest-first) in both collapsed and expanded states', async () => {
    // Intentionally provide entries out of order
    const outOfOrder = [
      makeEntry('2026-02-01', 'v1.0.0'),
      makeEntry('2026-02-06', 'v1.0.5'),
      makeEntry('2026-02-03', 'v1.0.2'),
      makeEntry('2026-02-05', 'v1.0.4'),
      makeEntry('2026-02-02', 'v1.0.1'),
      makeEntry('2026-02-04', 'v1.0.3')
    ]
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: outOfOrder,
        sectionId: 'cook-log-section'
      }
    })

    // Collapsed: newest 4 in sorted order
    let ids = wrapper.findAll('[id^="bake-"]').map(e => e.attributes('id'))
    expect(ids).toEqual([
      'bake-2026-02-06',
      'bake-2026-02-05',
      'bake-2026-02-04',
      'bake-2026-02-03'
    ])

    // Expand
    await wrapper.find('[data-testid="cook-log-expand-button"]').trigger('click')

    // Expanded: all 6 in sorted order
    ids = wrapper.findAll('[id^="bake-"]').map(e => e.attributes('id'))
    expect(ids).toEqual([
      'bake-2026-02-06',
      'bake-2026-02-05',
      'bake-2026-02-04',
      'bake-2026-02-03',
      'bake-2026-02-02',
      'bake-2026-02-01'
    ])
  })
})

// ============================================================
// PF-177.9 v2 — Compact bake stats (post HITL iteration)
// Covers variant switcher + derivation helpers + variant render blocks.
// ============================================================
describe('Compact bake stats (PF-177.9 v2)', () => {
  // Per-suite localStorage mock. Other specs in the project stub globalThis
  // with a custom mock that can lack .clear() depending on run order — so we
  // install a clean mock here and reset the backing store before each test.
  let store: Record<string, string> = {}
  const lsMock = {
    getItem: vi.fn((key: string) => (key in store ? store[key] : null)),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null)
  }

  beforeEach(() => {
    store = {}
    Object.defineProperty(globalThis, 'localStorage', {
      value: lsMock,
      writable: true,
      configurable: true
    })
  })

  // Full bake_stats fixture mirroring a real overnight sourdough bake.
  // bulk = 4h 20m (15:00 → 19:20), avg dough 76.0°F
  // proof = 19h 30m (15:00 → next day 10:30 oven entry)
  // bake = 42m (20 covered + 22 uncovered)
  const fullStats = {
    dough_temps: [
      { time: '2026-04-04 - 15:00', temp_f: 76 },
      { time: '2026-04-04 - 16:00', temp_f: 76 },
      { time: '2026-04-04 - 17:00', temp_f: 76 },
      { time: '2026-04-04 - 19:20', temp_f: 76 }
    ],
    aliquot_rises: [
      { time: '2026-04-04 - 19:30', rise_pct: 40, stage: 'bulk' as const },
      { time: '2026-04-05 - 09:30', rise_pct: 80, stage: 'final' as const }
    ],
    bake_phases: [
      { stage: 'preheat' as const, start_time: '2026-04-05 - 09:45', temp_f: 550, duration_min: 45 },
      { stage: 'covered' as const, start_time: '2026-04-05 - 10:30', temp_f: 550, duration_min: 20 },
      { stage: 'uncovered' as const, start_time: '2026-04-05 - 10:50', temp_f: 500, duration_min: 22 }
    ]
  }

  // Overproof / multi-day bake mirroring 2026-04-06 narrative.
  // proof should render as "Xd Yh" when ≥ 24h.
  const overproofStats = {
    dough_temps: [
      { time: '2026-04-04 - 16:00', temp_f: 75 },
      { time: '2026-04-04 - 18:00', temp_f: 76 }
    ],
    aliquot_rises: [
      { time: '2026-04-04 - 19:00', rise_pct: 40, stage: 'bulk' as const },
      { time: '2026-04-05 - 12:00', rise_pct: 100, stage: 'preshape' as const }
    ],
    bake_phases: [
      { stage: 'preheat' as const, start_time: '2026-04-06 - 13:00', temp_f: 550, duration_min: 45 },
      { stage: 'covered' as const, start_time: '2026-04-06 - 13:45', temp_f: 550, duration_min: 20 },
      { stage: 'uncovered' as const, start_time: '2026-04-06 - 14:05', temp_f: 550, duration_min: 22 }
    ]
  }

  // Sparse stats (only one dough_temp, no aliquot_rises). bulk pill should
  // show em-dash, proof should still derive, bake tooltip should skip any
  // missing phase temps.
  const sparseStats = {
    dough_temps: [
      { time: '2026-03-23 - 15:00', temp_f: 78 }
    ],
    bake_phases: [
      { stage: 'preheat' as const, start_time: '2026-03-24 - 10:00', temp_f: 550, duration_min: 45 },
      { stage: 'uncovered' as const, start_time: '2026-03-24 - 10:45', temp_f: 450, duration_min: 40 }
    ]
  }

  // Empty bake_stats — exercises the `compactViewOf(undefined)` / empty
  // arrays branches. Block should still render but with em-dash values.
  const emptyStats = {}

  function mountWithStats(
    stats: typeof fullStats | typeof overproofStats | typeof sparseStats | typeof emptyStats
  ) {
    return mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-04-05',
            version: 'v1.0.0',
            notes: ['Note'],
            bake_stats: stats as never
          }
        ],
        sectionId: 'cook-log-section'
      }
    })
  }

  it('renders variant switcher when any entry has bake_stats', () => {
    const wrapper = mountWithStats(fullStats)
    expect(wrapper.find('[data-testid="compact-variant-switch"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('COMPACT FORM:')
    // All three variant buttons are present
    expect(wrapper.find('[data-variant="A"]').exists()).toBe(true)
    expect(wrapper.find('[data-variant="B"]').exists()).toBe(true)
    expect(wrapper.find('[data-variant="C"]').exists()).toBe(true)
  })

  it('hides variant switcher when no entry has bake_stats', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{ date: '2026-02-05', version: 'v1.0.0', notes: ['n'] }],
        sectionId: 'cook-log-section'
      }
    })
    expect(wrapper.find('[data-testid="compact-variant-switch"]').exists()).toBe(false)
  })

  it('defaults to Variant A and renders tiles row with bulk/proof/bake labels', () => {
    const wrapper = mountWithStats(fullStats)
    expect(wrapper.find('[data-testid="compact-variant-a"]').exists()).toBe(true)
    const text = wrapper.text()
    expect(text).toContain('bulk')
    expect(text).toContain('proof')
    expect(text).toContain('bake')
  })

  it('Variant A tiles include 3 tiles (not 4) — no peak rise or bulk ambient', () => {
    const wrapper = mountWithStats(fullStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles.length).toBe(3)
    const text = wrapper.text()
    // Killed stats per HITL feedback
    expect(text).not.toContain('peak rise')
    expect(text).not.toContain('bulk ambient')
    expect(text).not.toContain('bulk amb')
  })

  it('Variant A renders computed bulk duration and bake total', () => {
    const wrapper = mountWithStats(fullStats)
    const text = wrapper.text()
    // bulk window: 15:00 → 19:30 (first bulk aliquot_rise is later than
    // the last dough_temp at 19:20, so it extends the window).
    expect(text).toContain('4h 30m')
    // bake total: 20 + 22 = 42m
    expect(text).toContain('42m')
  })

  it('Variant A renders multi-day proof as "Xd Yh"', () => {
    const wrapper = mountWithStats(overproofStats)
    const text = wrapper.text()
    // proof: 2026-04-04 16:00 → 2026-04-06 13:45 = 45h 45m = 1d 21h
    expect(text).toContain('1d 21h')
  })

  it('Variant A bulk tile has avg dough temp tooltip', () => {
    const wrapper = mountWithStats(fullStats)
    const tile = wrapper.find('[data-testid="compact-variant-a"] .cf-tile')
    const tooltip = tile.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    // avg of 76,76,76,76 = 76.0°F
    expect(tooltip.text()).toContain('avg dough:')
    expect(tooltip.text()).toContain('76.0°F')
  })

  it('Variant A bake tile has preheat/covered/uncovered temp tooltip (no durations)', () => {
    const wrapper = mountWithStats(fullStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const bakeTile = tiles[tiles.length - 1]
    const tooltip = bakeTile.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    const tt = tooltip.text()
    expect(tt).toContain('preheat 550°F')
    expect(tt).toContain('covered 550°F')
    expect(tt).toContain('uncovered 500°F')
    // Must NOT include durations in the tooltip
    expect(tt).not.toContain('20m')
    expect(tt).not.toContain('22m')
  })

  it('Variant A proof tile shows bulk/retard/final breakdown tooltip when data supports it', () => {
    const wrapper = mountWithStats(fullStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const proofTile = tiles[1]
    const tooltip = proofTile.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    const tt = tooltip.text()
    expect(tt).toContain('bulk')
    expect(tt).toContain('retard')
    expect(tt).toContain('final')
  })

  it('switches to Variant B and renders pills with bulk/proof/bake', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="B"]').trigger('click')
    expect(wrapper.find('[data-testid="compact-variant-b"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="compact-variant-a"]').exists()).toBe(false)
    const pills = wrapper.findAll('[data-testid="compact-variant-b"] .cf-pill')
    expect(pills.length).toBe(3)
  })

  it('Variant B pills include the redefined bake total 42m and proof time', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="B"]').trigger('click')
    const text = wrapper.text()
    expect(text).toContain('42m')
    expect(text).toContain('19h 30m')
  })

  it('switches to Variant C and renders 1x3 mini table', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="C"]').trigger('click')
    expect(wrapper.find('[data-testid="compact-variant-c"]').exists()).toBe(true)
    const rows = wrapper.findAll('[data-testid="compact-variant-c"] .cf-row')
    expect(rows.length).toBe(3)
    const text = wrapper.text()
    expect(text).toContain('bulk')
    expect(text).toContain('proof')
    expect(text).toContain('bake')
  })

  it('persists variant choice in localStorage', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="B"]').trigger('click')
    expect(localStorage.getItem('proofed:compact-variant')).toBe('B')
    await wrapper.find('[data-variant="C"]').trigger('click')
    expect(localStorage.getItem('proofed:compact-variant')).toBe('C')
  })

  it('restores variant choice from localStorage on mount', async () => {
    localStorage.setItem('proofed:compact-variant', 'B')
    const wrapper = mountWithStats(fullStats)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="compact-variant-b"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="compact-variant-a"]').exists()).toBe(false)
  })

  it('ignores invalid localStorage values', () => {
    localStorage.setItem('proofed:compact-variant', 'Z')
    const wrapper = mountWithStats(fullStats)
    // Falls back to default Variant A
    expect(wrapper.find('[data-testid="compact-variant-a"]').exists()).toBe(true)
  })

  it('renders em-dash for bulk pill when only one dough_temp exists', () => {
    const wrapper = mountWithStats(sparseStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    // First tile is bulk — value should be em-dash but tooltip should still exist
    const bulkValue = tiles[0].find('.cf-tile-value')
    expect(bulkValue.text()).toBe('—')
    const tooltip = tiles[0].find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('78.0°F')
  })

  it('bake tile tooltip on sparse stats skips missing "covered" phase', () => {
    const wrapper = mountWithStats(sparseStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const bakeTile = tiles[2]
    const tt = bakeTile.find('.bundle-tooltip').text()
    expect(tt).toContain('preheat 550°F')
    expect(tt).toContain('uncovered 450°F')
    expect(tt).not.toContain('covered 550')
  })

  it('bake total on sparse stats is just uncovered (no covered phase)', () => {
    const wrapper = mountWithStats(sparseStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const bakeValue = tiles[2].find('.cf-tile-value')
    expect(bakeValue.text()).toBe('40m')
  })

  it('renders all em-dash values for empty bake_stats block', () => {
    const wrapper = mountWithStats(emptyStats)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles.length).toBe(3)
    for (const t of tiles) {
      expect(t.find('.cf-tile-value').text()).toBe('—')
    }
  })

  it('Variant B bulk pill exposes avg dough tooltip on hover target', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="B"]').trigger('click')
    const pills = wrapper.findAll('[data-testid="compact-variant-b"] .cf-pill')
    const bulkPill = pills[0]
    expect(bulkPill.classes()).toContain('bundle-host')
    const tooltip = bulkPill.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('avg dough:')
  })

  it('Variant C bake row exposes temp-only tooltip', async () => {
    const wrapper = mountWithStats(fullStats)
    await wrapper.find('[data-variant="C"]').trigger('click')
    const rows = wrapper.findAll('[data-testid="compact-variant-c"] .cf-row')
    const bakeRow = rows[2]
    expect(bakeRow.classes()).toContain('bundle-host')
    const tooltip = bakeRow.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('preheat')
  })

  // ----------------------------------------------------------------
  // PF-177.9 v4 — Low-confidence falls back to recipe defaults
  // ----------------------------------------------------------------
  //
  // v3 behavior: low-conf entries showed stored guesstimate values with
  // grey opacity + `(low confidence)` tooltip suffix.
  //
  // v4 behavior: low-conf entries mean data was NOT DIRECTLY LOGGED by
  // the user. The UI falls back to `recipe.bake_defaults.bake_phases`
  // for the bake pill and displays `—` for bulk/proof. Stored bake_stats
  // data is preserved in JSON for future audit but not shown.

  // Low-confidence fixture mirrors 2026-04-06 — stored stats are the
  // v3 guesstimate temps (preheat 550 / covered 500 / uncovered 450).
  // These values are PRESERVED in the fixture but the v4 UI must NOT
  // display them — it should show recipe defaults instead.
  const lowConfidenceStats = {
    dough_temps: [
      { time: '2026-04-04 - 16:00', temp_f: 75 },
      { time: '2026-04-04 - 18:00', temp_f: 76 }
    ],
    aliquot_rises: [
      { time: '2026-04-04 - 19:00', rise_pct: 40, stage: 'bulk' as const },
      { time: '2026-04-05 - 12:00', rise_pct: 100, stage: 'preshape' as const }
    ],
    bake_phases: [
      { stage: 'preheat' as const, start_time: '2026-04-06 - 13:00', temp_f: 550, duration_min: 45 },
      { stage: 'covered' as const, start_time: '2026-04-06 - 13:45', temp_f: 500, duration_min: 20 },
      { stage: 'uncovered' as const, start_time: '2026-04-06 - 14:05', temp_f: 450, duration_min: 22 }
    ],
    confidence: 'low' as const
  }

  // Recipe stub with bake_defaults (mirrors simple-sourdough.json v4 values).
  // Only the fields CookLogSection actually reads need to be populated.
  const recipeWithDefaults = {
    bake_defaults: {
      bake_phases: [
        { stage: 'preheat' as const, temp_f: 500, duration_min: 45 },
        { stage: 'covered' as const, temp_f: 450, duration_min: 20 },
        { stage: 'uncovered' as const, temp_f: 425, duration_min: 20 }
      ]
    }
  }

  // Recipe stub WITHOUT bake_defaults — defensive fallback case.
  const recipeWithoutDefaults = {}

  function mountWithStatsAndRecipe(
    stats: typeof lowConfidenceStats | typeof fullStats,
    recipe: typeof recipeWithDefaults | typeof recipeWithoutDefaults | undefined
  ) {
    return mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-04-06',
            version: 'v3.0.0',
            notes: ['Note'],
            bake_stats: stats as never
          }
        ],
        sectionId: 'cook-log-section',
        recipe: recipe as never
      }
    })
  }

  it('v4: low-conf bulk tile gets cf-low-confidence class (not directly logged)', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles[0].classes()).toContain('cf-low-confidence')
  })

  it('v4: low-conf proof tile gets cf-low-confidence class (not directly logged)', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles[1].classes()).toContain('cf-low-confidence')
  })

  it('v4: low-conf bake tile ALSO gets cf-low-confidence (showing recipe baseline, still not user-logged)', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles[2].classes()).toContain('cf-low-confidence')
  })

  it('v4: low-conf bulk tile renders "—" and "not directly logged" tooltip', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const bulkTile = tiles[0]
    expect(bulkTile.find('.cf-tile-value').text()).toBe('—')
    const tooltip = bulkTile.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('not directly logged')
    // avg dough must NOT appear (we're not displaying guesstimate data)
    expect(tooltip.text()).not.toContain('avg dough:')
  })

  it('v4: low-conf proof tile renders "—" and "not directly logged" tooltip', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const proofTile = tiles[1]
    expect(proofTile.find('.cf-tile-value').text()).toBe('—')
    const tooltip = proofTile.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('not directly logged')
  })

  it('v4: low-conf bake tile shows RECIPE DEFAULT temps, not stored guesstimates', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    const tooltip = tiles[2].find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    const tt = tooltip.text()
    // Recipe defaults: preheat 500°F, covered 450°F, uncovered 425°F
    expect(tt).toContain('preheat 500°F')
    expect(tt).toContain('covered 450°F')
    expect(tt).toContain('uncovered 425°F')
    // Tooltip indicates these are baseline values, not user-logged
    expect(tt).toContain('(recipe baseline)')
    // Must NOT contain the stored guesstimate values
    // Stored values were: preheat 550 / covered 500 / uncovered 450
    expect(tt).not.toContain('preheat 550°F')
    expect(tt).not.toContain('covered 500°F')
    expect(tt).not.toContain('uncovered 450°F')
  })

  it('v4: low-conf bake tile value uses recipe default durations (covered + uncovered)', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    // Recipe defaults: covered 20m + uncovered 20m = 40m
    expect(tiles[2].find('.cf-tile-value').text()).toBe('40m')
  })

  it('v4: low-conf falls back to "—" when recipe has no bake_defaults', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithoutDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    // All three tiles should show em-dash — no fallback available
    expect(tiles[0].find('.cf-tile-value').text()).toBe('—')
    expect(tiles[1].find('.cf-tile-value').text()).toBe('—')
    expect(tiles[2].find('.cf-tile-value').text()).toBe('—')
    // Badge still renders (entry is still flagged as not directly logged)
    expect(wrapper.find('[data-testid="compact-low-confidence-badge"]').exists()).toBe(true)
  })

  it('v4: low-conf falls back to "—" when no recipe prop is passed at all', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, undefined)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    expect(tiles[0].find('.cf-tile-value').text()).toBe('—')
    expect(tiles[1].find('.cf-tile-value').text()).toBe('—')
    expect(tiles[2].find('.cf-tile-value').text()).toBe('—')
  })

  it('v4: entries with undefined confidence render normally (no fallback applied)', () => {
    // fullStats has no `confidence` field — UI should use its own bake_stats
    // even when the recipe has bake_defaults.
    const wrapper = mountWithStatsAndRecipe(fullStats, recipeWithDefaults)
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    for (const tile of tiles) {
      expect(tile.classes()).not.toContain('cf-low-confidence')
    }
    // Uses entry's own bake total (42m), not recipe default (40m)
    expect(tiles[2].find('.cf-tile-value').text()).toBe('42m')
    // Uses entry's own stored temps (preheat 550 / covered 550 / uncovered 500)
    const tt = tiles[2].find('.bundle-tooltip').text()
    expect(tt).toContain('preheat 550°F')
    expect(tt).toContain('covered 550°F')
    expect(tt).toContain('uncovered 500°F')
    // No baseline marker
    expect(tt).not.toContain('(recipe baseline)')
    // Badge absent
    expect(wrapper.find('[data-testid="compact-low-confidence-badge"]').exists()).toBe(false)
  })

  it('v4: explicit confidence "high" renders normally even if recipe has bake_defaults', () => {
    const wrapper = mountWithStatsAndRecipe(
      { ...fullStats, confidence: 'high' as const } as never,
      recipeWithDefaults
    )
    const tiles = wrapper.findAll('[data-testid="compact-variant-a"] .cf-tile')
    for (const tile of tiles) {
      expect(tile.classes()).not.toContain('cf-low-confidence')
    }
    // Uses entry's own bake total (42m), not recipe default
    expect(tiles[2].find('.cf-tile-value').text()).toBe('42m')
    // Badge absent
    expect(wrapper.find('[data-testid="compact-low-confidence-badge"]').exists()).toBe(false)
  })

  it('v4: badge text renders as "not directly logged" with baseline tooltip', () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)
    const badge = wrapper.find('[data-testid="compact-low-confidence-badge"]')
    expect(badge.exists()).toBe(true)
    expect(badge.text()).toContain('not directly logged')
    // Old "low confidence" text should be gone
    expect(badge.text()).not.toContain('low confidence')
    const tooltip = badge.find('.bundle-tooltip')
    expect(tooltip.exists()).toBe(true)
    expect(tooltip.text()).toContain('Data was not directly logged')
    expect(tooltip.text()).toContain('Bake phases show recipe baseline')
    expect(tooltip.text()).toContain('Bulk and proof are not available')
  })

  it('v4: low-confidence treatment carries across variants B and C with recipe defaults', async () => {
    const wrapper = mountWithStatsAndRecipe(lowConfidenceStats, recipeWithDefaults)

    // Variant B pills
    await wrapper.find('[data-variant="B"]').trigger('click')
    const pills = wrapper.findAll('[data-testid="compact-variant-b"] .cf-pill')
    expect(pills[0].classes()).toContain('cf-low-confidence') // bulk greyed
    expect(pills[1].classes()).toContain('cf-low-confidence') // proof greyed
    expect(pills[2].classes()).toContain('cf-low-confidence') // bake greyed (recipe baseline)
    expect(pills[0].find('.bundle-tooltip').text()).toContain('not directly logged')
    const bakePillTt = pills[2].find('.bundle-tooltip').text()
    expect(bakePillTt).toContain('(recipe baseline)')
    expect(bakePillTt).toContain('preheat 500°F')
    // Badge still present on variant B
    expect(wrapper.find('[data-testid="compact-low-confidence-badge"]').exists()).toBe(true)

    // Variant C rows
    await wrapper.find('[data-variant="C"]').trigger('click')
    const rows = wrapper.findAll('[data-testid="compact-variant-c"] .cf-row')
    expect(rows[0].classes()).toContain('cf-low-confidence')
    expect(rows[1].classes()).toContain('cf-low-confidence')
    expect(rows[2].classes()).toContain('cf-low-confidence')
    expect(rows[0].find('.bundle-tooltip').text()).toContain('not directly logged')
    const bakeRowTt = rows[2].find('.bundle-tooltip').text()
    expect(bakeRowTt).toContain('(recipe baseline)')
    expect(bakeRowTt).toContain('covered 450°F')
    // Badge still present on variant C
    expect(wrapper.find('[data-testid="compact-low-confidence-badge"]').exists()).toBe(true)
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1', 'Note 2'],
          next_time: [{ text: 'Try this next time' }]
        }],
        sectionId: 'cook-log-section'
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches collapsed snapshot (6 entries, newest 4 visible + button)', () => {
    const entries = [
      { date: '2026-02-06', version: 'v1.0.5', notes: ['n'], next_time: [] },
      { date: '2026-02-05', version: 'v1.0.4', notes: ['n'], next_time: [] },
      { date: '2026-02-04', version: 'v1.0.3', notes: ['n'], next_time: [] },
      { date: '2026-02-03', version: 'v1.0.2', notes: ['n'], next_time: [] },
      { date: '2026-02-02', version: 'v1.0.1', notes: ['n'], next_time: [] },
      { date: '2026-02-01', version: 'v1.0.0', notes: ['n'], next_time: [] }
    ]
    const wrapper = mount(CookLogSection, {
      props: { cookLog: entries, sectionId: 'cook-log-section' }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches expanded snapshot (6 entries, all visible, no button)', async () => {
    const entries = [
      { date: '2026-02-06', version: 'v1.0.5', notes: ['n'], next_time: [] },
      { date: '2026-02-05', version: 'v1.0.4', notes: ['n'], next_time: [] },
      { date: '2026-02-04', version: 'v1.0.3', notes: ['n'], next_time: [] },
      { date: '2026-02-03', version: 'v1.0.2', notes: ['n'], next_time: [] },
      { date: '2026-02-02', version: 'v1.0.1', notes: ['n'], next_time: [] },
      { date: '2026-02-01', version: 'v1.0.0', notes: ['n'], next_time: [] }
    ]
    const wrapper = mount(CookLogSection, {
      props: { cookLog: entries, sectionId: 'cook-log-section' }
    })
    await wrapper.find('[data-testid="cook-log-expand-button"]').trigger('click')
    expect(wrapper.html()).toMatchSnapshot()
  })
})
