import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import RecipeMeta from './RecipeMeta.vue'

// Mock lucide-vue-next icons as simple span stubs
vi.mock('lucide-vue-next', () => ({
  ClipboardList: { name: 'ClipboardList', template: '<svg class="icon-clipboard" />' },
  Check: { name: 'Check', template: '<svg class="icon-check" />' },
  RotateCcw: { name: 'RotateCcw', template: '<svg class="icon-rotate" />' }
}))

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock }
})

function makeRecipe(overrides = {}) {
  return {
    meta: {
      name: 'Quick Cinnamon Buns',
      source: { name: "America's Test Kitchen" },
      yields: '8 buns',
      total_time: '~1.5 hours'
    },
    config: { early_check_percent: 75 },
    vessels: [],
    stages: [
      {
        id: 'prep',
        title: 'Prep',
        gather: {
          ingredients: [
            { id: 'flour', name: 'All-purpose flour', total: 390, unit: 'g', breakdown: null }
          ]
        },
        states: ['mix']
      }
    ],
    states: [
      {
        id: 'mix',
        title: 'Mix Dough',
        direction: 'Combine dry ingredients',
        components: null,
        exit_condition: 'Dough comes together',
        notes: null
      }
    ],
    version: 'v1.0.0',
    ...overrides
  }
}

describe('RecipeMeta', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    writeTextMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders recipe name', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).toContain('Quick Cinnamon Buns')
  })

  it('renders source', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).toContain("America's Test Kitchen")
  })

  it('renders yields', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).toContain('8 buns')
  })

  it('renders total_time', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).toContain('~1.5 hours')
  })

  it('formats version as v{major}.{minor}', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe({ version: 'v1.2.3' }) }
    })
    expect(wrapper.text()).toContain('v1.2')
    expect(wrapper.text()).not.toContain('v1.2.3')
  })

  it('returns version string unchanged if no match', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe({ version: 'beta' }) }
    })
    expect(wrapper.text()).toContain('beta')
  })

  it('hides version when undefined', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe({ version: undefined }) }
    })
    // No font-mono version element should be present
    expect(wrapper.find('.font-mono.text-sm.text-stone-400').exists()).toBe(false)
  })

  it('hides source when not provided', () => {
    const recipe = makeRecipe()
    delete recipe.meta.source
    const wrapper = mount(RecipeMeta, {
      props: { recipe }
    })
    expect(wrapper.text()).not.toContain("America's Test Kitchen")
  })

  it('copies recipe text on button click', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })

    const button = wrapper.find('button[title="Copy Recipe"]')
    expect(button.exists()).toBe(true)

    await button.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).toContain('Quick Cinnamon Buns')
    expect(copiedText).toContain('Ingredients:')
    expect(copiedText).toContain('All-purpose flour')
    expect(copiedText).toContain('Directions:')
    expect(copiedText).toContain('Combine dry ingredients')
  })

  it('formats recipe with multiple stages', async () => {
    const recipe = makeRecipe({
      stages: [
        {
          id: 'prep',
          title: 'Prep',
          gather: {
            ingredients: [
              { id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null }
            ]
          },
          states: ['mix']
        },
        {
          id: 'bake',
          title: 'Bake',
          gather: {
            ingredients: [
              { id: 'sugar', name: 'Sugar', total: 100, unit: 'g', breakdown: null }
            ]
          },
          states: ['bake-step']
        }
      ],
      states: [
        {
          id: 'mix',
          title: 'Mix',
          direction: 'Mix everything',
          components: null,
          exit_condition: 'Done',
          notes: null
        },
        {
          id: 'bake-step',
          title: 'Bake',
          direction: 'Bake at 175C',
          components: null,
          exit_condition: 'Golden brown',
          notes: null
        }
      ]
    })

    const wrapper = mount(RecipeMeta, {
      props: { recipe }
    })

    await wrapper.find('button[title="Copy Recipe"]').trigger('click')

    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).toContain('Flour')
    expect(copiedText).toContain('Sugar')
    expect(copiedText).toContain('1. Mix everything')
    expect(copiedText).toContain('2. Bake at 175C')
  })

  it('handles stage with no gather ingredients', async () => {
    const recipe = makeRecipe({
      stages: [
        {
          id: 'bake',
          title: 'Bake',
          gather: null,
          states: ['bake-step']
        }
      ],
      states: [
        {
          id: 'bake-step',
          title: 'Bake',
          direction: 'Bake at 175C',
          components: null,
          exit_condition: 'Done',
          notes: null
        }
      ]
    })

    const wrapper = mount(RecipeMeta, {
      props: { recipe }
    })

    await wrapper.find('button[title="Copy Recipe"]').trigger('click')

    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).not.toContain('Ingredients:')
    expect(copiedText).toContain('Directions:')
  })
})

describe('Reset Bake button', () => {
  it('is hidden when hasProgress is false', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe(), hasProgress: false }
    })
    expect(wrapper.find('button[title="Reset Bake"]').exists()).toBe(false)
  })

  it('is hidden when hasProgress is not provided', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.find('button[title="Reset Bake"]').exists()).toBe(false)
  })

  it('is visible when hasProgress is true', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe(), hasProgress: true }
    })
    expect(wrapper.find('button[title="Reset Bake"]').exists()).toBe(true)
  })

  it('opens confirmation dialog on click, emits reset on confirm', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe(), hasProgress: true, checkedCount: 3, completedStageCount: 1, scratchpadNoteCount: 2 },
      global: { stubs: { Teleport: true } }
    })
    const resetBtn = wrapper.find('button[title="Reset Bake"]')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')

    // Dialog should be open — no reset emitted yet
    expect(wrapper.emitted('reset')).toBeUndefined()

    // Find and click the confirm button inside the dialog
    const confirmBtn = wrapper.find('[data-testid="reset-confirm-btn"]')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')

    expect(wrapper.emitted('reset')).toHaveLength(1)
  })

  it('does not emit reset when dialog is cancelled', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe(), hasProgress: true, checkedCount: 1, completedStageCount: 0, scratchpadNoteCount: 0 },
      global: { stubs: { Teleport: true } }
    })
    const resetBtn = wrapper.find('button[title="Reset Bake"]')
    await resetBtn.trigger('click')

    // Click cancel
    const cancelBtn = wrapper.find('[data-testid="reset-cancel-btn"]')
    expect(cancelBtn.exists()).toBe(true)
    await cancelBtn.trigger('click')

    expect(wrapper.emitted('reset')).toBeUndefined()
  })
})

describe('Scaling', () => {
  function makeScalingRecipe(overrides = {}) {
    return makeRecipe({
      scaling: {
        tested_range: { min: 1, max: 2 },
        ingredients: [
          { id: 'flour', behavior: 'linear' as const, note: 'Scales linearly' }
        ],
        process_caveats: ['Watch vessel size at 2×', 'Fermentation timing changes'],
        researched_date: '2026-04-08',
        sources: ['Test source']
      },
      ...overrides
    })
  }

  it('renders ScalingControl when recipe has scaling block', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    expect(wrapper.text()).toContain('Scale:')
  })

  it('does not render ScalingControl when recipe lacks scaling block', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).not.toContain('Scale:')
  })

  it('shows scaled yields when multiplier is changed', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    // Click the 2× button
    const buttons = wrapper.findAll('button').filter(b => b.text() === '2×')
    expect(buttons.length).toBeGreaterThan(0)
    await buttons[0].trigger('click')
    expect(wrapper.text()).toContain('16 buns')
    expect(wrapper.text()).toContain('(×2)')
  })

  it('shows process caveats when multiplier > 1', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    expect(wrapper.text()).not.toContain('Watch vessel size')
    const btn2x = wrapper.findAll('button').filter(b => b.text() === '2×')
    await btn2x[0].trigger('click')
    expect(wrapper.text()).toContain('Watch vessel size at 2×')
    expect(wrapper.text()).toContain('Fermentation timing changes')
  })

  it('dismisses a caveat when clicking ✕', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    const btn2x = wrapper.findAll('button').filter(b => b.text() === '2×')
    await btn2x[0].trigger('click')
    expect(wrapper.text()).toContain('Watch vessel size at 2×')

    const dismissBtns = wrapper.findAll('button').filter(b => b.text() === '✕')
    await dismissBtns[0].trigger('click')
    expect(wrapper.text()).not.toContain('Watch vessel size at 2×')
    expect(wrapper.text()).toContain('Fermentation timing changes')
  })

  it('shows untested warning beyond tested range', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    const btn4x = wrapper.findAll('button').filter(b => b.text() === '4×')
    await btn4x[0].trigger('click')
    expect(wrapper.text()).toContain('Beyond tested range')
  })

  it('resets yields when going back to 1×', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe() }
    })
    const btn2x = wrapper.findAll('button').filter(b => b.text() === '2×')
    await btn2x[0].trigger('click')
    expect(wrapper.text()).toContain('16 buns')

    const btn1x = wrapper.findAll('button').filter(b => b.text() === '1×')
    await btn1x[0].trigger('click')
    expect(wrapper.text()).toContain('8 buns')
    expect(wrapper.text()).not.toContain('(×')
  })

  it('handles non-parseable yields with multiplier badge', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeScalingRecipe({ meta: { name: 'Test', source: { name: 'src' }, yields: 'one batch', total_time: '1h' } }) }
    })
    const btn2x = wrapper.findAll('button').filter(b => b.text() === '2×')
    await btn2x[0].trigger('click')
    expect(wrapper.text()).toContain('one batch')
  })
})

describe('outdated banner', () => {
  it('does not render when meta.outdated is unset', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.text()).not.toContain('outdated')
  })

  it('renders banner with reason when meta.outdated is set', () => {
    const wrapper = mount(RecipeMeta, {
      props: {
        recipe: makeRecipe({
          meta: {
            name: 'Old Sourdough',
            source: { name: 'me' },
            yields: '2 loaves',
            total_time: '~22 hrs',
            outdated: { reason: 'Replaced by new method.' }
          }
        })
      }
    })
    expect(wrapper.text()).toContain('outdated')
    expect(wrapper.text()).toContain('Replaced by new method.')
  })

  it('emits select with supersededBy id when superseder link clicked', async () => {
    // Inject a fake manifest into useRecipe singleton so superseder name resolves
    const { useRecipe } = await import('@/composables/useRecipe')
    const r = useRecipe()
    r.manifest.value = {
      recipes: [
        { id: 'new-id', name: 'New Recipe', file: 'new.json' }
      ]
    }
    const wrapper = mount(RecipeMeta, {
      props: {
        recipe: makeRecipe({
          meta: {
            name: 'Old',
            source: { name: 'me' },
            yields: '1',
            total_time: '1h',
            outdated: { reason: 'Old.', supersededBy: 'new-id' }
          }
        })
      }
    })
    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.text()).toContain('New Recipe')
    await link.trigger('click')
    expect(wrapper.emitted('select')?.[0]).toEqual(['new-id'])
    r.manifest.value = null
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe() }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
