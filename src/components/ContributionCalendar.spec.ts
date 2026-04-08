import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ContributionCalendar from './ContributionCalendar.vue'
import type { CalendarBakeInfo } from './ContributionCalendar.vue'

// Fixed reference date so the rolling 12-month window stays stable across runs.
const FIXED_END = new Date(2026, 3, 8) // 2026-04-08 (local time)

function bake(date: string, name = 'Test Recipe'): CalendarBakeInfo {
  return {
    recipeId: 'test',
    recipeName: name,
    heroThumb: null,
    date,
  }
}

function makeBakeMap(entries: { date: string; bakes?: CalendarBakeInfo[] }[]): Map<string, CalendarBakeInfo[]> {
  const map = new Map<string, CalendarBakeInfo[]>()
  for (const e of entries) {
    map.set(e.date, e.bakes ?? [bake(e.date)])
  }
  return map
}

describe('ContributionCalendar', () => {
  it('renders 53 week columns × 7 day rows of cells', () => {
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap: new Map(),
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const cells = wrapper.findAll('.cal-cell')
    expect(cells.length).toBe(53 * 7)
  })

  it('marks bake dates with --bake fill class', () => {
    const bakeMap = makeBakeMap([
      { date: '2026-04-01' },
      { date: '2026-03-15' },
      { date: '2026-02-10' },
    ])
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const bakeCells = wrapper.findAll('.cal-cell--bake')
    expect(bakeCells.length).toBe(3)
  })

  it('marks aberration-only dates with --aberration fill class', () => {
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap: new Map(),
        aberrationDates: new Set(['2026-04-01']),
        endDate: FIXED_END,
      },
    })

    const aberrationCells = wrapper.findAll('.cal-cell--aberration')
    expect(aberrationCells.length).toBe(1)
  })

  it('mixed days (bake + aberration on same date) render as bake (accent wins)', () => {
    const bakeMap = makeBakeMap([{ date: '2026-04-01' }])
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates: new Set(['2026-04-01']),
        endDate: FIXED_END,
      },
    })

    const bakeCells = wrapper.findAll('.cal-cell--bake')
    const aberrationCells = wrapper.findAll('.cal-cell--aberration')
    expect(bakeCells.length).toBe(1)
    expect(aberrationCells.length).toBe(0)
  })

  it('emits cellHover when hovering a cell with bakes', async () => {
    const bakeMap = makeBakeMap([{ date: '2026-04-01' }])
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const cell = wrapper.find('.cal-cell--bake')
    await cell.trigger('mouseenter')

    const hoverEvents = wrapper.emitted('cellHover')
    expect(hoverEvents).toBeTruthy()
    expect(hoverEvents?.length).toBe(1)
    const [day] = hoverEvents![0] as [{ date: string; bakes: CalendarBakeInfo[]; isAberration: boolean }]
    expect(day.date).toBe('2026-04-01')
    expect(day.bakes.length).toBe(1)
    expect(day.isAberration).toBe(false)
  })

  it('emits cellClick when clicking a cell with bakes', async () => {
    const bakeMap = makeBakeMap([{ date: '2026-04-01' }])
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const cell = wrapper.find('.cal-cell--bake')
    await cell.trigger('click')

    const clickEvents = wrapper.emitted('cellClick')
    expect(clickEvents).toBeTruthy()
    expect(clickEvents?.length).toBe(1)
  })

  it('does NOT emit cellHover for empty cells', async () => {
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap: new Map(),
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const emptyCell = wrapper.find('.cal-cell--empty')
    await emptyCell.trigger('mouseenter')

    expect(wrapper.emitted('cellHover')).toBeUndefined()
  })

  it('renders aria-label with bake day count', () => {
    const bakeMap = makeBakeMap([
      { date: '2026-04-01' },
      { date: '2026-03-15' },
    ])
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const svg = wrapper.find('svg')
    expect(svg.attributes('aria-label')).toContain('2 bake days')
  })

  it('renders weekday labels (Mon, Wed, Fri)', () => {
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap: new Map(),
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const html = wrapper.html()
    expect(html).toContain('Mon')
    expect(html).toContain('Wed')
    expect(html).toContain('Fri')
  })

  it('renders month labels along the top', () => {
    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap: new Map(),
        aberrationDates: new Set(),
        endDate: FIXED_END,
      },
    })

    const monthLabels = wrapper.findAll('.cal-month')
    // Rolling 12-month window includes ~12-13 month boundaries
    expect(monthLabels.length).toBeGreaterThanOrEqual(12)
    expect(monthLabels.length).toBeLessThanOrEqual(13)
  })
})

describe('ContributionCalendar HTML snapshot', () => {
  it('matches snapshot with mixed bake / aberration / empty cells', () => {
    const bakeMap = makeBakeMap([
      { date: '2026-04-01' },
      { date: '2026-03-15' },
      { date: '2026-02-10' },
      { date: '2025-12-01' },
    ])
    const aberrationDates = new Set(['2026-03-20', '2026-01-15'])

    const wrapper = mount(ContributionCalendar, {
      props: {
        bakeMap,
        aberrationDates,
        endDate: FIXED_END,
      },
    })

    expect(wrapper.html()).toMatchSnapshot()
  })
})
