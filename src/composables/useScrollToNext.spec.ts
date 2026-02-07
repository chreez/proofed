import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { scrollToNextItem } from './useScrollToNext'

describe('scrollToNextItem', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('does nothing if element is not found', async () => {
    vi.spyOn(document, 'querySelector').mockReturnValue(null)

    scrollToNextItem('.nonexistent')
    await nextTick()

    expect(document.querySelector).toHaveBeenCalledWith('.nonexistent')
  })

  it('does not scroll if element is visible', async () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 100,     // above HEADER_HEIGHT (64)
        bottom: 200,  // within viewport
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as unknown as Element)

    // Mock window.innerHeight
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls if element is above the header', async () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 30,      // above HEADER_HEIGHT (64)
        bottom: 130,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as unknown as Element)
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest'
    })
  })

  it('scrolls if element is below viewport', async () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 700,
        bottom: 900,   // below window.innerHeight (800)
        left: 0,
        right: 0,
        width: 100,
        height: 200
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockReturnValue(mockElement as unknown as Element)
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-state-id="state-1"]')
    await nextTick()

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest'
    })
  })
})
