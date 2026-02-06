import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StageCard from './StageCard.vue'

// Mock child components
vi.mock('@/components/GatherSection.vue', () => ({
  default: { name: 'GatherSection', template: '<div />' }
}))
vi.mock('@/components/StateStep.vue', () => ({
  default: { name: 'StateStep', template: '<div />' }
}))

function makeProgress(collapsed = false) {
  return {
    isStageCollapsed: vi.fn(() => collapsed),
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

const defaultProps = {
  stage: {
    id: 'mise-en-place',
    title: 'Mise en Place',
    gather: null,
    states: ['state-1', 'state-2']
  },
  states: [
    { id: 'state-1', title: 'Step One', instruction: 'Do thing', exit_condition: 'Done' },
    { id: 'state-2', title: 'Step Two', instruction: 'Do other', exit_condition: 'Done' }
  ],
  config: { early_check_percent: 75 },
  progress: makeProgress()
}

describe('StageCard', () => {
  it('renders stage title', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Mise en Place')
  })

  it('header button has rounded-none and appearance-none for mobile Safari', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    const btn = wrapper.find('#stage-header-mise-en-place')
    expect(btn.exists()).toBe(true)
    expect(btn.classes()).toContain('rounded-none')
    expect(btn.classes()).toContain('appearance-none')
  })

  it('header button has scroll-mt-16 for sticky header offset', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    const btn = wrapper.find('#stage-header-mise-en-place')
    expect(btn.classes()).toContain('scroll-mt-16')
  })

  it('calls toggleStageCollapse when header clicked', async () => {
    const progress = makeProgress()
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })
    await wrapper.find('#stage-header-mise-en-place').trigger('click')
    expect(progress.toggleStageCollapse).toHaveBeenCalledWith('mise-en-place')
  })

  it('shows state count', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    expect(wrapper.text()).toContain('0/2')
  })

  it('collapses content when stage is collapsed', () => {
    const progress = makeProgress(true)
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })
    const grid = wrapper.find('.grid')
    expect(grid.classes()).toContain('grid-rows-[0fr]')
  })

  it('expands content when stage is not collapsed', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    const grid = wrapper.find('.grid')
    expect(grid.classes()).toContain('grid-rows-[1fr]')
  })
})
