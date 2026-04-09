import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import BakeStatsBlock from './BakeStatsBlock.vue'
import type {
  BakeStatsBlock as BakeStatsBlockData,
  RecipeBakeDefaults
} from '@/types/recipe'

// ---------------------------------------------------------------------------
// PF-177.5 — BakeStatsBlock tests
//
// Covers the three main rendering modes required by AC #15:
//   1. Full-data high-confidence bake → all 6 sections visible
//   2. Partial-data medium-confidence bake → progressive render (only the
//      sections whose source data is present)
//   3. Low-confidence fallback → callout + bake phases from recipe defaults
//
// Plus a handful of behavioral tests for the header pills, day-break
// de-duplication, and empty-notes edge case.
//
// The raw notes disclosure used to live inside this component (Option A)
// but now lives on BakeDetailView.vue (Option C), so there are no raw notes
// tests here — they're in BakeDetailView.spec.ts.
// ---------------------------------------------------------------------------

/* ========================================================================
 * Fixtures
 * ====================================================================== */

const highConfStats: BakeStatsBlockData = {
  confidence: 'high',
  dough_temps: [
    { time: '2026-04-01 - 08:00', temp_f: 74 },
    { time: '2026-04-01 - 10:30', temp_f: 76 },
    { time: '2026-04-01 - 13:00', temp_f: 77 },
    { time: '2026-04-01 - 15:30', temp_f: 77 },
    { time: '2026-04-01 - 17:00', temp_f: 76 }
  ],
  bulk_ambient_temps: [
    { date: '2026-04-01', temp_f: 72, note: 'kitchen' },
    { date: '2026-04-01', temp_f: 74 }
  ],
  stretch_folds: [
    { time: '2026-04-01 - 09:00', type: 'stretch_fold' },
    { time: '2026-04-01 - 09:30', type: 'stretch_fold' },
    { time: '2026-04-01 - 10:00', type: 'coil', note: 'light coil' }
  ],
  aliquot_rises: [
    { time: '2026-04-01 - 13:00', rise_pct: 25, stage: 'bulk' },
    { time: '2026-04-02 - 07:00', rise_pct: 60, stage: 'preshape', note: 'cold retard end' },
    { time: '2026-04-02 - 09:00', rise_pct: 75, stage: 'final' }
  ],
  bake_phases: [
    { stage: 'preheat', start_time: '2026-04-02 - 08:00', temp_f: 500, duration_min: 45 },
    { stage: 'covered', start_time: '2026-04-02 - 08:45', temp_f: 450, duration_min: 20 },
    { stage: 'uncovered', start_time: '2026-04-02 - 09:05', temp_f: 425, duration_min: 20 }
  ]
}

const partialMediumStats: BakeStatsBlockData = {
  confidence: 'medium',
  dough_temps: [{ time: '2026-02-14 - 10:00', temp_f: 75 }],
  // Only one section besides header — partial data coverage
  bake_phases: [
    { stage: 'preheat', temp_f: 500, duration_min: 45 },
    { stage: 'covered', temp_f: 450, duration_min: 20 },
    { stage: 'uncovered', temp_f: 425, duration_min: 20 }
  ]
}

const lowConfStats: BakeStatsBlockData = {
  confidence: 'low'
  // no dough_temps, bulk_ambient_temps, bake_phases, stretch_folds, aliquot_rises
  // Everything should fall back to recipe defaults / show the callout.
}

const recipeDefaults: RecipeBakeDefaults = {
  bake_phases: [
    { stage: 'preheat', temp_f: 500, duration_min: 45 },
    { stage: 'covered', temp_f: 450, duration_min: 20 },
    { stage: 'uncovered', temp_f: 425, duration_min: 20 }
  ]
}

/* ========================================================================
 * Mode 1 — Full-data high-confidence
 * ====================================================================== */

describe('BakeStatsBlock — full-data high-confidence', () => {
  function mountFull() {
    return mount(BakeStatsBlock, {
      props: {
        bake_stats: highConfStats,
        bake_defaults: recipeDefaults
      }
    })
  }

  it('renders the root block with test id', () => {
    const wrapper = mountFull()
    expect(wrapper.find('[data-testid="bake-stats-block"]').exists()).toBe(true)
  })

  it('renders all three header pills (bulk / proof / bake)', () => {
    const wrapper = mountFull()
    expect(wrapper.find('[data-testid="bsb-pills"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bsb-pill-bulk"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bsb-pill-proof"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bsb-pill-bake"]').exists()).toBe(true)
  })

  it('does NOT apply the low-confidence dim class to pills', () => {
    const wrapper = mountFull()
    const pills = wrapper.find('[data-testid="bsb-pills"]')
    expect(pills.classes()).not.toContain('bsb-low-conf')
  })

  it('does NOT render the low-confidence callout for high-confidence', () => {
    const wrapper = mountFull()
    expect(wrapper.find('[data-testid="bsb-low-conf-callout"]').exists()).toBe(false)
  })

  it('renders the temperatures section with avg dough + ambient tiles', () => {
    const wrapper = mountFull()
    const temps = wrapper.find('[data-testid="bsb-temps"]')
    expect(temps.exists()).toBe(true)
    // Avg of 74, 76, 77, 77, 76 = 76.0°F
    expect(temps.text()).toContain('76.0°F')
    // Ambient avg of 72, 74 = 73°F (rounded)
    expect(temps.text()).toContain('73°F')
  })

  it('renders dough temp readings list with all samples', () => {
    const wrapper = mountFull()
    const readings = wrapper.find('[data-testid="bsb-dough-readings"]')
    expect(readings.exists()).toBe(true)
    expect(readings.text()).toContain('74°F')
    expect(readings.text()).toContain('76°F')
    expect(readings.text()).toContain('77°F')
    expect(readings.text()).toContain('08:00')
    expect(readings.text()).toContain('17:00')
  })

  it('renders ambient readings list', () => {
    const wrapper = mountFull()
    const readings = wrapper.find('[data-testid="bsb-ambient-readings"]')
    expect(readings.exists()).toBe(true)
    expect(readings.text()).toContain('kitchen')
  })

  it('renders stretch & folds grid with 3 rows', () => {
    const wrapper = mountFull()
    const sf = wrapper.find('[data-testid="bsb-stretch-folds"]')
    expect(sf.exists()).toBe(true)
    expect(sf.text()).toContain('stretch fold #1')
    expect(sf.text()).toContain('stretch fold #2')
    expect(sf.text()).toContain('coil #3')
    expect(sf.text()).toContain('light coil')
  })

  it('renders aliquot rises with percentages', () => {
    const wrapper = mountFull()
    const rises = wrapper.find('[data-testid="bsb-aliquot-rises"]')
    expect(rises.exists()).toBe(true)
    expect(rises.text()).toContain('25%')
    expect(rises.text()).toContain('60%')
    expect(rises.text()).toContain('75%')
    expect(rises.text()).toContain('cold retard end')
  })

  it('renders day-break divider between different dates in aliquot rises', () => {
    const wrapper = mountFull()
    const rises = wrapper.find('[data-testid="bsb-aliquot-rises"]')
    // bulk on 2026-04-01, preshape/final on 2026-04-02 → 1 day break
    expect(rises.findAll('.bsb-day-break')).toHaveLength(1)
  })

  it('renders bake phases with preheat / covered / uncovered stages', () => {
    const wrapper = mountFull()
    const bake = wrapper.find('[data-testid="bsb-bake-phases"]')
    expect(bake.exists()).toBe(true)
    const text = bake.text()
    expect(text).toContain('preheat')
    expect(text).toContain('covered')
    expect(text).toContain('uncovered')
    expect(text).toContain('500°F')
    expect(text).toContain('450°F')
    expect(text).toContain('425°F')
    expect(text).toContain('45m')
    expect(text).toContain('20m')
  })

  it('bake phases heading does NOT show "recipe baseline" subheading for full-data', () => {
    const wrapper = mountFull()
    const bake = wrapper.find('[data-testid="bsb-bake-phases"]')
    expect(bake.text()).not.toContain('recipe baseline')
  })

  it('does NOT render a raw notes disclosure (moved to BakeDetailView)', () => {
    const wrapper = mountFull()
    expect(wrapper.find('[data-testid="bsb-raw-disclosure"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="bsb-raw-toggle"]').exists()).toBe(false)
  })

  it('matches HTML snapshot', () => {
    const wrapper = mountFull()
    expect(wrapper.html()).toMatchSnapshot()
  })
})

/* ========================================================================
 * Mode 2 — Partial-data medium-confidence
 * ====================================================================== */

describe('BakeStatsBlock — partial-data medium-confidence', () => {
  function mountPartial() {
    return mount(BakeStatsBlock, {
      props: {
        bake_stats: partialMediumStats,
        bake_defaults: recipeDefaults
      }
    })
  }

  it('renders the header pills', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-pills"]').exists()).toBe(true)
  })

  it('does NOT show the low-confidence callout for medium-confidence', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-low-conf-callout"]').exists()).toBe(false)
  })

  it('renders temperatures section (has 1 dough sample)', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-temps"]').exists()).toBe(true)
  })

  it('does NOT render the ambient readings (no bulk_ambient_temps)', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-ambient-readings"]').exists()).toBe(false)
  })

  it('does NOT render stretch & folds section when none present', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-stretch-folds"]').exists()).toBe(false)
  })

  it('does NOT render aliquot rises section when none present', () => {
    const wrapper = mountPartial()
    expect(wrapper.find('[data-testid="bsb-aliquot-rises"]').exists()).toBe(false)
  })

  it('renders bake phases section from entry data (not from fallback)', () => {
    const wrapper = mountPartial()
    const bake = wrapper.find('[data-testid="bsb-bake-phases"]')
    expect(bake.exists()).toBe(true)
    // No "recipe baseline" subheading — the entry has its own phases
    expect(bake.text()).not.toContain('recipe baseline')
  })

  it('matches HTML snapshot', () => {
    const wrapper = mountPartial()
    expect(wrapper.html()).toMatchSnapshot()
  })
})

/* ========================================================================
 * Mode 3 — Low-confidence fallback
 * ====================================================================== */

describe('BakeStatsBlock — low-confidence fallback', () => {
  function mountLow() {
    return mount(BakeStatsBlock, {
      props: {
        bake_stats: lowConfStats,
        bake_defaults: recipeDefaults
      }
    })
  }

  it('applies the bsb-low-conf dim class to the pills row', () => {
    const wrapper = mountLow()
    const pills = wrapper.find('[data-testid="bsb-pills"]')
    expect(pills.classes()).toContain('bsb-low-conf')
  })

  it('renders em-dash for bulk and proof pills (not directly logged)', () => {
    const wrapper = mountLow()
    expect(wrapper.find('[data-testid="bsb-pill-bulk"]').text()).toContain('—')
    expect(wrapper.find('[data-testid="bsb-pill-proof"]').text()).toContain('—')
  })

  it('renders the low-confidence callout', () => {
    const wrapper = mountLow()
    const callout = wrapper.find('[data-testid="bsb-low-conf-callout"]')
    expect(callout.exists()).toBe(true)
    expect(callout.text()).toContain('reconstructed')
    expect(callout.text()).toContain('recalled')
  })

  it('does NOT render temperatures section when no dough or ambient data', () => {
    const wrapper = mountLow()
    expect(wrapper.find('[data-testid="bsb-temps"]').exists()).toBe(false)
  })

  it('does NOT render stretch & folds when none', () => {
    const wrapper = mountLow()
    expect(wrapper.find('[data-testid="bsb-stretch-folds"]').exists()).toBe(false)
  })

  it('does NOT render aliquot rises when none', () => {
    const wrapper = mountLow()
    expect(wrapper.find('[data-testid="bsb-aliquot-rises"]').exists()).toBe(false)
  })

  it('renders bake phases from recipe defaults with "recipe baseline" subheading', () => {
    const wrapper = mountLow()
    const bake = wrapper.find('[data-testid="bsb-bake-phases"]')
    expect(bake.exists()).toBe(true)
    expect(bake.text()).toContain('recipe baseline')
    expect(bake.text()).toContain('preheat')
    expect(bake.text()).toContain('500°F')
  })

  it('bake pill shows bake duration from recipe defaults (covered + uncovered)', () => {
    const wrapper = mountLow()
    // 20 + 20 = 40m from covered + uncovered in defaults
    expect(wrapper.find('[data-testid="bsb-pill-bake"]').text()).toContain('40m')
  })

  it('matches HTML snapshot', () => {
    const wrapper = mountLow()
    expect(wrapper.html()).toMatchSnapshot()
  })
})

/* ========================================================================
 * Behavioral edge cases
 * ====================================================================== */

describe('BakeStatsBlock — edge cases', () => {
  it('empty bake_stats renders pills only, no section blocks', () => {
    const wrapper = mount(BakeStatsBlock, {
      props: {
        bake_stats: { confidence: 'medium' }
      }
    })
    expect(wrapper.find('[data-testid="bsb-pills"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="bsb-temps"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="bsb-stretch-folds"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="bsb-aliquot-rises"]').exists()).toBe(false)
    expect(wrapper.find('[data-testid="bsb-bake-phases"]').exists()).toBe(false)
  })

  it('dough readings list uses single-sample temps section without "over Xh" sublabel', () => {
    const wrapper = mount(BakeStatsBlock, {
      props: {
        bake_stats: {
          confidence: 'medium',
          dough_temps: [{ time: '2026-02-14 - 10:00', temp_f: 75 }]
        }
      }
    })
    const temps = wrapper.find('[data-testid="bsb-temps"]')
    expect(temps.exists()).toBe(true)
    expect(temps.text()).toContain('75.0°F')
    expect(temps.text()).not.toContain('over')
  })

  it('shows "over Xh" sublabel when dough samples span multiple hours', () => {
    const wrapper = mount(BakeStatsBlock, {
      props: {
        bake_stats: {
          confidence: 'high',
          dough_temps: [
            { time: '2026-04-01 - 08:00', temp_f: 74 },
            { time: '2026-04-01 - 14:00', temp_f: 76 }
          ]
        }
      }
    })
    const temps = wrapper.find('[data-testid="bsb-temps"]')
    expect(temps.text()).toContain('over 6h')
  })

  it('de-duplicates date column in stretch & folds when rows share a date', () => {
    const wrapper = mount(BakeStatsBlock, {
      props: {
        bake_stats: {
          confidence: 'high',
          stretch_folds: [
            { time: '2026-04-01 - 09:00', type: 'stretch_fold' },
            { time: '2026-04-01 - 09:30', type: 'stretch_fold' },
            { time: '2026-04-01 - 10:00', type: 'stretch_fold' }
          ]
        }
      }
    })
    const sf = wrapper.find('[data-testid="bsb-stretch-folds"]')
    // Only the first row should print the date — others are blanked
    const dateCells = sf.findAll('.bsb-row-date')
    const filled = dateCells.filter((c) => c.text().trim() !== '')
    expect(filled).toHaveLength(1)
    expect(filled[0].text()).toBe('2026-04-01')
  })

  it('does NOT render bake phases at all when entry has none AND no recipe defaults', () => {
    const wrapper = mount(BakeStatsBlock, {
      props: {
        bake_stats: { confidence: 'medium' }
        // no bake_defaults
      }
    })
    expect(wrapper.find('[data-testid="bsb-bake-phases"]').exists()).toBe(false)
  })
})
