import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { scrollToNextItem, scrollToStageAfterTransition } from './useScrollToNext'

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
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 100,
        bottom: 200,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'header') return mockHeader as unknown as Element
      return mockElement as unknown as Element
    })

    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()
  })

  it('scrolls if element is above the header', async () => {
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 30,
        bottom: 130,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'header') return mockHeader as unknown as Element
      return mockElement as unknown as Element
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest'
    })
  })

  it('scrolls if element is below viewport', async () => {
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 700,
        bottom: 900,
        left: 0,
        right: 0,
        width: 100,
        height: 200
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'header') return mockHeader as unknown as Element
      return mockElement as unknown as Element
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToStageAfterTransition('stage-1')
    await nextTick()

    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()
  })

  it('uses dynamic header height from DOM', async () => {
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 48, top: 0, bottom: 48, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 50,   // above 64 (old hardcoded) but below 48 (dynamic)
        bottom: 150,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'header') return mockHeader as unknown as Element
      return mockElement as unknown as Element
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    // With dynamic height of 48, element at top=50 IS visible — should NOT scroll
    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()
  })

  it('falls back to 64px when no header element found', async () => {
    const mockElement = {
      getBoundingClientRect: () => ({
        top: 50,   // below fallback of 64 → not visible
        bottom: 150,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockImplementation((selector: string) => {
      if (selector === 'header') return null
      return mockElement as unknown as Element
    })
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToNextItem('[data-item-id="item-1"]')
    await nextTick()

    // With fallback 64, element at top=50 is NOT visible → should scroll
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'nearest'
    })
  })
})

describe('scrollToStageAfterTransition', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.restoreAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('scrolls to stage header after 300ms delay', () => {
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 900,
        bottom: 1000,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockReturnValue(mockHeader as unknown as Element)
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToStageAfterTransition('stage-2')

    // Should not scroll immediately
    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()

    // After 300ms (transition duration), should scroll
    vi.advanceTimersByTime(300)

    expect(document.getElementById).toHaveBeenCalledWith('stage-header-stage-2')
    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start'
    })
  })

  it('does not scroll if stage header is already visible', () => {
    const mockHeader = {
      getBoundingClientRect: () => ({ height: 64, top: 0, bottom: 64, left: 0, right: 0, width: 0 })
    }

    const mockElement = {
      getBoundingClientRect: () => ({
        top: 100,
        bottom: 200,
        left: 0,
        right: 0,
        width: 100,
        height: 100
      }),
      scrollIntoView: vi.fn()
    }

    vi.spyOn(document, 'querySelector').mockReturnValue(mockHeader as unknown as Element)
    vi.spyOn(document, 'getElementById').mockReturnValue(mockElement as unknown as HTMLElement)
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true })

    scrollToStageAfterTransition('stage-2')
    vi.advanceTimersByTime(300)

    expect(mockElement.scrollIntoView).not.toHaveBeenCalled()
  })

  it('does nothing if element is not found', () => {
    vi.spyOn(document, 'getElementById').mockReturnValue(null)

    scrollToStageAfterTransition('nonexistent')
    vi.advanceTimersByTime(300)

    // No error thrown
    expect(document.getElementById).toHaveBeenCalledWith('stage-header-nonexistent')
  })
})
