import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GeneralNotesFab from './GeneralNotesFab.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  MessageSquare: { name: 'MessageSquare', template: '<svg class="message-square-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Download: { name: 'Download', template: '<svg class="download-icon" />' },
  Trash2: { name: 'Trash2', template: '<svg class="trash-icon" />' },
  Check: { name: 'Check', template: '<svg class="check-icon" />' },
  ChevronDown: { name: 'ChevronDown', template: '<svg class="chevron-down-icon" />' },
  ChevronRight: { name: 'ChevronRight', template: '<svg class="chevron-right-icon" />' }
}))

// Mock IconButton
vi.mock('@/components/IconButton.vue', () => ({
  default: {
    name: 'IconButton',
    props: ['tooltip', 'size', 'tooltipAlign'],
    emits: ['click'],
    template: '<button class="icon-btn-stub" :title="tooltip" @click="$emit(\'click\')"><slot /></button>',
    methods: {
      flashCopied: vi.fn()
    }
  }
}))

function makeEntry(overrides: Partial<{
  stepId: string
  timestamp: string
  type: 'note' | 'rating' | 'reminder_response'
  value: string
  prompt?: string
}> = {}) {
  return {
    stepId: overrides.stepId ?? '_general',
    timestamp: overrides.timestamp ?? '2026-01-01T12:00:00Z',
    type: overrides.type ?? 'note' as const,
    value: overrides.value ?? 'test note',
    ...overrides
  }
}

const defaultProps = {
  generalNoteCount: 0,
  totalEntryCount: 0,
  generalNotes: [] as ReturnType<typeof makeEntry>[],
  stepEntries: {} as Record<string, ReturnType<typeof makeEntry>[]>
}

// Since GeneralNotesFab uses Teleport, we need a teleport target in the DOM
function mountWithTeleport(props: typeof defaultProps) {
  return mount(GeneralNotesFab, {
    props,
    global: {
      stubs: {
        Teleport: true
      }
    }
  })
}

describe('GeneralNotesFab', () => {
  describe('FAB button', () => {
    it('renders FAB buttons (desktop + mobile)', () => {
      const wrapper = mountWithTeleport(defaultProps)

      // Both desktop and mobile FAB buttons
      const buttons = wrapper.findAll('button[aria-label="Open bake scratchpad"]')
      expect(buttons.length).toBe(2) // desktop + mobile
    })

    it('shows MessageSquare icon when closed', () => {
      const wrapper = mountWithTeleport(defaultProps)

      expect(wrapper.findAll('.message-square-icon').length).toBeGreaterThan(0)
    })

    it('shows X icon when open', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.findAll('.x-icon').length).toBeGreaterThan(0)
    })

    it('does not show badge when totalEntryCount is 0', () => {
      const wrapper = mountWithTeleport(defaultProps)

      // No badge span (absolute positioned)
      const badges = wrapper.findAll('span.absolute')
      expect(badges.length).toBe(0)
    })

    it('shows badge with total count when entries exist and panel closed', () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 3
      })

      const badges = wrapper.findAll('span.absolute')
      expect(badges.length).toBeGreaterThan(0)
      expect(badges[0].text()).toBe('3')
    })

    it('shows 9+ when totalEntryCount exceeds 9', () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 15
      })

      const badges = wrapper.findAll('span.absolute')
      expect(badges[0].text()).toBe('9+')
    })

    it('hides badge when panel is open', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 3
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // When open, badge should not render (v-if includes !isOpen)
      const badges = wrapper.findAll('span.absolute')
      expect(badges.length).toBe(0)
    })
  })

  describe('panel toggle', () => {
    it('opens panel on FAB click', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('Bake Scratchpad')
    })

    it('closes panel on second FAB click', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')
      expect(wrapper.text()).toContain('Bake Scratchpad')

      await fab.trigger('click')
      expect(wrapper.text()).not.toContain('Bake Scratchpad')
    })

    it('changes FAB styling when open', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      expect(fab.classes()).toContain('bg-ink')

      await fab.trigger('click')
      expect(fab.classes()).toContain('bg-accent')
    })
  })

  describe('general notes display', () => {
    it('shows general notes when they exist', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 2,
        totalEntryCount: 2,
        generalNotes: [
          makeEntry({ value: 'First observation' }),
          makeEntry({ value: 'Second observation' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('notes (2)')
      expect(wrapper.text()).toContain('First observation')
      expect(wrapper.text()).toContain('Second observation')
    })

    it('does not show notes section when no general notes', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).not.toContain('notes (0)')
    })
  })

  describe('step entries display', () => {
    it('shows step entry count with expand toggle', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 2,
        stepEntries: {
          'mix-dough': [
            makeEntry({ stepId: 'mix-dough', value: 'Sticky' }),
            makeEntry({ stepId: 'mix-dough', value: 'Added more flour' })
          ]
        }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('2 step-specific entries')
    })

    it('shows singular label for 1 entry', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'mix-dough': [makeEntry({ stepId: 'mix-dough' })]
        }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('1 step-specific entry')
    })

    it('expands step entries on toggle click', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'mix-dough': [makeEntry({ stepId: 'mix-dough', value: 'Sticky dough' })]
        }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Find the expand button
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('step-specific'))
      expect(expandBtn).toBeTruthy()

      // Initially collapsed - should show ChevronRight
      expect(wrapper.findAll('.chevron-right-icon').length).toBeGreaterThan(0)

      await expandBtn!.trigger('click')

      // Now expanded - should show ChevronDown and step entries
      expect(wrapper.findAll('.chevron-down-icon').length).toBeGreaterThan(0)
      expect(wrapper.text()).toContain('mix-dough')
      expect(wrapper.text()).toContain('Sticky dough')
    })

    it('shows entry type labels correctly', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 2,
        stepEntries: {
          'step-1': [
            makeEntry({ stepId: 'step-1', type: 'reminder_response', value: '748g', prompt: 'Weigh dough' }),
            makeEntry({ stepId: 'step-1', type: 'rating', value: 'good' })
          ]
        }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Expand step entries
      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('step-specific'))
      await expandBtn!.trigger('click')

      expect(wrapper.text()).toContain('reminder') // reminder_response shows as "reminder"
      expect(wrapper.text()).toContain('rating')
      expect(wrapper.text()).toContain('Weigh dough') // prompt text
    })

    it('does not show step entries section when stepEntryCount is 0', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).not.toContain('step-specific')
    })

    it('filters out empty step entry arrays', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'step-1': [makeEntry({ stepId: 'step-1', value: 'has entry' })],
          'step-2': [] // empty - should not show
        }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const expandBtn = wrapper.findAll('button').find(b => b.text().includes('step-specific'))
      await expandBtn!.trigger('click')

      expect(wrapper.text()).toContain('step-1')
      expect(wrapper.text()).not.toContain('step-2')
    })
  })

  describe('new note input', () => {
    it('emits addGeneralNote on Save click', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('Overall observation')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect(wrapper.emitted('addGeneralNote')).toBeTruthy()
      expect(wrapper.emitted('addGeneralNote')![0]).toEqual(['Overall observation'])
    })

    it('clears textarea after saving', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('My note')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })

    it('does not emit addGeneralNote when textarea is empty', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect(wrapper.emitted('addGeneralNote')).toBeFalsy()
    })

    it('shows hint text for cmd+enter shortcut', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('cmd+enter to save')
    })
  })

  describe('header actions', () => {
    it('emits exportJson when export button clicked', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Find the export button (IconButton with tooltip "Copy JSON")
      const exportBtn = wrapper.findAll('.icon-btn-stub').find(b => b.attributes('title') === 'Copy JSON')
      expect(exportBtn).toBeTruthy()
      await exportBtn!.trigger('click')

      expect(wrapper.emitted('exportJson')).toBeTruthy()
    })

    it('shows clear button only when entries exist', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Should not have clear button when totalEntryCount is 0
      const clearBtn = wrapper.findAll('.icon-btn-stub').find(b => b.attributes('title') === 'Clear all')
      expect(clearBtn).toBeFalsy()
    })

    it('shows clear button when entries exist', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 3,
        generalNotes: [makeEntry()]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const clearBtn = wrapper.findAll('.icon-btn-stub').find(b => b.attributes('title') === 'Clear all')
      expect(clearBtn).toBeTruthy()
    })

    it('emits clearAll when clear button clicked', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        generalNotes: [makeEntry()]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const clearBtn = wrapper.findAll('.icon-btn-stub').find(b => b.attributes('title') === 'Clear all')
      await clearBtn!.trigger('click')

      expect(wrapper.emitted('clearAll')).toBeTruthy()
    })

    it('closes panel via close button in header', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')
      expect(wrapper.text()).toContain('Bake Scratchpad')

      const closeBtn = wrapper.findAll('.icon-btn-stub').find(b => b.attributes('title') === 'Close')
      await closeBtn!.trigger('click')

      expect(wrapper.text()).not.toContain('Bake Scratchpad')
    })
  })
})
