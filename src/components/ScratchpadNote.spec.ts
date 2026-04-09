import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ScratchpadNote from './ScratchpadNote.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  StickyNote: { name: 'StickyNote', template: '<svg class="sticky-note-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Bell: { name: 'Bell', template: '<svg class="bell-icon" />' }
}))

const defaultProps = {
  stepId: 'mix-dough',
  stepName: 'Mix the dough',
  entries: [],
  hasEntries: false
}

describe('ScratchpadNote', () => {
  describe('button rendering', () => {
    it('renders the icon button', () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      expect(wrapper.find('button').exists()).toBe(true)
      expect(wrapper.find('.sticky-note-icon').exists()).toBe(true)
    })

    it('shows neutral styling when no entries', () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      const button = wrapper.find('button')
      expect(button.classes()).toContain('text-stone-400')
    })

    it('shows accent styling when hasEntries is true', () => {
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries: [makeEntry()] }
      })
      const button = wrapper.find('button')
      expect(button.classes()).toContain('text-accent')
    })

    it('does not show badge when no entries', () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      expect(wrapper.find('span.absolute').exists()).toBe(false)
    })

    it('shows badge with entry count when hasEntries', () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          hasEntries: true,
          entries: [makeEntry(), makeEntry()]
        }
      })
      const badge = wrapper.find('span.absolute')
      expect(badge.exists()).toBe(true)
      expect(badge.text()).toBe('2')
    })

    it('shows 9+ when entries exceed 9', () => {
      const entries = Array.from({ length: 10 }, () => makeEntry())
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      const badge = wrapper.find('span.absolute')
      expect(badge.text()).toBe('9+')
    })
  })

  describe('popover toggle', () => {
    it('opens popover on click', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })

      expect(wrapper.find('.slide-down-enter-active, [class*="z-30"]').exists()).toBe(false)

      await wrapper.find('button').trigger('click')

      // Popover should be visible
      const popover = wrapper.find('.z-30')
      expect(popover.exists()).toBe(true)
    })

    it('closes popover on second click', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })

      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.z-30').exists()).toBe(true)

      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.z-30').exists()).toBe(false)
    })

    it('closes popover via X button', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })

      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.z-30').exists()).toBe(true)

      // Find the close button (has X icon)
      const closeBtn = wrapper.findAll('button').find(b => b.find('.x-icon').exists())
      expect(closeBtn).toBeTruthy()
      await closeBtn!.trigger('click')

      expect(wrapper.find('.z-30').exists()).toBe(false)
    })

    it('closes popover on Esc key from textarea', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })

      await wrapper.find('button').trigger('click')
      expect(wrapper.find('.z-30').exists()).toBe(true)

      const textarea = wrapper.find('textarea')
      await textarea.trigger('keydown', { key: 'Escape' })

      expect(wrapper.find('.z-30').exists()).toBe(false)
    })
  })

  describe('header', () => {
    it('shows stepName in header with stepId as secondary text', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('scratchpad: Mix the dough')
      expect(wrapper.text()).toContain('mix-dough')
    })
  })

  describe('entries display', () => {
    it('shows saved entries when hasEntries is true', async () => {
      const entries = [
        makeEntry({ type: 'note', value: 'Dough was sticky' }),
        makeEntry({ type: 'rating', value: 'good' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('notes (2)')
      expect(wrapper.text()).toContain('Dough was sticky')
    })

    it('shows reminder type label for reminder_response entries', async () => {
      const entries = [
        makeEntry({ type: 'reminder_response', value: '748g', prompt: 'Weigh dough' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('reminder')
      expect(wrapper.text()).toContain('Weigh dough')
      expect(wrapper.text()).toContain('748g')
    })

    it('does not show entries section when no entries', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).not.toContain('notes (')
    })
  })

  describe('reminders', () => {
    it('shows reminder prompts when reminders provided', async () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
        }
      })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).toContain('prompted')
      expect(wrapper.text()).toContain('Weigh dough')
    })

    it('does not show reminders section when no reminders', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      expect(wrapper.text()).not.toContain('prompted')
    })

    it('emits respond when Log button clicked with value', async () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
        }
      })
      await wrapper.find('button').trigger('click')

      // Type into the reminder input
      const reminderInput = wrapper.find('input')
      await reminderInput.setValue('748g')

      // Click the Log button
      const logBtn = wrapper.findAll('button').find(b => b.text() === 'Log')
      await logBtn!.trigger('click')

      expect(wrapper.emitted('respond')).toBeTruthy()
      expect(wrapper.emitted('respond')![0]).toEqual(['mix-dough', 'Weigh dough', '748g'])
    })

    it('does not emit respond when value is empty', async () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
        }
      })
      await wrapper.find('button').trigger('click')

      // Click Log without typing
      const logBtn = wrapper.findAll('button').find(b => b.text() === 'Log')
      await logBtn!.trigger('click')

      expect(wrapper.emitted('respond')).toBeFalsy()
    })

    it('emits respond on Enter in reminder input', async () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
        }
      })
      await wrapper.find('button').trigger('click')

      const reminderInput = wrapper.find('input')
      await reminderInput.setValue('748g')
      await reminderInput.trigger('keydown.enter')

      expect(wrapper.emitted('respond')).toBeTruthy()
      expect(wrapper.emitted('respond')![0]).toEqual(['mix-dough', 'Weigh dough', '748g'])
    })

    it('clears reminder input after responding', async () => {
      const wrapper = mount(ScratchpadNote, {
        props: {
          ...defaultProps,
          reminders: [{ prompt: 'Weigh dough', type: 'measurement' as const }]
        }
      })
      await wrapper.find('button').trigger('click')

      const reminderInput = wrapper.find('input')
      await reminderInput.setValue('748g')

      const logBtn = wrapper.findAll('button').find(b => b.text() === 'Log')
      await logBtn!.trigger('click')

      expect((reminderInput.element as HTMLInputElement).value).toBe('')
    })
  })

  describe('freeform note', () => {
    it('emits addNote on Save click', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('My note')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect(wrapper.emitted('addNote')).toBeTruthy()
      expect(wrapper.emitted('addNote')![0]).toEqual(['mix-dough', 'My note'])
    })

    it('clears textarea after saving', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('My note')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect((textarea.element as HTMLTextAreaElement).value).toBe('')
    })

    it('does not emit addNote when textarea is empty', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      const saveBtn = wrapper.findAll('button').find(b => b.text() === 'Save')
      await saveBtn!.trigger('click')

      expect(wrapper.emitted('addNote')).toBeFalsy()
    })

    it('saves on Enter (not shift+enter)', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('My note')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: false })

      expect(wrapper.emitted('addNote')).toBeTruthy()
    })

    it('does not save on shift+enter', async () => {
      const wrapper = mount(ScratchpadNote, { props: defaultProps })
      await wrapper.find('button').trigger('click')

      const textarea = wrapper.find('textarea')
      await textarea.setValue('My note')
      await textarea.trigger('keydown', { key: 'Enter', shiftKey: true })

      expect(wrapper.emitted('addNote')).toBeFalsy()
    })
  })
})

function makeEntry(overrides: Partial<{
  stepId: string
  timestamp: string
  type: 'note' | 'rating' | 'reminder_response'
  value: string
  prompt?: string
  rating?: 'good' | 'ok' | 'bad'
}> = {}) {
  return {
    stepId: 'mix-dough',
    timestamp: '2026-01-01T12:00:00Z',
    type: 'note' as const,
    value: 'test note',
    ...overrides
  }
}
