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
      source: "America's Test Kitchen",
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

  it('emits reset event on click', async () => {
    const wrapper = mount(RecipeMeta, {
      props: { recipe: makeRecipe(), hasProgress: true }
    })
    const resetBtn = wrapper.find('button[title="Reset Bake"]')
    expect(resetBtn.exists()).toBe(true)
    await resetBtn.trigger('click')
    expect(wrapper.emitted('reset')).toHaveLength(1)
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
