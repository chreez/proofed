import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import StateStep from './StateStep.vue'
import { SCALING_MULTIPLIER_KEY } from '@/composables/scalingKey'

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
    props: ['stepId', 'stepName', 'reminders', 'hasEntries'],
    emits: ['addNote', 'respond'],
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
vi.mock('@/components/TempText.vue', () => ({
  default: {
    name: 'TempText',
    props: ['text'],
    template: '<span class="temp-text-stub">{{ text }}</span>'
  }
}))
vi.mock('@/composables/useScrollToNext', () => ({
  scrollToStageAfterTransition: vi.fn()
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

describe('StateStep state note tables (PF-180)', () => {
  const tableNote = {
    text: 'Fermentation reference — warmer dough needs less aliquot rise.',
    critical: false,
    source: 'agent' as const,
    table: {
      caption: 'Fermentation chart — adjust target aliquot rise based on dough temperature',
      source: 'Adapted from The Sourdough Journey',
      headers: [
        { label: 'DOUGH TEMP', type: 'temperature' as const },
        { label: 'TARGET RISE', type: 'percent' as const }
      ],
      rows: [
        ['74°F', 80],
        ['76°F', 75],
        ['78°F', 70],
        ['80°F', 60],
        ['82°F', 50]
      ]
    }
  }

  it('does not render a table when note.table is absent', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'Plain note with no table', critical: false }]
        }
      }
    })

    expect(wrapper.find('.sn-table').exists()).toBe(false)
    expect(wrapper.find('.sn-table-block').exists()).toBe(false)
  })

  it('renders a structured table when note.table is present', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [tableNote]
        }
      }
    })

    // Table block rendered
    expect(wrapper.find('.sn-table').exists()).toBe(true)
    // Headers
    const headers = wrapper.findAll('.sn-th')
    expect(headers.length).toBe(2)
    expect(headers[0].text()).toBe('DOUGH TEMP')
    expect(headers[1].text()).toBe('TARGET RISE')
    // Numeric header right-aligned
    expect(headers[1].classes()).toContain('sn-th-right')
    // Rows
    const rows = wrapper.findAll('tbody tr')
    expect(rows.length).toBe(5)
    // Percent cells render with % suffix
    expect(wrapper.text()).toContain('80%')
    expect(wrapper.text()).toContain('50%')
    // Temperature cells delegated to TempText stub
    const tempStubs = wrapper.findAll('.temp-text-stub')
    expect(tempStubs.length).toBe(5)
    expect(tempStubs[0].text()).toBe('74°F')
    // Caption and source
    expect(wrapper.text()).toContain('Fermentation chart — adjust target aliquot rise based on dough temperature')
    expect(wrapper.text()).toContain('Adapted from The Sourdough Journey')
  })

  it('lead-in text renders above the table', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [tableNote]
        }
      }
    })

    expect(wrapper.text()).toContain('Fermentation reference — warmer dough needs less aliquot rise.')
    // Block container is present
    expect(wrapper.find('.sn-table-block').exists()).toBe(true)
  })

  it('right-aligns percent and number cells via sn-td-right', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [tableNote]
        }
      }
    })

    const cells = wrapper.findAll('.sn-td')
    // 5 rows * 2 cols = 10 cells. Every odd-index cell (percent col) should be right-aligned + mono.
    const percentCells = cells.filter((_, i) => i % 2 === 1)
    percentCells.forEach((cell) => {
      expect(cell.classes()).toContain('sn-td-right')
      expect(cell.classes()).toContain('sn-td-mono')
    })
  })

  it('wraps table in an overflow-x scroll container for mobile', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [tableNote]
        }
      }
    })

    const scroll = wrapper.find('.sn-table-scroll')
    expect(scroll.exists()).toBe(true)
    // Table must live inside the scroll wrapper
    expect(scroll.find('.sn-table').exists()).toBe(true)
  })

  it('matches snapshot for note WITHOUT a table', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{ text: 'Plain note with no table', critical: false }]
        }
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('matches snapshot for note WITH a fermentation-chart table', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [tableNote]
        }
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })

  it('renders text and number cell types correctly', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{
            text: '',
            critical: false,
            source: 'agent' as const,
            table: {
              headers: [
                { label: 'STAGE', type: 'text' as const },
                { label: 'MINUTES', type: 'number' as const }
              ],
              rows: [
                ['Autolyse', 30],
                ['Bulk', 240]
              ]
            }
          }]
        }
      }
    })

    // Text cells don't get sn-td-right or sn-td-mono
    const cells = wrapper.findAll('.sn-td')
    expect(cells.length).toBe(4)
    // Index 0, 2 are text cells — left aligned regular weight
    expect(cells[0].classes()).not.toContain('sn-td-right')
    expect(cells[0].classes()).not.toContain('sn-td-mono')
    expect(cells[0].text()).toBe('Autolyse')
    // Index 1, 3 are number cells — right aligned mono
    expect(cells[1].classes()).toContain('sn-td-right')
    expect(cells[1].classes()).toContain('sn-td-mono')
    expect(cells[1].text()).toBe('30')
    // No caption or source paragraphs
    expect(wrapper.find('.sn-table-caption').exists()).toBe(false)
    expect(wrapper.find('.sn-table-source').exists()).toBe(false)
  })

  it('renders without caption and source when those fields are omitted', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{
            text: 'Lead-in only',
            critical: false,
            source: 'agent' as const,
            table: {
              headers: [
                { label: 'TEMP' },
                { label: 'NOTE' }
              ],
              rows: [['74°F', 'cool']]
            }
          }]
        }
      }
    })

    expect(wrapper.find('.sn-table').exists()).toBe(true)
    expect(wrapper.find('.sn-table-caption').exists()).toBe(false)
    expect(wrapper.find('.sn-table-source').exists()).toBe(false)
    // Untyped headers default to no right alignment
    const headers = wrapper.findAll('.sn-th')
    expect(headers[0].classes()).not.toContain('sn-th-right')
    expect(headers[1].classes()).not.toContain('sn-th-right')
  })

  it('linkifies https URLs inside the table source', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{
            text: '',
            critical: false,
            source: 'agent' as const,
            table: {
              source: 'The Sourdough Journey V2.0 — https://thesourdoughjourney.com/the-ultimate-sourdough-bulk-fermentation-guide/',
              headers: [{ label: 'TEMP' }],
              rows: [['65°F']]
            }
          }]
        }
      }
    })

    const link = wrapper.find('.sn-table-source-link')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe(
      'https://thesourdoughjourney.com/the-ultimate-sourdough-bulk-fermentation-guide/'
    )
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
    // The non-URL prefix should still render as text in the source paragraph
    expect(wrapper.find('.sn-table-source').text()).toContain('The Sourdough Journey V2.0')
  })

  it('renders plain text source with no anchor when source has no URL', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{
            text: '',
            critical: false,
            source: 'agent' as const,
            table: {
              source: 'Adapted from The Sourdough Journey',
              headers: [{ label: 'TEMP' }],
              rows: [['74°F']]
            }
          }]
        }
      }
    })

    expect(wrapper.find('.sn-table-source').exists()).toBe(true)
    expect(wrapper.find('.sn-table-source-link').exists()).toBe(false)
    expect(wrapper.find('.sn-table-source').text()).toBe('Adapted from The Sourdough Journey')
  })

  it('linkifies multiple URLs in the same source string', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          notes: [{
            text: '',
            critical: false,
            source: 'agent' as const,
            table: {
              source: 'Primary: https://example.com/chart and mirror: https://example.org/backup',
              headers: [{ label: 'TEMP' }],
              rows: [['74°F']]
            }
          }]
        }
      }
    })

    const links = wrapper.findAll('.sn-table-source-link')
    expect(links.length).toBe(2)
    expect(links[0].attributes('href')).toBe('https://example.com/chart')
    expect(links[1].attributes('href')).toBe('https://example.org/backup')
  })
})

function makeScratchpad() {
  return {
    load: vi.fn(),
    addNote: vi.fn(),
    addReminderResponse: vi.fn(),
    addGeneralNote: vi.fn(),
    dismissReminder: vi.fn(),
    isReminderDismissed: vi.fn(() => false),
    getEntriesForStep: vi.fn(() => []),
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

describe('StateStep scaling', () => {
  it('scales component amounts when multiplier is provided', () => {
    const multiplier = ref(2)
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          components: [{ name: 'Flour', amount: '390g' }, { name: 'Water', amount: '250ml' }]
        }
      },
      global: { provide: { [SCALING_MULTIPLIER_KEY]: multiplier } }
    })
    expect(wrapper.text()).toContain('780g')
    expect(wrapper.text()).toContain('500ml')
  })

  it('shows original amounts at 1× multiplier', () => {
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          components: [{ name: 'Flour', amount: '390g' }]
        }
      }
    })
    expect(wrapper.text()).toContain('390g')
  })

  it('handles non-numeric component amounts gracefully', () => {
    const multiplier = ref(2)
    const wrapper = mount(StateStep, {
      props: {
        ...defaultProps,
        state: {
          ...defaultState,
          components: [{ name: 'Salt', amount: 'to taste' }]
        }
      },
      global: { provide: { [SCALING_MULTIPLIER_KEY]: multiplier } }
    })
    expect(wrapper.text()).toContain('to taste')
  })
})
