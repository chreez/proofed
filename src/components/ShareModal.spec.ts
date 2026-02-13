import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import ShareModal from './ShareModal.vue'
import type { CookLogEntry } from '@/types/recipe'

// Mock lucide-vue-next
vi.mock('lucide-vue-next', () => ({
  ArrowLeft: { name: 'ArrowLeft', props: ['size'], template: '<svg class="arrow-left-icon" />' },
  X: { name: 'X', props: ['size'], template: '<svg class="x-icon" />' },
  Share2: { name: 'Share2', props: ['size'], template: '<svg class="share2-icon" />' },
  Copy: { name: 'Copy', props: ['size'], template: '<svg class="copy-icon" />' },
  Check: { name: 'Check', props: ['size'], template: '<svg class="check-icon" />' }
}))

// Mock qr-code-styling — inject a canvas element so branded label compositing runs
const mockAppend = vi.fn((container: HTMLElement) => {
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 256
  container.appendChild(canvas)
})
vi.mock('qr-code-styling', () => ({
  default: class MockQRCodeStyling {
    append = mockAppend
  }
}))

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

// Mock canvas 2d context for branded label compositing
const mockCtx = {
  fillStyle: '',
  font: '',
  textBaseline: '',
  fillRect: vi.fn(),
  drawImage: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 100 }))
}
const origGetContext = HTMLCanvasElement.prototype.getContext
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as unknown as typeof origGetContext
  HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/png;base64,mock')
})
afterAll(() => {
  HTMLCanvasElement.prototype.getContext = origGetContext
})

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

    it('advances to share step when entry is clicked', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      const entries = wrapper.findAll('[data-testid="bake-picker-entry"]')
      await entries[0].trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('Share Link')
    })
  })

  describe('share actions (step 2)', () => {
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

    it('shows share URL', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      const urlEl = wrapper.find('[data-testid="share-url"]')
      expect(urlEl.exists()).toBe(true)
      expect(urlEl.text()).toContain('proofeddot.netlify.app/recipe/atk-cinnamon-buns/bake/2026-02-10')
    })

    it('has copy link button', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      const copyBtn = wrapper.find('[data-testid="share-copy-btn"]')
      expect(copyBtn.exists()).toBe(true)
      expect(copyBtn.text()).toContain('Copy Link')
    })

    it('copies URL to clipboard on copy click', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      await wrapper.find('[data-testid="share-copy-btn"]').trigger('click')
      expect(writeText).toHaveBeenCalledWith(
        'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns/bake/2026-02-10?shared=true'
      )
    })

    it('shows "Copied!" after copy', async () => {
      const writeText = vi.fn().mockResolvedValue(undefined)
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      await wrapper.find('[data-testid="share-copy-btn"]').trigger('click')
      await nextTick()
      expect(wrapper.text()).toContain('Copied!')
    })

    it('calls QRCodeStyling append when bake selected', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      expect(mockAppend).toHaveBeenCalled()
    })

    it('renders branded QR label image after delay', async () => {
      vi.useFakeTimers()
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      // Advance past the 300ms setTimeout for canvas compositing
      vi.advanceTimersByTime(350)
      await nextTick()
      const qrLabel = wrapper.find('[data-testid="share-qr-label"]')
      expect(qrLabel.exists()).toBe(true)
      vi.useRealTimers()
    })

    it('does not show QR label before render completes', async () => {
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      // Before setTimeout fires, no image yet
      expect(wrapper.find('[data-testid="share-qr-label"]').exists()).toBe(false)
    })

    it('handles missing canvas gracefully during QR render', async () => {
      // Mock append to NOT insert a canvas element
      mockAppend.mockImplementationOnce(() => { /* no canvas */ })
      vi.useFakeTimers()
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      vi.advanceTimersByTime(350)
      await nextTick()
      // Should not crash, no QR label rendered
      expect(wrapper.find('[data-testid="share-qr-label"]').exists()).toBe(false)
      vi.useRealTimers()
    })

    it('handles null canvas context gracefully', async () => {
      const origMock = HTMLCanvasElement.prototype.getContext
      // Return null for getContext to hit the !ctx branch
      HTMLCanvasElement.prototype.getContext = vi.fn(() => null) as unknown as typeof origMock
      vi.useFakeTimers()
      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      vi.advanceTimersByTime(350)
      await nextTick()
      expect(wrapper.find('[data-testid="share-qr-label"]').exists()).toBe(false)
      vi.useRealTimers()
      HTMLCanvasElement.prototype.getContext = vi.fn(() => mockCtx) as unknown as typeof origMock
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

    it('calls navigator.share with URL when share button clicked', async () => {
      const shareFn = vi.fn().mockResolvedValue(undefined)
      Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true })

      const wrapper = mountModal()
      await openAndSelectBake(wrapper)

      const nativeBtn = wrapper.find('[data-testid="share-native-btn"]')
      if (nativeBtn.exists()) {
        await nativeBtn.trigger('click')
        expect(shareFn).toHaveBeenCalledWith(
          expect.objectContaining({
            url: 'https://proofeddot.netlify.app/recipe/atk-cinnamon-buns/bake/2026-02-10?shared=true'
          })
        )
      }
    })

    it('handles share cancellation gracefully', async () => {
      const shareFn = vi.fn().mockRejectedValue(new Error('User cancelled'))
      Object.defineProperty(navigator, 'share', { value: shareFn, writable: true, configurable: true })

      const wrapper = mountModal()
      await openAndSelectBake(wrapper)

      const nativeBtn = wrapper.find('[data-testid="share-native-btn"]')
      if (nativeBtn.exists()) {
        // Should not throw
        await nativeBtn.trigger('click')
      }
    })

    it('handles clipboard failure gracefully', async () => {
      const writeText = vi.fn().mockRejectedValue(new Error('Not allowed'))
      Object.assign(navigator, { clipboard: { writeText } })

      const wrapper = mountModal()
      await openAndSelectBake(wrapper)
      // Should not throw
      await wrapper.find('[data-testid="share-copy-btn"]').trigger('click')
      await nextTick()
      // Should still show Copy Link (not Copied)
      expect(wrapper.text()).toContain('Copy Link')
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

  describe('cleanup', () => {
    it('restores body scroll if unmounted while open', async () => {
      const wrapper = mountModal()
      wrapper.vm.open()
      await nextTick()
      expect(document.body.style.overflow).toBe('hidden')
      wrapper.unmount()
      expect(document.body.style.overflow).toBe('')
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
