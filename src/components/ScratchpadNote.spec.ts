import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import ScratchpadNote from './ScratchpadNote.vue'

// Mock lucide icons
vi.mock('lucide-vue-next', () => ({
  StickyNote: { name: 'StickyNote', template: '<svg class="sticky-note-icon" />' },
  X: { name: 'X', template: '<svg class="x-icon" />' },
  Bell: { name: 'Bell', template: '<svg class="bell-icon" />' },
  Pencil: { name: 'Pencil', template: '<svg class="pencil-icon" />' },
  Trash2: { name: 'Trash2', template: '<svg class="trash-icon" />' }
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

      expect(wrapper.text()).toContain('Mix the dough')
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

  describe('edit entry (PF-239)', () => {
    it('renders pencil + trash icons on every entry block', async () => {
      const entries = [
        makeEntry({ type: 'note', value: 'a' }),
        makeEntry({ type: 'rating', value: 'good' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      const editBtns = wrapper.findAll('[data-testid="edit-entry-btn"]')
      const deleteBtns = wrapper.findAll('[data-testid="delete-entry-btn"]')
      expect(editBtns.length).toBe(2)
      expect(deleteBtns.length).toBe(2)
      expect(wrapper.findAll('.pencil-icon').length).toBeGreaterThanOrEqual(2)
      expect(wrapper.findAll('.trash-icon').length).toBeGreaterThanOrEqual(2)
    })

    it('pencil click swaps the entry into edit mode with prefilled textarea', async () => {
      const entries = [makeEntry({ value: 'original' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      const editTextarea = wrapper.find<HTMLTextAreaElement>('[data-testid="edit-entry-textarea"]')
      expect(editTextarea.exists()).toBe(true)
      expect(editTextarea.element.value).toBe('original')
    })

    it('Enter saves edit and emits editEntry with index + new value', async () => {
      const entries = [makeEntry({ value: 'orig' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      const editTextarea = wrapper.find('[data-testid="edit-entry-textarea"]')
      await editTextarea.setValue('updated value')
      await editTextarea.trigger('keydown', { key: 'Enter', shiftKey: false })

      expect(wrapper.emitted('editEntry')).toBeTruthy()
      expect(wrapper.emitted('editEntry')![0]).toEqual(['mix-dough', 0, 'updated value'])
    })

    it('Save button click emits editEntry', async () => {
      const entries = [makeEntry({ value: 'orig' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      const editTextarea = wrapper.find('[data-testid="edit-entry-textarea"]')
      await editTextarea.setValue('via save btn')
      await wrapper.find('[data-testid="edit-save-btn"]').trigger('click')

      expect(wrapper.emitted('editEntry')).toBeTruthy()
      expect(wrapper.emitted('editEntry')![0]).toEqual(['mix-dough', 0, 'via save btn'])
    })

    it('Esc cancels edit and restores original (no emit)', async () => {
      const entries = [makeEntry({ value: 'keep me' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      const editTextarea = wrapper.find('[data-testid="edit-entry-textarea"]')
      await editTextarea.setValue('something else')
      await editTextarea.trigger('keydown', { key: 'Escape' })

      expect(wrapper.emitted('editEntry')).toBeFalsy()
      // Edit textarea is gone; original value still rendered
      expect(wrapper.find('[data-testid="edit-entry-textarea"]').exists()).toBe(false)
      expect(wrapper.text()).toContain('keep me')
    })

    it('Cancel button cancels edit (no emit)', async () => {
      const entries = [makeEntry({ value: 'orig' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      await wrapper.find('[data-testid="edit-cancel-btn"]').trigger('click')

      expect(wrapper.emitted('editEntry')).toBeFalsy()
      expect(wrapper.find('[data-testid="edit-entry-textarea"]').exists()).toBe(false)
    })

    it('only one entry is editable at a time per surface', async () => {
      const entries = [
        makeEntry({ value: 'a' }),
        makeEntry({ value: 'b' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      // Open edit on first entry
      const editBtns = wrapper.findAll('[data-testid="edit-entry-btn"]')
      await editBtns[0].trigger('click')

      // Now there should be exactly 1 edit textarea, and the second entry's
      // edit button should still be visible (not its own edit textarea)
      const textareasInEdit = wrapper.findAll('[data-testid="edit-entry-textarea"]')
      expect(textareasInEdit.length).toBe(1)

      // Click second entry's edit button (still rendered since only first is editing)
      const editBtnsAfter = wrapper.findAll('[data-testid="edit-entry-btn"]')
      // The first entry's edit button is hidden during edit, so only one remains
      expect(editBtnsAfter.length).toBe(1)
      await editBtnsAfter[0].trigger('click')

      // Still only one textarea — the new one for entry 2
      const textareasFinal = wrapper.findAll('[data-testid="edit-entry-textarea"]')
      expect(textareasFinal.length).toBe(1)
    })

    it('AC#9: editing a reminder_response entry via pencil emits editEntry on the same surface', async () => {
      const entries = [
        makeEntry({ type: 'reminder_response', prompt: 'Weigh dough', value: '748g' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="edit-entry-btn"]').trigger('click')

      const editTextarea = wrapper.find('[data-testid="edit-entry-textarea"]')
      expect((editTextarea.element as HTMLTextAreaElement).value).toBe('748g')
      await editTextarea.setValue('752g')
      await wrapper.find('[data-testid="edit-save-btn"]').trigger('click')

      expect(wrapper.emitted('editEntry')).toBeTruthy()
      expect(wrapper.emitted('editEntry')![0]).toEqual(['mix-dough', 0, '752g'])
    })
  })

  describe('delete entry (PF-239)', () => {
    it('trash click opens confirm dialog before deleting', async () => {
      const entries = [makeEntry({ value: 'doomed' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      // No confirm before click
      expect(wrapper.find('[data-testid="delete-confirm"]').exists()).toBe(false)

      await wrapper.find('[data-testid="delete-entry-btn"]').trigger('click')

      const confirm = wrapper.find('[data-testid="delete-confirm"]')
      expect(confirm.exists()).toBe(true)
      expect(confirm.text()).toContain('Delete this entry?')
      // No delete emitted yet
      expect(wrapper.emitted('deleteEntry')).toBeFalsy()
    })

    it('Cancel in confirm dialog dismisses without deleting', async () => {
      const entries = [makeEntry({ value: 'doomed' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="delete-entry-btn"]').trigger('click')

      await wrapper.find('[data-testid="delete-cancel-btn"]').trigger('click')

      expect(wrapper.emitted('deleteEntry')).toBeFalsy()
      expect(wrapper.find('[data-testid="delete-confirm"]').exists()).toBe(false)
    })

    it('Delete in confirm dialog emits deleteEntry with index', async () => {
      const entries = [
        makeEntry({ value: 'first' }),
        makeEntry({ value: 'second' })
      ]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')

      // Click the second entry's delete button
      const deleteBtns = wrapper.findAll('[data-testid="delete-entry-btn"]')
      await deleteBtns[1].trigger('click')
      await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')

      expect(wrapper.emitted('deleteEntry')).toBeTruthy()
      expect(wrapper.emitted('deleteEntry')![0]).toEqual(['mix-dough', 1])
    })

    it('no double-delete: confirm dialog is dismissed after Delete click', async () => {
      const entries = [makeEntry({ value: 'a' })]
      const wrapper = mount(ScratchpadNote, {
        props: { ...defaultProps, hasEntries: true, entries }
      })
      await wrapper.find('button').trigger('click')
      await wrapper.find('[data-testid="delete-entry-btn"]').trigger('click')
      await wrapper.find('[data-testid="delete-confirm-btn"]').trigger('click')

      // Confirm UI is gone
      expect(wrapper.find('[data-testid="delete-confirm"]').exists()).toBe(false)
      // Only one emit
      expect(wrapper.emitted('deleteEntry')!.length).toBe(1)
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
