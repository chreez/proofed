import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import AboutPage from './AboutPage.vue'

describe('AboutPage', () => {
  it('renders the heading', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.find('h2').text()).toContain('About proofed')
  })

  it('renders the description paragraphs', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('personal cooking notebook')
    expect(wrapper.text()).toContain('versioned, structured, and always improving')
  })

  it('renders feature list items', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('Repeatable bakes')
    expect(wrapper.text()).toContain('Learning over time')
    expect(wrapper.text()).toContain('Recipe versioning')
    expect(wrapper.text()).toContain('Mise en place as a checklist')
    expect(wrapper.text()).toContain('Nutritional transparency')
  })

  it('renders footer with author', () => {
    const wrapper = mount(AboutPage)
    expect(wrapper.text()).toContain('Built by Chris Palmer')
  })
})
