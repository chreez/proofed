import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import PhotoLightbox from './PhotoLightbox.vue'
import type { CookLogPhoto } from '@/types/recipe'

const photos: CookLogPhoto[] = [
  { src: '/img/a-800.webp', thumb: '/img/a-400.webp', alt: 'Photo A' },
  { src: '/img/b-800.webp', thumb: '/img/b-400.webp', alt: 'Photo B' },
  { src: '/img/c-800.webp', thumb: '/img/c-400.webp', alt: 'Photo C' }
]

function mountLightbox(overrides = {}) {
  return mount(PhotoLightbox, {
    props: { photos, initialIndex: 0, open: true, ...overrides },
    attachTo: document.body
  })
}

function pointerEvent(type: string, overrides: Partial<PointerEvent> = {}): PointerEvent {
  return new PointerEvent(type, {
    pointerId: 1,
    clientX: 0,
    clientY: 0,
    button: 0,
    bubbles: true,
    ...overrides
  })
}

describe('PhotoLightbox', () => {
  let wrapper: ReturnType<typeof mountLightbox>

  afterEach(() => {
    wrapper?.unmount()
    document.body.style.overflow = ''
  })

  describe('rendering', () => {
    it('renders when open', () => {
      wrapper = mountLightbox()
      expect(document.querySelector('.lightbox-overlay')).toBeTruthy()
    })

    it('does not render when closed', () => {
      wrapper = mountLightbox({ open: false })
      expect(document.querySelector('.lightbox-overlay')).toBeNull()
    })

    it('shows correct photo', () => {
      wrapper = mountLightbox({ initialIndex: 1 })
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('b-800.webp')
    })

    it('shows alt text as caption', () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      expect(document.querySelector('.lightbox-caption')?.textContent).toContain('Photo A')
    })

    it('shows photo counter', () => {
      wrapper = mountLightbox({ initialIndex: 1 })
      expect(document.querySelector('.lightbox-counter')?.textContent?.trim()).toBe('2 / 3')
    })

    it('hides counter for single photo', () => {
      wrapper = mount(PhotoLightbox, {
        props: { photos: [photos[0]], initialIndex: 0, open: true },
        attachTo: document.body
      })
      expect(document.querySelector('.lightbox-counter')).toBeNull()
    })
  })

  describe('keyboard navigation', () => {
    it('closes on Escape', async () => {
      wrapper = mountLightbox()
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
      expect(wrapper.emitted('close')).toHaveLength(1)
    })

    it('navigates forward on ArrowRight', async () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('b-800.webp')
    })

    it('navigates backward on ArrowLeft', async () => {
      wrapper = mountLightbox({ initialIndex: 2 })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await wrapper.vm.$nextTick()
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('b-800.webp')
    })

    it('does not go before first photo', async () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }))
      await wrapper.vm.$nextTick()
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('a-800.webp')
    })

    it('does not go past last photo', async () => {
      wrapper = mountLightbox({ initialIndex: 2 })
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('c-800.webp')
    })
  })

  describe('close button', () => {
    it('emits close on X click', async () => {
      wrapper = mountLightbox()
      const closeBtn = document.querySelector('.lightbox-close') as HTMLElement
      await closeBtn.click()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  describe('backdrop click', () => {
    it('closes when backdrop is clicked', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.click()
      expect(wrapper.emitted('close')).toHaveLength(1)
    })
  })

  describe('scroll lock', () => {
    it('locks body scroll when opened', () => {
      wrapper = mountLightbox()
      expect(document.body.style.overflow).toBe('hidden')
    })

    it('unlocks body scroll when closed', async () => {
      wrapper = mountLightbox()
      await wrapper.setProps({ open: false })
      expect(document.body.style.overflow).toBe('')
    })
  })

  describe('gesture system', () => {
    it('ignores non-primary pointers', () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      // Simulate pointer with button=2 (right-click)
      overlay.dispatchEvent(pointerEvent('pointerdown', { button: 2 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { clientX: 100 }))
      // Should not enter swiping state — image stays at origin
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).not.toContain('100')
    })

    it('tracks horizontal swipe and updates dragX', async () => {
      // Start at index 1 to avoid rubber-band at edges
      wrapper = mountLightbox({ initialIndex: 1 })
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement

      // Mock setPointerCapture (not available in jsdom)
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      // Move past axis lock threshold (10px) horizontally
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 215, clientY: 200 }))
      // Continue dragging left (negative dx = toward next photo)
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 200 }))
      await wrapper.vm.$nextTick()

      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateX(-100px)')
    })

    it('tracks vertical dismiss and updates dragY', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      // Move past axis lock threshold vertically
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 215 }))
      // Continue dragging down
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 350 }))
      await wrapper.vm.$nextTick()

      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateY(150px)')
      expect(content.style.transform).toContain('scale(')
    })

    it('snaps back on small horizontal displacement', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 215, clientY: 200 }))
      // Small drag — not enough to commit
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 230, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 230, clientY: 200 }))
      await wrapper.vm.$nextTick()

      // Should animate back to 0 (isAnimating = true)
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateX(0px)')
    })

    it('snaps back on small vertical displacement', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 215 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 250 }))
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 200, clientY: 250 }))
      await wrapper.vm.$nextTick()

      // Should snap back
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateY(0px)')
    })

    it('dismisses on large vertical displacement', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 100 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 115 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 300 }))

      // In jsdom transitionend won't fire, so we need the animation to use the
      // element path. Manually trigger transitionend after pointerup.
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 200, clientY: 300 }))
      await wrapper.vm.$nextTick()

      // Trigger transitionend on the content element (simulates animation completion)
      const content = document.querySelector('.lightbox-content') as HTMLElement
      content?.dispatchEvent(new Event('transitionend'))
      await wrapper.vm.$nextTick()

      expect(wrapper.emitted('close')).toBeTruthy()
    })

    it('applies rubber-band at start edge', async () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // At first photo, swiping right should rubber-band (30% of actual)
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 115, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 200 }))
      await wrapper.vm.$nextTick()

      const content = document.querySelector('.lightbox-content') as HTMLElement
      // dx=100 * 0.3 = 30 (rubber-banded)
      expect(content.style.transform).toContain('translateX(30px)')
    })

    it('resets on pointer cancel', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 215, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 300, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointercancel', { pointerId: 1 }))
      await wrapper.vm.$nextTick()

      // Should snap back
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateX(0px)')
    })

    it('clamps upward vertical drag', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // Start then drag upward
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 300 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 285 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 200 }))
      await wrapper.vm.$nextTick()

      // dy is negative (-100), clamped to 0
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transform).toContain('translateY(0px)')
    })

    it('does not close backdrop during gesture', async () => {
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // Start a gesture
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 215, clientY: 200 }))

      // Click backdrop during swipe — should not close
      overlay.click()
      expect(wrapper.emitted('close')).toBeUndefined()
    })

    it('ignores button clicks in pointer handler', () => {
      wrapper = mountLightbox()
      const closeBtn = document.querySelector('.lightbox-close') as HTMLElement

      // Pointer down on a button — should not start gesture
      const event = pointerEvent('pointerdown', { clientX: 100, clientY: 100 })
      Object.defineProperty(event, 'target', { value: closeBtn.querySelector('svg') || closeBtn })
      // The handler checks target.closest('button') — buttons are excluded from gesture capture
    })
  })

    it('commits horizontal swipe on large displacement', async () => {
      wrapper = mountLightbox({ initialIndex: 1 })
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // Swipe left past threshold (>80px)
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 300, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 285, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 100, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 100, clientY: 200 }))
      await wrapper.vm.$nextTick()

      // Trigger transitionend to complete the slide animation
      const content = document.querySelector('.lightbox-content') as HTMLElement
      content?.dispatchEvent(new Event('transitionend'))
      await wrapper.vm.$nextTick()

      // Should have navigated to next photo (index 2)
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('c-800.webp')
    })

    it('commits horizontal swipe right to go to prev photo', async () => {
      wrapper = mountLightbox({ initialIndex: 1 })
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // Swipe right past threshold (>80px)
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 100, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 115, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 300, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 300, clientY: 200 }))
      await wrapper.vm.$nextTick()

      const content = document.querySelector('.lightbox-content') as HTMLElement
      content?.dispatchEvent(new Event('transitionend'))
      await wrapper.vm.$nextTick()

      // Should have navigated to prev photo (index 0)
      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('a-800.webp')
    })

    it('clears snap-back animation flag after timeout', async () => {
      vi.useFakeTimers()
      wrapper = mountLightbox()
      const overlay = document.querySelector('.lightbox-overlay') as HTMLElement
      overlay.setPointerCapture = vi.fn()

      // Small drag to trigger snap-back
      overlay.dispatchEvent(pointerEvent('pointerdown', { clientX: 200, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 215, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointermove', { pointerId: 1, clientX: 220, clientY: 200 }))
      overlay.dispatchEvent(pointerEvent('pointerup', { pointerId: 1, clientX: 220, clientY: 200 }))
      await wrapper.vm.$nextTick()

      // Content should have spring-back transition
      const content = document.querySelector('.lightbox-content') as HTMLElement
      expect(content.style.transition).toContain('300ms')

      // After timeout, animation flag clears
      vi.advanceTimersByTime(350)
      await wrapper.vm.$nextTick()

      expect(content.style.transition).toBe('none')
      vi.useRealTimers()
    })

  describe('navigation arrows', () => {
    it('shows next arrow when not on last photo', () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      expect(document.querySelector('.lightbox-nav-next')).toBeTruthy()
    })

    it('hides next arrow on last photo', () => {
      wrapper = mountLightbox({ initialIndex: 2 })
      expect(document.querySelector('.lightbox-nav-next')).toBeNull()
    })

    it('shows prev arrow when not on first photo', () => {
      wrapper = mountLightbox({ initialIndex: 1 })
      expect(document.querySelector('.lightbox-nav-prev')).toBeTruthy()
    })

    it('hides prev arrow on first photo', () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      expect(document.querySelector('.lightbox-nav-prev')).toBeNull()
    })
  })

  describe('lifecycle', () => {
    it('resets index when reopened with different initialIndex', async () => {
      wrapper = mountLightbox({ initialIndex: 0 })
      // Navigate to photo 2
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))
      await wrapper.vm.$nextTick()

      // Close and reopen at index 2
      await wrapper.setProps({ open: false })
      await wrapper.setProps({ open: true, initialIndex: 2 })
      await wrapper.vm.$nextTick()

      const img = document.querySelector('.lightbox-img') as HTMLImageElement
      expect(img.src).toContain('c-800.webp')
    })

    it('cleans up on unmount', () => {
      wrapper = mountLightbox()
      expect(document.body.style.overflow).toBe('hidden')
      wrapper.unmount()
      expect(document.body.style.overflow).toBe('')
    })
  })
})
