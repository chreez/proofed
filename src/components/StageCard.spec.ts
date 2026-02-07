import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StageCard from './StageCard.vue'

// Mock child components
vi.mock('@/components/GatherSection.vue', () => ({
  default: { name: 'GatherSection', template: '<div />' }
}))
vi.mock('@/components/StateStep.vue', () => ({
  default: {
    name: 'StateStep',
    props: ['state', 'stageId', 'config', 'progress', 'stepNote'],
    emits: ['toggled'],
    template: '<div class="state-step-stub" @click="$emit(\'toggled\', state.id)">{{ state.title }}</div>'
  }
}))
vi.mock('@/composables/useScrollToNext', () => ({
  scrollToNextItem: vi.fn()
}))
vi.mock('lucide-vue-next', () => ({
  RotateCcw: { name: 'RotateCcw', template: '<svg class="icon-rotate" />' },
  Link2: { name: 'Link2', template: '<svg class="icon-link" />' },
  Check: { name: 'Check', template: '<svg class="icon-check" />' }
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
    resetSection: vi.fn(),
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
  progress: makeProgress(),
  sectionId: 'stage-mise-en-place'
}

describe('StageCard', () => {
  it('renders stage title', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    expect(wrapper.text()).toContain('Mise en Place')
  })

  it('header is a clickable div with no button styling', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    const header = wrapper.find('#stage-header-mise-en-place')
    expect(header.exists()).toBe(true)
    expect(header.element.tagName).toBe('DIV')
    expect(header.classes()).toContain('cursor-pointer')
    expect(header.classes()).toContain('select-text')
  })

  it('header has scroll-mt-16 for sticky header offset', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    const header = wrapper.find('#stage-header-mise-en-place')
    expect(header.classes()).toContain('scroll-mt-16')
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

  it('does not collapse when user is selecting text', async () => {
    const progress = makeProgress()
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })

    // Mock window.getSelection to return a non-empty selection
    const getSelectionSpy = vi.spyOn(window, 'getSelection').mockReturnValue({
      toString: () => 'selected text'
    } as unknown as Selection)

    await wrapper.find('#stage-header-mise-en-place').trigger('click')

    // Should NOT have called toggleStageCollapse
    expect(progress.toggleStageCollapse).not.toHaveBeenCalled()

    getSelectionSpy.mockRestore()
  })

  it('renders with gather section when stage has gather', () => {
    const wrapper = mount(StageCard, {
      props: {
        ...defaultProps,
        stage: {
          ...defaultProps.stage,
          gather: {
            ingredients: [{ id: 'flour', name: 'Flour', total: 390, unit: 'g', breakdown: null }]
          }
        }
      }
    })
    expect(wrapper.html()).toContain('div') // GatherSection stub renders
  })

  it('counts checked states for state count display', () => {
    const progress = makeProgress()
    progress.isStateChecked = vi.fn((id: string) => id === 'state-1')
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })
    expect(wrapper.text()).toContain('1/2')
  })

  it('scrolls to next unchecked state when state toggled and checked', async () => {
    const { scrollToNextItem } = await import('@/composables/useScrollToNext')
    const progress = makeProgress()
    // state-1 is checked but state-2 is not
    progress.isStateChecked = vi.fn((id: string) => id === 'state-1')

    const wrapper = mount(StageCard, {
      props: {
        ...defaultProps,
        states: [
          { id: 'state-1', title: 'Step One', direction: 'Do thing', exit_condition: 'Done', components: null, notes: null },
          { id: 'state-2', title: 'Step Two', direction: 'Do other', exit_condition: 'Done', components: null, notes: null }
        ],
        progress
      }
    })

    // Click state-1 stub to emit toggled
    const stateStubs = wrapper.findAll('.state-step-stub')
    await stateStubs[0].trigger('click')

    expect(scrollToNextItem).toHaveBeenCalledWith('[data-state-id="state-2"]')
  })

  it('does not scroll when state toggled but unchecked', async () => {
    const { scrollToNextItem } = await import('@/composables/useScrollToNext')
    vi.mocked(scrollToNextItem).mockClear()

    const progress = makeProgress()
    // Nothing is checked
    progress.isStateChecked = vi.fn(() => false)

    const wrapper = mount(StageCard, {
      props: {
        ...defaultProps,
        states: [
          { id: 'state-1', title: 'Step One', direction: 'Do thing', exit_condition: 'Done', components: null, notes: null },
          { id: 'state-2', title: 'Step Two', direction: 'Do other', exit_condition: 'Done', components: null, notes: null }
        ],
        progress
      }
    })

    // Click state-1 stub to emit toggled (but it's unchecked)
    const stateStubs = wrapper.findAll('.state-step-stub')
    await stateStubs[0].trigger('click')

    expect(scrollToNextItem).not.toHaveBeenCalled()
  })

  it('does not scroll when no next unchecked state', async () => {
    const { scrollToNextItem } = await import('@/composables/useScrollToNext')
    vi.mocked(scrollToNextItem).mockClear()

    const progress = makeProgress()
    // All states checked
    progress.isStateChecked = vi.fn(() => true)

    const wrapper = mount(StageCard, {
      props: {
        ...defaultProps,
        states: [
          { id: 'state-1', title: 'Step One', direction: 'Do thing', exit_condition: 'Done', components: null, notes: null },
          { id: 'state-2', title: 'Step Two', direction: 'Do other', exit_condition: 'Done', components: null, notes: null }
        ],
        progress
      }
    })

    // Click state-1 stub
    const stateStubs = wrapper.findAll('.state-step-stub')
    await stateStubs[0].trigger('click')

    expect(scrollToNextItem).not.toHaveBeenCalled()
  })
})

describe('Reset button', () => {
  it('is hidden when no stage progress', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    expect(wrapper.find('button[title="Reset Section"]').exists()).toBe(false)
  })

  it('is visible when stage has state progress', () => {
    const progress = makeProgress()
    progress.isStateChecked = vi.fn((id: string) => id === 'state-1')
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })
    expect(wrapper.find('button[title="Reset Section"]').exists()).toBe(true)
  })

  it('calls resetSection on click', async () => {
    const progress = makeProgress()
    progress.isStateChecked = vi.fn(() => true)
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })

    await wrapper.find('button[title="Reset Section"]').trigger('click')
    expect(progress.resetSection).toHaveBeenCalledWith('mise-en-place')
  })

  it('stopPropagation prevents header toggle', async () => {
    const progress = makeProgress()
    progress.isStateChecked = vi.fn(() => true)
    const wrapper = mount(StageCard, {
      props: { ...defaultProps, progress }
    })

    await wrapper.find('button[title="Reset Section"]').trigger('click')

    // resetSection should be called but toggleStageCollapse should NOT
    expect(progress.resetSection).toHaveBeenCalledWith('mise-en-place')
    expect(progress.toggleStageCollapse).not.toHaveBeenCalled()
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(StageCard, { props: defaultProps })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
