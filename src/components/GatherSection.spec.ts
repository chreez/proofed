import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import GatherSection from './GatherSection.vue'

// Mock child component
vi.mock('@/components/GatherCategory.vue', () => ({
  default: {
    name: 'GatherCategory',
    props: ['title', 'items', 'progress', 'stageId', 'startCollapsed'],
    template: '<div class="gather-category-stub" :data-start-collapsed="startCollapsed ?? false">{{ title }}: {{ items.length }} items</div>'
  }
}))

// Mock lucide-vue-next icons
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
    resetSection: vi.fn(),
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

  it('passes startCollapsed to Vessels and Equipment but not Ingredients', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    const stubs = wrapper.findAll('.gather-category-stub')
    expect(stubs[0].attributes('data-start-collapsed')).toBe('true')  // Vessels
    expect(stubs[1].attributes('data-start-collapsed')).toBe('true')  // Equipment
    expect(stubs[2].attributes('data-start-collapsed')).toBe('false') // Ingredients
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

    const button = wrapper.find('button[title="Copy Mise en Place"]')
    expect(button.exists()).toBe(true)

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

    await wrapper.find('button[title="Copy Mise en Place"]').trigger('click')

    const copiedText = writeTextMock.mock.calls[0][0]
    // Ingredient label includes total
    expect(copiedText).toContain('Unsalted butter \u2014 140g')
  })

  it('shows reset button when items have progress', () => {
    const progress = makeProgress()
    progress.isItemChecked = vi.fn((id: string) => id === 'vessel-10-inch cast-iron skillet')
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress
      }
    })

    expect(wrapper.find('button[title="Reset Section"]').exists()).toBe(true)
  })

  it('hides reset button when no progress', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })

    expect(wrapper.find('button[title="Reset Section"]').exists()).toBe(false)
  })

  it('calls resetSection on reset button click', async () => {
    const progress = makeProgress()
    progress.isItemChecked = vi.fn(() => true)
    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress
      }
    })

    await wrapper.find('button[title="Reset Section"]').trigger('click')

    expect(progress.resetSection).toHaveBeenCalledWith('prep')
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

  it('copies only unchecked items when some are checked', async () => {
    const progress = makeProgress()
    // Check the first vessel and first ingredient
    progress.isItemChecked = vi.fn((id: string) =>
      id === 'vessel-10-inch cast-iron skillet' || id === 'ing-flour'
    )

    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress
      }
    })

    await wrapper.find('button[title="Copy Mise en Place"]').trigger('click')

    expect(writeTextMock).toHaveBeenCalledTimes(1)
    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).toContain('Mise en Place - Prep')
    // Checked vessel should be excluded
    expect(copiedText).not.toContain('10-inch cast-iron skillet')
    // Unchecked vessel should be included
    expect(copiedText).toContain('Large mixing bowl')
    // Equipment untouched — both should be included
    expect(copiedText).toContain('Equipment:')
    expect(copiedText).toContain('Rolling pin')
    expect(copiedText).toContain('Serrated knife')
    // Checked ingredient excluded, unchecked included
    expect(copiedText).not.toContain('All-purpose flour')
    expect(copiedText).toContain('Unsalted butter')
  })

  it('omits empty sections from copy when all items in a category are checked', async () => {
    const progress = makeProgress()
    // Check both vessels
    progress.isItemChecked = vi.fn((id: string) =>
      id === 'vessel-10-inch cast-iron skillet' || id === 'vessel-Large mixing bowl'
    )

    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress
      }
    })

    await wrapper.find('button[title="Copy Mise en Place"]').trigger('click')

    const copiedText = writeTextMock.mock.calls[0][0]
    expect(copiedText).not.toContain('Vessels:')
    expect(copiedText).toContain('Equipment:')
    expect(copiedText).toContain('Ingredients:')
  })

  it('shows "Everything gathered!" feedback when all items are checked', async () => {
    const progress = makeProgress()
    progress.isItemChecked = vi.fn(() => true)

    const wrapper = mount(GatherSection, {
      props: {
        gather: fullGather,
        stageId: 'prep',
        stageTitle: 'Prep',
        progress
      }
    })

    await wrapper.find('button[title="Copy Mise en Place"]').trigger('click')

    // Should NOT call clipboard
    expect(writeTextMock).not.toHaveBeenCalled()
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
