import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import SiteFooter from './SiteFooter.vue'

// Mock vue-router RouterLink
const mockRouterLink = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
}

// Mock IntersectionObserver at module level so it's available during mount
let observerCallback: IntersectionObserverCallback | null = null
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()

class MockIntersectionObserver {
  constructor(callback: IntersectionObserverCallback) {
    observerCallback = callback
  }
  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = vi.fn()
  root = null
  rootMargin = ''
  thresholds = [] as number[]
  takeRecords = () => [] as IntersectionObserverEntry[]
}

vi.stubGlobal('IntersectionObserver', MockIntersectionObserver)

function mountFooter(sticky = false) {
  return mount(SiteFooter, {
    props: { sticky },
    global: {
      stubs: { RouterLink: mockRouterLink }
    }
  })
}

describe('SiteFooter', () => {
  beforeEach(() => {
    observerCallback = null
    mockObserve.mockClear()
    mockDisconnect.mockClear()
  })

  it('renders brand name with accent dot', () => {
    const wrapper = mountFooter()
    expect(wrapper.text()).toContain('proofed')
    expect(wrapper.text()).toContain('Chris Palmer')
  })

  it('renders About link', () => {
    const wrapper = mountFooter()
    const aboutLink = wrapper.find('a[href="/about"]')
    expect(aboutLink.exists()).toBe(true)
    expect(aboutLink.text()).toBe('About')
  })

  it('renders GitHub link', () => {
    const wrapper = mountFooter()
    const githubLink = wrapper.find('a[href="https://github.com/chreez/proofed"]')
    expect(githubLink.exists()).toBe(true)
    expect(githubLink.attributes('target')).toBe('_blank')
  })

  it('renders Instagram link', () => {
    const wrapper = mountFooter()
    const instaLink = wrapper.find('a[href="https://instagram.com/rhythm_hawk"]')
    expect(instaLink.exists()).toBe(true)
    expect(instaLink.attributes('target')).toBe('_blank')
  })

  it('copyright includes current year', () => {
    const wrapper = mountFooter()
    expect(wrapper.text()).toContain('2026')
  })

  it('renders static footer when not sticky', () => {
    const wrapper = mountFooter()
    expect(wrapper.find('.site-footer').exists()).toBe(false)
    expect(wrapper.find('footer').exists()).toBe(true)
    expect(mockObserve).not.toHaveBeenCalled()
  })

  it('observes sentinel element on mount', async () => {
    mountFooter(true)
    await flushPromises()
    expect(mockObserve).toHaveBeenCalled()
  })

  it('adds footer-expanded class when sentinel is intersecting', async () => {
    const wrapper = mountFooter(true)
    await flushPromises()

    // Simulate sentinel entering viewport
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.site-footer').classes()).toContain('footer-expanded')
  })

  it('removes footer-expanded class when sentinel leaves viewport', async () => {
    const wrapper = mountFooter(true)
    await flushPromises()

    // Expand first
    observerCallback?.(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.site-footer').classes()).toContain('footer-expanded')

    // Collapse
    observerCallback?.(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver
    )
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.site-footer').classes()).not.toContain('footer-expanded')
  })

  it('disconnects observer on unmount', async () => {
    const wrapper = mountFooter(true)
    await flushPromises()
    wrapper.unmount()
    expect(mockDisconnect).toHaveBeenCalled()
  })
})
