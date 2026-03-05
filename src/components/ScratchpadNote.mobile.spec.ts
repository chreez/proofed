import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick, ref } from 'vue'
import ScratchpadNote from './ScratchpadNote.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  StickyNote: { name: 'StickyNote', template: '<svg class="sticky-note-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Bell: { name: 'Bell', template: '<svg class="bell-icon" />' }
}))

// Mock useMediaQuery to simulate mobile viewport (isDesktop = false)
vi.mock('@/composables/useMediaQuery', () => ({
  useMediaQuery: () => ({ matches: ref(false) })
}))

const defaultProps = {
  stepId: 'mix-dough',
  entries: [],
  hasEntries: false,
  currentRating: null as 'good' | 'ok' | 'bad' | null
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

  it('shows stepId in bottom sheet title', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.text()).toContain('scratchpad: mix-dough')
  })

  it('renders rating buttons in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)
    expect(wrapper.text()).toContain('Quick rating')
    expect(wrapper.text()).toContain('good')
    expect(wrapper.text()).toContain('ok')
    expect(wrapper.text()).toContain('bad')
  })

  it('emits addRating when rating button clicked in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, { props: defaultProps, ...mountOpts })
    await openSheet(wrapper)

    const ratingBtns = wrapper.findAll('button').filter(b => b.text() === 'good')
    expect(ratingBtns.length).toBeGreaterThan(0)
    await ratingBtns[0].trigger('click')

    expect(wrapper.emitted('addRating')).toBeTruthy()
    expect(wrapper.emitted('addRating')![0]).toEqual(['mix-dough', 'good'])
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

  it('highlights active good rating in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, currentRating: 'good' },
      ...mountOpts
    })
    await openSheet(wrapper)

    const goodBtn = wrapper.findAll('button').find(b => b.text() === 'good')
    expect(goodBtn!.classes()).toContain('bg-success')
  })

  it('shows warning styling for ok rating in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, currentRating: 'ok' },
      ...mountOpts
    })
    await openSheet(wrapper)

    const okBtn = wrapper.findAll('button').find(b => b.text() === 'ok')
    expect(okBtn!.classes()).toContain('bg-warning')
  })

  it('shows danger styling for bad rating in bottom sheet', async () => {
    const wrapper = mount(ScratchpadNote, {
      props: { ...defaultProps, currentRating: 'bad' },
      ...mountOpts
    })
    await openSheet(wrapper)

    const badBtn = wrapper.findAll('button').find(b => b.text() === 'bad')
    expect(badBtn!.classes()).toContain('bg-danger')
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
})
