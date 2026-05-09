import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import ScratchpadNote from './ScratchpadNote.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  StickyNote: { name: 'StickyNote', template: '<svg class="sticky-note-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Bell: { name: 'Bell', template: '<svg class="bell-icon" />' },
  Pencil: { name: 'Pencil', template: '<svg class="pencil-icon" />' },
  Trash2: { name: 'Trash2', template: '<svg class="trash-icon" />' }
}))

// Mock useMediaQuery to simulate mobile viewport (isDesktop = false)
vi.mock('@/composables/useMediaQuery', () => ({
  useMediaQuery: () => ({ matches: ref(false) })
}))

const defaultProps = {
  stepId: 'mix-dough',
  stepName: 'Mix the dough',
  entries: [],
  hasEntries: false
}

function makeEntry(overrides: Partial<{
  type: 'note' | 'rating' | 'reminder_response'
  value: string
  prompt?: string
}> = {}) {
  return {
    stepId: 'mix-dough',
    timestamp: '2026-01-01T12:00:00Z',
    type: 'note' as const,
    value: 'test note',
    ...overrides
  }
}

// Stub Teleport so content renders inline (accessible via wrapper.findAll)
const mountOpts = {
  global: { stubs: { Teleport: true } }
}

async function openSheet(wrapper: ReturnType<typeof mount>): Promise<void> {
  await wrapper.find('button').trigger('click')
  await nextTick()
}

describe('ScratchpadNote mobile (bottom sheet)', () => {
  it('does not render desktop popover on mobile', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.find('.z-30').exists()).toBe(false)
  })

  it('renders bottom sheet content on mobile when opened', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    // Bottom sheet backdrop should exist in stubbed teleport
    expect(wrapper.find('[class*="bg-black"]').exists()).toBe(true)
  })

  it('shows stepName in bottom sheet title with stepId as subtitle', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.text()).toContain('Mix the dough')
    expect(wrapper.text()).toContain('mix-dough')
  })

  it('renders textarea in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.findAll('textarea').length).toBeGreaterThan(0)
  })

  it('emits addNote when Save clicked in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)

    const textarea = wrapper.find('textarea')
    await textarea.setValue('My mobile note')

    const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
    expect(saveBtn).toBeTruthy()
    await saveBtn!.trigger('click')

    expect(wrapper.emitted('addNote')).toBeTruthy()
    expect(wrapper.emitted('addNote')![0]).toEqual(['mix-dough', 'My mobile note'])
  })

  it('shows entries in bottom sheet when hasEntries is true', async () => {
    const entries = [
      makeEntry({ type: 'note', value: 'Dough was sticky' })
    ]
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, hasEntries: true, entries },
      ...mountOpts
    })
    await openSheet(wrapper)
    expect(wrapper.text()).toContain('notes (1)')
    expect(wrapper.text()).toContain('Dough was sticky')
  })

  it('shows reminders in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: {
        ...defaultProps,
        reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
      },
      ...mountOpts
    })
    await openSheet(wrapper)
    expect(wrapper.text()).toContain('prompted')
    expect(wrapper.text()).toContain('Weigh dough')
  })

  it('emits respond when Log button clicked in bottom sheet reminder', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: {
        ...defaultProps,
        reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
      },
      ...mountOpts
    })
    await openSheet(wrapper)

    const input = wrapper.find('input')
    await input.setValue('748g')

    const logBtn = wrapper.findAll('button').find(b => b.text() === 'Log')
    expect(logBtn).toBeTruthy()
    await logBtn!.trigger('click')

    expect(wrapper.emitted('respond')).toBeTruthy()
    expect(wrapper.emitted('respond')![0]).toEqual(['mix-dough', 'Weigh dough', '748g'])
  })

  it('shows measurement placeholder for measurement reminders', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: {
        ...defaultProps,
        reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
      },
      ...mountOpts
    })
    await openSheet(wrapper)

    const input = wrapper.find('input')
    expect(input.attributes('placeholder')).toBe('e.g. 748g')
  })

  it('has scrollable content area in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.find('.overflow-y-auto').exists()).toBe(true)
  })

  it('renders drag handle in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.find('.cursor-grab').exists()).toBe(true)
  })

  it('PF-239: renders pencil + trash icons per entry in bottom sheet', async () => {
    const entries = [
      makeEntry({ type: 'note', value: 'first' }),
      makeEntry({ type: 'note', value: 'second' })
    ]
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, hasEntries: true, entries },
      ...mountOpts
    })
    await openSheet(wrapper)

    expect(wrapper.findAll('[data-testid="edit-entry-btn"]').length).toBe(2)
    expect(wrapper.findAll('[data-testid="delete-entry-btn"]').length).toBe(2)
  })

  it('PF-239: edit + save in bottom sheet emits editEntry', async () => {
    const entries = [makeEntry({ value: 'orig' })]
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, hasEntries: true, entries },
      ...mountOpts
    })
    await openSheet(wrapper)

    await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')
    const editTextarea = wrapper.find('[data-testid="edit-entry-textarea"]')
    expect(editTextarea.exists()).toBe(true)
    await editTextarea.setValue('mobile updated')
    await wrapper.find('[data-testid="edit-save-btn"]').trigger('click')

    expect(wrapper.emitted('editEntry')).toBeTruthy()
    expect(wrapper.emitted('editEntry')![0]).toEqual(['mix-dough', 0, 'mobile updated'])
  })

  it('PF-239: delete with confirm in bottom sheet emits deleteEntry', async () => {
    const entries = [makeEntry({ value: 'doomed' })]
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, hasEntries: true, entries },
      ...mountOpts
    })
    await openSheet(wrapper)

    await wrapper.find('[data-testid="delete-entry-btn"]').trigger('click')
    const confirm = wrapper.find('[data-testid="delete-confirm"]')
    expect(confirm.exists()).toBe(true)
    await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')

    expect(wrapper.emitted('deleteEntry')).toBeTruthy()
    expect(wrapper.emitted('deleteEntry')![0]).toEqual(['mix-dough', 0])
  })
})
