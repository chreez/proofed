import { describe, it, expect, vi, afterEach } from 'vitest'
import { defineComponent, nextTick } from 'vue'
import { mount } from '@vue/test-utils'
import { useMediaQuery } from './useMediaQuery'

// Helper to run composable inside a component (needed for lifecycle hooks)
function withSetup<T>(fn: () => T): { result: T } {
  let result!: T
  mount(defineComponent({
    setup() {
      result = fn()
      return {}
    },
    template: '<div />'
  }))
  return { result }
}

describe('useMediaQuery', () => {
  const originalMatchMedia = window.matchMedia

  afterEach(() => {
    window.matchMedia = originalMatchMedia
  })

  it('defaults to true when matchMedia is unavailable', () => {
    // @ts-expect-error -- intentionally removing matchMedia for test
    delete window.matchMedia
    const { result } = withSetup(() => useMediaQuery('(min-width: 768px)'))
    expect(result.matches.value).toBe(true)
  })

  it('returns true when query matches', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })

    const { result } = withSetup(() => useMediaQuery('(min-width: 768px)'))
    expect(result.matches.value).toBe(true)
  })

  it('returns false when query does not match', () => {
    window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn()
    })

    const { result } = withSetup(() => useMediaQuery('(min-width: 768px)'))
    expect(result.matches.value).toBe(false)
  })

  it('updates reactively when media query changes', async () => {
    let changeCallback: ((e: { matches: boolean }) => void) | null = null
    const mql = {
      matches: false,
      addEventListener: (_event: string, cb: (e: { matches: boolean }) => void) => {
        changeCallback = cb
      },
      removeEventListener: vi.fn()
    }
    window.matchMedia = vi.fn().mockReturnValue(mql)

    const { result } = withSetup(() => useMediaQuery('(min-width: 768px)'))
    expect(result.matches.value).toBe(false)

    // Simulate media query change
    mql.matches = true
    changeCallback!({ matches: true })
    await nextTick()
    expect(result.matches.value).toBe(true)
  })

  it('cleans up event listener on unmount', () => {
    const removeEventListener = vi.fn()
    window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener
    })

    const wrapper = mount(defineComponent({
      setup() {
        useMediaQuery('(min-width: 768px)')
        return {}
      },
      template: '<div />'
    }))

    wrapper.unmount()
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
