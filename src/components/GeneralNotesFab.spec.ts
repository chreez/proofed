import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import GeneralNotesFab from './GeneralNotesFab.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  MessageSquare: { name: 'MessageSquare', template: '<svg class="message-square-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Download: { name: 'Download', template: '<svg class="download-icon" />' },
  Trash2: { name: 'Trash2', template: '<svg class="trash-icon" />' },
  Check: { name: 'Check', template: '<svg class="check-icon" />' }
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
  stepEntries: {} as Record<string, ReturnType<typeof makeEntry>[]>,
  stepNames: {} as Record<string, string>
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

  describe('flat chronological entries', () => {
    it('shows entry count label when entries exist', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 2,
        totalEntryCount: 2,
        generalNotes: [
          makeEntry({ value: 'First observation', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Second observation', timestamp: '2026-01-01T13:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('entries (2)')
    })

    it('does not show entries section when no entries', async () => {
      const wrapper = mountWithTeleport(defaultProps)

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).not.toContain('entries (')
    })

    it('mixes general and step entries in chronological order (newest first)', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 1,
        totalEntryCount: 3,
        generalNotes: [
          makeEntry({ value: 'General middle', timestamp: '2026-01-01T12:00:00Z' })
        ],
        stepEntries: {
          'MIX_FILLING': [
            makeEntry({ stepId: 'MIX_FILLING', value: 'Step oldest', timestamp: '2026-01-01T11:00:00Z' }),
            makeEntry({ stepId: 'MIX_FILLING', value: 'Step newest', timestamp: '2026-01-01T13:00:00Z' })
          ]
        },
        stepNames: { 'MIX_FILLING': 'Mix Filling' }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('entries (3)')

      // All 3 should be visible (within default limit)
      const entryCards = wrapper.findAll('.bg-stone-50.border.border-stone-200.p-2')
      expect(entryCards.length).toBe(3)

      // Verify order: newest first
      expect(entryCards[0].text()).toContain('Step newest')
      expect(entryCards[1].text()).toContain('General middle')
      expect(entryCards[2].text()).toContain('Step oldest')
    })

    it('shows origin label "general" for general notes', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 1,
        totalEntryCount: 1,
        generalNotes: [makeEntry({ value: 'A general note' })]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('general')
      expect(wrapper.text()).toContain('A general note')
    })

    it('shows step name as origin for step entries', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'MIX_FILLING': [makeEntry({ stepId: 'MIX_FILLING', value: 'Sticky' })]
        },
        stepNames: { 'MIX_FILLING': 'Mix Filling' }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('Mix Filling')
      expect(wrapper.text()).toContain('Sticky')
    })

    it('falls back to stepId when stepNames has no entry', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'UNKNOWN_STEP': [makeEntry({ stepId: 'UNKNOWN_STEP', value: 'Mystery' })]
        },
        stepNames: {}
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('UNKNOWN_STEP')
    })

    it('shows entry type labels correctly', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 3,
        stepEntries: {
          'step-1': [
            makeEntry({ stepId: 'step-1', type: 'reminder_response', value: '748g', prompt: 'Weigh dough', timestamp: '2026-01-01T13:00:00Z' }),
            makeEntry({ stepId: 'step-1', type: 'rating', value: 'good', timestamp: '2026-01-01T12:00:00Z' }),
            makeEntry({ stepId: 'step-1', type: 'note', value: 'looks great', timestamp: '2026-01-01T11:00:00Z' })
          ]
        },
        stepNames: { 'step-1': 'Step One' }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('reminder') // reminder_response shows as "reminder"
      expect(wrapper.text()).toContain('rating')
      expect(wrapper.text()).toContain('note')
      expect(wrapper.text()).toContain('Weigh dough') // prompt text
    })

    it('filters out empty step entry arrays', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        totalEntryCount: 1,
        stepEntries: {
          'step-1': [makeEntry({ stepId: 'step-1', value: 'has entry' })],
          'step-2': [] // empty - should not contribute entries
        },
        stepNames: { 'step-1': 'Step One', 'step-2': 'Step Two' }
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('entries (1)')
      expect(wrapper.text()).toContain('Step One')
      expect(wrapper.text()).not.toContain('Step Two')
    })
  })

  describe('3-latest default with "Show N more"', () => {
    it('shows only 3 entries by default when more exist', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 5,
        totalEntryCount: 5,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Note 3', timestamp: '2026-01-01T13:00:00Z' }),
          makeEntry({ value: 'Note 4', timestamp: '2026-01-01T14:00:00Z' }),
          makeEntry({ value: 'Note 5', timestamp: '2026-01-01T15:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Should show entries (5) header
      expect(wrapper.text()).toContain('entries (5)')

      // Only 3 entry cards visible
      const entryCards = wrapper.findAll('.bg-stone-50.border.border-stone-200.p-2')
      expect(entryCards.length).toBe(3)

      // Newest 3 should be visible (sorted desc)
      expect(wrapper.text()).toContain('Note 5')
      expect(wrapper.text()).toContain('Note 4')
      expect(wrapper.text()).toContain('Note 3')
      expect(wrapper.text()).not.toContain('Note 2')
      expect(wrapper.text()).not.toContain('Note 1')
    })

    it('shows "Show N more" button when entries exceed 3', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 5,
        totalEntryCount: 5,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Note 3', timestamp: '2026-01-01T13:00:00Z' }),
          makeEntry({ value: 'Note 4', timestamp: '2026-01-01T14:00:00Z' }),
          makeEntry({ value: 'Note 5', timestamp: '2026-01-01T15:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).toContain('Show 2 more')
    })

    it('does not show "Show N more" when 3 or fewer entries', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 2,
        totalEntryCount: 2,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      expect(wrapper.text()).not.toContain('Show')
      expect(wrapper.text()).not.toContain('more')
    })

    it('expands all entries on "Show N more" click', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 5,
        totalEntryCount: 5,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Note 3', timestamp: '2026-01-01T13:00:00Z' }),
          makeEntry({ value: 'Note 4', timestamp: '2026-01-01T14:00:00Z' }),
          makeEntry({ value: 'Note 5', timestamp: '2026-01-01T15:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Click "Show 2 more"
      const showMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Show 2 more'))
      expect(showMoreBtn).toBeTruthy()
      await showMoreBtn!.trigger('click')

      // Now all 5 should be visible
      const entryCards = wrapper.findAll('.bg-stone-50.border.border-stone-200.p-2')
      expect(entryCards.length).toBe(5)

      expect(wrapper.text()).toContain('Note 1')
      expect(wrapper.text()).toContain('Note 2')
    })

    it('shows "Show less" after expanding', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 4,
        totalEntryCount: 4,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Note 3', timestamp: '2026-01-01T13:00:00Z' }),
          makeEntry({ value: 'Note 4', timestamp: '2026-01-01T14:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      const showMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Show 1 more'))
      await showMoreBtn!.trigger('click')

      expect(wrapper.text()).toContain('Show less')
    })

    it('collapses back to 3 on "Show less" click', async () => {
      const wrapper = mountWithTeleport({
        ...defaultProps,
        generalNoteCount: 5,
        totalEntryCount: 5,
        generalNotes: [
          makeEntry({ value: 'Note 1', timestamp: '2026-01-01T11:00:00Z' }),
          makeEntry({ value: 'Note 2', timestamp: '2026-01-01T12:00:00Z' }),
          makeEntry({ value: 'Note 3', timestamp: '2026-01-01T13:00:00Z' }),
          makeEntry({ value: 'Note 4', timestamp: '2026-01-01T14:00:00Z' }),
          makeEntry({ value: 'Note 5', timestamp: '2026-01-01T15:00:00Z' })
        ]
      })

      const fab = wrapper.find('button[aria-label="Open bake scratchpad"]')
      await fab.trigger('click')

      // Expand
      const showMoreBtn = wrapper.findAll('button').find(b => b.text().includes('Show 2 more'))
      await showMoreBtn!.trigger('click')

      // Collapse
      const showLessBtn = wrapper.findAll('button').find(b => b.text().includes('Show less'))
      await showLessBtn!.trigger('click')

      // Back to 3
      const entryCards = wrapper.findAll('.bg-stone-50.border.border-stone-200.p-2')
      expect(entryCards.length).toBe(3)

      expect(wrapper.text()).toContain('Show 2 more')
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
