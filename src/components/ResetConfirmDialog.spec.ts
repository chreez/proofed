import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, VueWrapper } from '@vue/test-utils'
import ResetConfirmDialog from './ResetConfirmDialog.vue'

function mountDialog(props = {}) {
  return mount(ResetConfirmDialog, {
    props: {
      checkedCount: 0,
      completedStageCount: 0,
      scratchpadNoteCount: 0,
      ...props
    },
    global: { stubs: { Teleport: true } }
  })
}

async function openDialog(wrapper: VueWrapper) {
  const vm = wrapper.vm as unknown as { open: () => void }
  vm.open()
  await wrapper.vm.$nextTick()
}

describe('ResetConfirmDialog', () => {
  beforeEach(() => {
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  it('is hidden by default', () => {
    const wrapper = mountDialog()
    expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(false)
  })

  it('shows when open() is called', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(true)
  })

  it('locks body scroll on open', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('restores body scroll on close', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)

    await wrapper.find('[data-testid="reset-cancel-btn"]').trigger('click')
    expect(document.body.style.overflow).toBe('')
  })

  describe('default text', () => {
    it('shows default title', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)
      expect(wrapper.text()).toContain('Reset Bake?')
    })

    it('shows default description', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)
      expect(wrapper.text()).toContain('This will clear all your progress')
    })

    it('shows default confirm label', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)
      expect(wrapper.find('[data-testid="reset-confirm-btn"]').text()).toBe('Reset')
    })
  })

  describe('custom text', () => {
    it('renders custom title, description, and confirm label', async () => {
      const wrapper = mountDialog({
        title: 'Clear Scratchpad?',
        description: 'All notes will be deleted.',
        confirmLabel: 'Clear'
      })
      await openDialog(wrapper)

      expect(wrapper.text()).toContain('Clear Scratchpad?')
      expect(wrapper.text()).toContain('All notes will be deleted.')
      expect(wrapper.find('[data-testid="reset-confirm-btn"]').text()).toBe('Clear')
    })
  })

  describe('loss list', () => {
    it('shows "No progress to reset" when all counts are 0', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-no-loss"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="reset-loss-list"]').exists()).toBe(false)
    })

    it('shows loss list when checkedCount > 0', async () => {
      const wrapper = mountDialog({ checkedCount: 5 })
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-loss-list"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="reset-no-loss"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="reset-loss-checked"]').text()).toBe('5 checked items')
    })

    it('shows loss list when completedStageCount > 0', async () => {
      const wrapper = mountDialog({ completedStageCount: 2 })
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-loss-stages"]').text()).toBe('2 completed stages')
    })

    it('shows loss list when scratchpadNoteCount > 0', async () => {
      const wrapper = mountDialog({ scratchpadNoteCount: 3 })
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-loss-notes"]').text()).toBe('3 scratchpad notes')
    })

    it('uses singular when count is 1', async () => {
      const wrapper = mountDialog({ checkedCount: 1, completedStageCount: 1, scratchpadNoteCount: 1 })
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-loss-checked"]').text()).toBe('1 checked item')
      expect(wrapper.find('[data-testid="reset-loss-stages"]').text()).toBe('1 completed stage')
      expect(wrapper.find('[data-testid="reset-loss-notes"]').text()).toBe('1 scratchpad note')
    })

    it('hides rows for zero counts', async () => {
      const wrapper = mountDialog({ checkedCount: 3, completedStageCount: 0, scratchpadNoteCount: 1 })
      await openDialog(wrapper)

      expect(wrapper.find('[data-testid="reset-loss-checked"]').exists()).toBe(true)
      expect(wrapper.find('[data-testid="reset-loss-stages"]').exists()).toBe(false)
      expect(wrapper.find('[data-testid="reset-loss-notes"]').exists()).toBe(true)
    })
  })

  describe('actions', () => {
    it('emits confirm on confirm click', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      await wrapper.find('[data-testid="reset-confirm-btn"]').trigger('click')
      expect(wrapper.emitted('confirm')).toHaveLength(1)
    })

    it('closes after confirm', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      await wrapper.find('[data-testid="reset-confirm-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(false)
    })

    it('emits cancel on cancel click', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      await wrapper.find('[data-testid="reset-cancel-btn"]').trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it('closes after cancel', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      await wrapper.find('[data-testid="reset-cancel-btn"]').trigger('click')
      expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(false)
    })

    it('closes on backdrop click', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      await wrapper.find('[data-testid="reset-confirm-overlay"]').trigger('click')
      expect(wrapper.emitted('cancel')).toHaveLength(1)
      expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(false)
    })

    it('closes on Escape key', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('cancel')).toHaveLength(1)
    })

    it('does not close on non-Escape key', async () => {
      const wrapper = mountDialog()
      await openDialog(wrapper)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('cancel')).toBeUndefined()
      expect(wrapper.find('[data-testid="reset-confirm-overlay"]').exists()).toBe(true)
    })
  })
})
