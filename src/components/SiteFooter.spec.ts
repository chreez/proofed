import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SiteFooter from './SiteFooter.vue'

// Mock vue-router RouterLink
const mockRouterLink = {
  name: 'RouterLink',
  props: ['to'],
  template: '<a :href="to"><slot /></a>'
}

describe('SiteFooter', () => {
  it('renders brand name with accent dot', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: { RouterLink: mockRouterLink }
      }
    })

    expect(wrapper.text()).toContain('proofed')
    expect(wrapper.text()).toContain('Chris Palmer')
  })

  it('renders About link', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: { RouterLink: mockRouterLink }
      }
    })

    const aboutLink = wrapper.find('a[href="/about"]')
    expect(aboutLink.exists()).toBe(true)
    expect(aboutLink.text()).toBe('About')
  })

  it('renders GitHub link', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: { RouterLink: mockRouterLink }
      }
    })

    const githubLink = wrapper.find('a[href="https://github.com/chreez/proofed"]')
    expect(githubLink.exists()).toBe(true)
    expect(githubLink.attributes('target')).toBe('_blank')
  })

  it('renders Instagram link', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: { RouterLink: mockRouterLink }
      }
    })

    const instaLink = wrapper.find('a[href="https://instagram.com/rhythm_hawk"]')
    expect(instaLink.exists()).toBe(true)
    expect(instaLink.attributes('target')).toBe('_blank')
  })

  it('copyright includes current year', () => {
    const wrapper = mount(SiteFooter, {
      global: {
        stubs: { RouterLink: mockRouterLink }
      }
    })

    expect(wrapper.text()).toContain('2026')
  })
})
