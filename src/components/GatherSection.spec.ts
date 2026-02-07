import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GatherSection from './GatherSection.vue'

// Mock child component
vi.mock('@/components/GatherCategory.vue', () => ({
  default: { name: 'GatherCategory', template: '<div class="gather-category-stub" />' }
}))

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

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(GatherSection, {
      props: {
        gather: {
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
        },
        stageId: 'prep',
        stageTitle: 'Prep',
        progress: makeProgress()
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
