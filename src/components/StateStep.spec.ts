import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import StateStep from './StateStep.vue'

// Mock child components
vi.mock('@/components/TimerDisplay.vue', () => ({
  default: { name: 'TimerDisplay', template: '<div class="timer-stub" />' }
}))
vi.mock('@/components/StepNote.vue', () => ({
  default: {
    name: 'StepNote',
    props: ['note', 'date'],
    template: '<div class="step-note-stub">{{ note }}</div>'
  }
}))
vi.mock('@/components/ScratchpadNote.vue', () => ({
  default: {
    name: 'ScratchpadNote',
    props: ['stepId', 'reminders', 'hasEntries', 'currentRating'],
    emits: ['addNote', 'addRating', 'respond'],
    template: '<div class="scratchpad-note-stub" />'
  }
}))
vi.mock('@/components/ReminderBanner.vue', () => ({
  default: {
    name: 'ReminderBanner',
    props: ['stepId', 'stepTitle', 'reminders', 'isReminderDismissed'],
    emits: ['respond', 'dismiss'],
    template: '<div class="reminder-banner-stub" />'
  }
}))

function makeProgress(stateChecked = false) {
  return {
    isStageCollapsed: vi.fn(() => false),
    toggleStageCollapse: vi.fn(),
    isStateChecked: vi.fn(() => stateChecked),
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

const defaultState = {
  id: 'mix-dough',
  title: 'Mix Dough',
  direction: 'Combine dry ingredients in a large bowl',
  components: null,
  exit_condition: 'Dough comes together and is slightly sticky',
  notes: null
}

const defaultProps = {
  state: defaultState,
  stageId: 'prep',
  config: { early_check_percent: 0.7 },
  progress: makeProgress()
}

describe('StateStep', () => {
  it('renders state title', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.text()).toContain('Mix Dough')
  })

  it('renders direction', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.text()).toContain('Combine dry ingredients in a large bowl')
  })

  it('renders exit condition', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.text()).toContain('Done when: Dough comes together and is slightly sticky')
  })

  it('toggles state when checkbox clicked', async () => {
    const progress = makeProgress()
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, progress }
    })

    await wrapper.find('button').trigger('click')

    expect(progress.toggleState).toHaveBeenCalledWith('mix-dough', 'prep')
  })

  it('emits toggled event when checkbox clicked', async () => {
    const wrapper = mount(StateStep, { props: defaultProps })

    await wrapper.find('button').trigger('click')

    expect(wrapper.emitted('toggled')).toBeTruthy()
    expect(wrapper.emitted('toggled')![0]).toEqual(['mix-dough'])
  })

  it('shows checked styling when state is checked', () => {
    const progress = makeProgress(true)
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, progress }
    })

    // Container should have opacity-50
    const container = wrapper.find('[data-state-id="mix-dough"]')
    expect(container.classes()).toContain('opacity-50')

    // Title should have line-through
    const title = wrapper.find('h4')
    expect(title.classes()).toContain('line-through')
  })

  it('shows checkmark when checked', () => {
    const progress = makeProgress(true)
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, progress }
    })

    const button = wrapper.find('button')
    expect(button.text()).toContain('\u2713') // checkmark
  })

  it('renders parallel badge when state.parallel is true', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: { ...defaultState, parallel: true }
      }
    })

    expect(wrapper.text()).toContain('parallel')
  })

  it('does not render parallel badge when state.parallel is falsy', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.text()).not.toContain('parallel')
  })

  it('renders TimerDisplay in header when state has duration_min', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: { ...defaultState, duration_min: 5 }
      }
    })

    expect(wrapper.find('.timer-stub').exists()).toBe(true)
  })

  it('does not render TimerDisplay when no duration_min', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.find('.timer-stub').exists()).toBe(false)
  })

  it('renders components list', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          components: [
            { name: 'flour', amount: '390g' },
            { name: 'butter', amount: '28g' }
          ]
        }
      }
    })

    expect(wrapper.text()).toContain('flour: 390g')
    expect(wrapper.text()).toContain('butter: 28g')
  })

  it('does not render components when null', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    const componentBadges = wrapper.findAll('.bg-stone-100.text-stone-700')
    expect(componentBadges.length).toBe(0)
  })

  it('renders TimerDisplay with passive for timer:true steps', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: { ...defaultState, timer: true, duration_min: 25 }
      }
    })

    expect(wrapper.find('.timer-stub').exists()).toBe(true)
  })

  it('renders non-critical notes with neutral styling', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'Work quickly to prevent warming', critical: false }]
        }
      }
    })

    expect(wrapper.text()).toContain('Work quickly to prevent warming')
    const noteDiv = wrapper.find('.bg-stone-100.text-stone-600')
    expect(noteDiv.exists()).toBe(true)
  })

  it('renders critical notes with danger styling', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'DO NOT overmix', critical: true }]
        }
      }
    })

    expect(wrapper.text()).toContain('DO NOT overmix')
    const noteDiv = wrapper.find('.bg-accent-tint.text-accent')
    expect(noteDiv.exists()).toBe(true)
    // Critical notes have warning emoji
    expect(noteDiv.text()).toContain('\u26A0')
  })

  it('renders StepNote when stepNote prop is provided', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        stepNote: { note: 'This worked well', date: '2026-02-05' }
      }
    })

    expect(wrapper.find('.step-note-stub').exists()).toBe(true)
    expect(wrapper.text()).toContain('This worked well')
  })

  it('does not render StepNote when stepNote is undefined', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.find('.step-note-stub').exists()).toBe(false)
  })

  it('renders multiple notes', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [
            { text: 'First note', critical: false },
            { text: 'Second note', critical: true }
          ]
        }
      }
    })

    expect(wrapper.text()).toContain('First note')
    expect(wrapper.text()).toContain('Second note')
  })

  it('sets data-state-id attribute', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    const el = wrapper.find('[data-state-id="mix-dough"]')
    expect(el.exists()).toBe(true)
  })

  it('renders agent-sourced notes with Agent Tip label', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'Stretch dough to check gluten development', critical: false, source: 'agent' as const }]
        }
      }
    })

    expect(wrapper.text()).toContain('// Agent Tip')
    expect(wrapper.text()).toContain('Stretch dough to check gluten development')
    const noteDiv = wrapper.find('.bg-stone-100.text-stone-600')
    expect(noteDiv.exists()).toBe(true)
  })

  it('renders agent-sourced notes without yellow styling even if critical', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'Important agent tip', critical: true, source: 'agent' as const }]
        }
      }
    })

    // Should have agent label, not yellow styling
    expect(wrapper.text()).toContain('// Agent Tip')
    expect(wrapper.find('.bg-accent-tint').exists()).toBe(false)
    expect(wrapper.find('.bg-stone-100.text-stone-600').exists()).toBe(true)
  })
})

function makeScratchpad() {
  return {
    load: vi.fn(),
    addNote: vi.fn(),
    addRating: vi.fn(),
    addReminderResponse: vi.fn(),
    addGeneralNote: vi.fn(),
    dismissReminder: vi.fn(),
    isReminderDismissed: vi.fn(() => false),
    getEntriesForStep: vi.fn(() => []),
    getRatingForStep: vi.fn(() => null),
    hasEntriesForStep: vi.fn(() => false),
    totalEntryCount: { value: 0 },
    generalNoteCount: { value: 0 },
    generalNotes: { value: [] },
    exportJson: vi.fn(),
    exportJsonString: vi.fn(),
    clearAll: vi.fn()
  }
}

describe('StateStep scratchpad integration', () => {
  it('renders ScratchpadNote when scratchpad prop is provided', () => {
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, scratchpad: makeScratchpad() }
    })
    expect(wrapper.find('.scratchpad-note-stub').exists()).toBe(true)
  })

  it('does not render ScratchpadNote when scratchpad is not provided', () => {
    const wrapper = mount(StateStep, { props: defaultProps })
    expect(wrapper.find('.scratchpad-note-stub').exists()).toBe(false)
  })

  it('calls scratchpad.addNote via handleAddNote', async () => {
    const sp = makeScratchpad()
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, scratchpad: sp }
    })
    const stub = wrapper.findComponent({ name: 'ScratchpadNote' })
    stub.vm.$emit('addNote', 'mix-dough', 'test note')
    await wrapper.vm.$nextTick()
    expect(sp.addNote).toHaveBeenCalledWith('mix-dough', 'test note')
  })

  it('calls scratchpad.addRating via handleAddRating', async () => {
    const sp = makeScratchpad()
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, scratchpad: sp }
    })
    const stub = wrapper.findComponent({ name: 'ScratchpadNote' })
    stub.vm.$emit('addRating', 'mix-dough', 'good')
    await wrapper.vm.$nextTick()
    expect(sp.addRating).toHaveBeenCalledWith('mix-dough', 'good')
  })

  it('calls scratchpad.addReminderResponse via handleReminderRespond', async () => {
    const sp = makeScratchpad()
    const wrapper = mount(StateStep, {
      props: { ...defaultProps, scratchpad: sp }
    })
    const stub = wrapper.findComponent({ name: 'ScratchpadNote' })
    stub.vm.$emit('respond', 'mix-dough', 'Weigh dough', '748g')
    await wrapper.vm.$nextTick()
    expect(sp.addReminderResponse).toHaveBeenCalledWith('mix-dough', 'Weigh dough', '748g')
  })

  it('shows reminder banner when step is active and has reminders', () => {
    const sp = makeScratchpad()
    const stateWithReminders = {
      ...defaultState,
      reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
    }
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: stateWithReminders,
        scratchpad: sp,
        isActiveStep: true
      }
    })
    expect(wrapper.find('.reminder-banner-stub').exists()).toBe(true)
  })

  it('does not show reminder banner when step is not active', () => {
    const sp = makeScratchpad()
    const stateWithReminders = {
      ...defaultState,
      reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
    }
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: stateWithReminders,
        scratchpad: sp,
        isActiveStep: false
      }
    })
    expect(wrapper.find('.reminder-banner-stub').exists()).toBe(false)
  })

  it('calls scratchpad.dismissReminder via reminder banner dismiss', async () => {
    const sp = makeScratchpad()
    const stateWithReminders = {
      ...defaultState,
      reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
    }
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: stateWithReminders,
        scratchpad: sp,
        isActiveStep: true
      }
    })
    const banner = wrapper.findComponent({ name: 'ReminderBanner' })
    banner.vm.$emit('dismiss', 'mix-dough', 'Weigh dough')
    await wrapper.vm.$nextTick()
    expect(sp.dismissReminder).toHaveBeenCalledWith('mix-dough', 'Weigh dough')
  })
})
