import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GatherSection from './GatherSection.vue'

// Mock child component
vi.mock('@/components/GatherCategory.vue', () => ({
  default: {
    name: 'GatherCategory',
    props: ['title', 'items', 'progress', 'stageId'],
    template: '<div class="gather-category-stub">{{ title }}: {{ items.length }} items</div>'
  }
}))

// Mock clipboard
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.assign(navigator, {
  clipboard: { writeText: writeTextMock }
})

function makeProgress() {
  return {
    isStageCollapsed: vi.fn(() => false),
    toggleStageCollapse: vi.fn(),
    isStateChecked: vi.fn(() => false),
    isItemChecked: vi.fn(() => false),
    toggleItem: vi.fn(),
    toggleState: vi.fn(),
    getCompletionCount: vi.fn(() => ({ done: 0, total: 0 })),
    registerStage: vi.fn(),
    load: vi.fn(),
    save: vi.fn(),
    setStageOrder: vi.fn(),
    resetProgress: vi.fn()
  }
}

const fullGather = {
  vessels: ['10-inch cast-iron skillet', 'Large mixing bowl'],
  equipment: ['Rolling pin', 'Serrated knife'],
  ingredients: [
    { id: 'flour', name: 'All-purpose flour', total: 390, unit: 'g', breakdown: null },
    {
      id: 'butter',
      name: 'Unsalted butter',
      total: 140,
      unit: 'g',
      breakdown: [
        { label: 'filling', amount: 14 },
        { label: 'dough', amount: 28 },
        { label: 'brushing', amount: 56 },
        { label: 'pan + tops', amount: 42 }
      ]
    }
  ]
}

describe('GatherSection', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    writeTextMock.mockClear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders GatherCategory for each section', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    const stubs = wrapper.findAll('.gather-category-stub')
    expect(stubs.length).toBe(3)
    expect(stubs[0].text()).toContain('Vessels: 2 items')
    expect(stubs[1].text()).toContain('Equipment: 2 items')
    expect(stubs[2].text()).toContain('Ingredients: 2 items')
  })

  it('hides vessels section when empty', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: { ingredients: fullGather.ingredients },
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    const stubs = wrapper.findAll('.gather-category-stub')
    expect(stubs.length).toBe(1)
    expect(stubs[0].text()).toContain('Ingredients')
  })

  it('hides equipment section when undefined', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: { vessels: ['Skillet'] },
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    const stubs = wrapper.findAll('.gather-category-stub')
    expect(stubs.length).toBe(1)
    expect(stubs[0].text()).toContain('Vessels')
  })

  it('hides ingredients section when empty array', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: { vessels: ['Skillet'], equipment: ['Whisk'], ingredients: [] },
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    // ingredients is empty array, should not render
    const stubs = wrapper.findAll('.gather-category-stub')
    expect(stubs.length).toBe(2)
  })

  it('copies gather text to clipboard', async () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    const button = wrapper.find('button')
    expect(button.text()).toBe('Copy')

    await button.trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).toContain('Mise en Place - Prep')
    expect(copiedText).toContain('Vessels:')
    expect(copiedText).toContain('10-inch cast-iron skillet')
    expect(copiedText).toContain('Equipment:')
    expect(copiedText).toContain('Rolling pin')
    expect(copiedText).toContain('Ingredients:')
    expect(copiedText).toContain('All-purpose flour')
  })

  it('shows "Copied!" after clicking copy and resets', async () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    await wrapper.find('button').trigger('click')

    await vi.waitFor(() => {
      expect(wrapper.find('button').text()).toBe('Copied!')
    })

    vi.advanceTimersByTime(2000)
    await vi.waitFor(() => {
      expect(wrapper.find('button').text()).toBe('Copy')
    })
  })

  it('formats ingredient with breakdown in copy text', async () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: {
          ingredients: [
            {
              id: 'butter',
              name: 'Unsalted butter',
              total: 140,
              unit: 'g',
              breakdown: [
                { label: 'filling', amount: 14 },
                { label: 'dough', amount: 28 }
              ]
            }
          ]
        },
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    await wrapper.find('button').trigger('click')

    const copiedText = writeTextMock.mock.calls[0][0]
    // Ingredient label includes total
    expect(copiedText).toContain('Unsalted butter \u2014 140g')
  })

  it('renders Gather header', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    expect(wrapper.text()).toContain('Gather')
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
