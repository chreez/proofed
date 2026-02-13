import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import ShareModal from './ShareModal.vue'
import type { CookLogEntry } from '@/types/recipe'

// Mock lucide-vue-next
vi.mock('lucide-vue-next', () => ({
  ArrowLeft: { name: 'ArrowLeft', props: ['size'], template: '<svg class="arrow-left-icon" />' },
  X: { name: 'X', props: ['size'], template: '<svg class="x-icon" />' }
}))

// Mock qr-code-styling
const mockAppend = vi.fn()
vi.mock('qr-code-styling', () => {
  return {
    default: class MockQRCodeStyling {
      constructor() {
        // no-op
      }
      append = mockAppend
    }
  }
})

const baseCookLog: CookLogEntry[] = [
  {
    date: '2026-02-10',
    version: 'v1.2.0',
    summary: 'Second bake, overnight cold proof',
    notes: ['Cold proofed overnight']
  },
  {
    date: '2026-02-05',
    version: 'v1.1.0',
    summary: 'First bake',
    notes: ['Initial attempt']
  }
]

function mountModal(cookLog: CookLogEntry[] = baseCookLog) {
  return mount(ShareModal, {
    props: {
      recipeName: 'Quick Cinnamon Buns',
      recipeId: 'atk-cinnamon-buns',
      cookLog
    }
  })
}

describe('ShareModal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    document.body.style.overflow = ''
  })

  afterEach(() => {
    document.body.style.overflow = ''
  })

  describe('initial state', () => {
    it('renders nothing initially (modal is closed)', () => {
      const wrapper = mountModal()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(false)
    })

    it('exposes open method', () => {
      const wrapper = mountModal()
      expect(typeof wrapper.vm.open).toBe('function')
    })

    it('exposes close method', () => {
      const wrapper = mountModal()
      expect(typeof wrapper.vm.close).toBe('function')
    })

    it('exposes isOpen ref', () => {
      const wrapper = mountModal()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('opening the modal', () => {
    it('shows modal overlay after calling open()', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(true)
    })

    it('locks body scroll when opened', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('starts on bake picker step', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.text()).toContain('Share a Bake')
      expect(wrapper.text()).toContain('Select a bake to share')
    })
  })

  describe('bake picker (step 1)', () => {
    it('shows all cook log entries sorted newest first', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      const entries = wrapper.findAll('[data-testid="bake-picker-entry"]')
      expect(entries).toHaveLength(2)
      // First entry should be newest (2026-02-10)
      expect(entries[0].text()).toContain('Feb 10, 2026')
      expect(entries[1].text()).toContain('Feb 5, 2026')
    })

    it('shows version badges for each entry', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.text()).toContain('v1.2.0')
      expect(wrapper.text()).toContain('v1.1.0')
    })

    it('shows summary text for entries with summary', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.text()).toContain('Second bake, overnight cold proof')
    })

    it('shows "No summary" for entries without summary', async () => {
      const wrapper = mountModal([
        { date: '2026-02-10', version: 'v1.2.0', notes: ['Note'] }
      ])
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.text()).toContain('No summary')
    })

    it('advances to QR step when entry is clicked', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      const entries = wrapper.findAll('[data-testid="bake-picker-entry"]')
      await entries[0].trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('QR Code')
    })
  })

  describe('QR code display (step 2)', () => {
    async function openAndSelectBake(wrapper: ReturnType<typeof mountModal>) {
      wrapper.vm.open()
      await nextTick()
      const entries = wrapper.findAll('[data-testid="bake-picker-entry"]')
      await entries[0].trigger('click')
      await nextTick()
    }

    it('shows recipe name', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(wrapper.text()).toContain('Quick Cinnamon Buns')
    })

    it('shows selected date', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(wrapper.text()).toContain('Feb 10, 2026')
    })

    it('renders QR code container', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(wrapper.find('[data-testid="qr-code-container"]').exists()).toBe(true)
    })

    it('calls QRCodeStyling append', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(mockAppend).toHaveBeenCalled()
    })

    it('shows save instruction', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(wrapper.text()).toContain('Long-press')
      expect(wrapper.text()).toContain('right-click')
    })

    it('has back button that returns to picker', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      const backBtn = wrapper.find('[data-testid="share-back-btn"]')
      expect(backBtn.exists()).toBe(true)
      await backBtn.trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('Share a Bake')
    })
  })

  describe('closing the modal', () => {
    it('closes when close button is clicked', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      await wrapper.find('[data-testid="share-close-btn"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(false)
    })

    it('restores body scroll on close', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(document.body.style.overflow).toBe('hidden')
      wrapper.vm.close()
      await nextTick()
      expect(document.body.style.overflow).toBe('')
    })

    it('emits close event when closed', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      wrapper.vm.close()
      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('closes on overlay click', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      await wrapper.find('[data-testid="share-modal-overlay"]').trigger('click')
      await nextTick()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(false)
    })
  })

  describe('Escape key handling', () => {
    it('closes modal on Escape key', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(true)

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      await nextTick()
      expect(wrapper.find('[data-testid="share-modal-overlay"]').exists()).toBe(false)
    })
  })
})
