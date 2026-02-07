import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'

describe('CookLogSection', () => {
  const defaultProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note 1', 'Note 2'],
      next_time: ['Try this next time']
    }]
  }

  it('renders section title', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    expect(wrapper.find('h3').text()).toBe('Cook Log')
  })

  it('renders all cook log entries', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [
          {
            date: '2026-02-05',
            version: 'v1.0.0',
            notes: ['First note'],
            next_time: []
          },
          {
            date: '2026-02-04',
            version: 'v0.9.0',
            notes: ['Second note'],
            next_time: []
          }
        ]
      }
    })

    expect(wrapper.text()).toContain('First note')
    expect(wrapper.text()).toContain('Second note')
    expect(wrapper.text()).toContain('v1.0.0')
    expect(wrapper.text()).toContain('v0.9.0')
  })

  it('shows next_time section when present', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Next Time')
    expect(wrapper.text()).toContain('Try this next time')
  })

  it('hides next_time section when empty', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          next_time: []
        }]
      }
    })

    expect(wrapper.text()).not.toContain('Next Time')
  })

  it('renders markdown formatting in notes', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['**Bold text** and *italic*'],
          next_time: []
        }]
      }
    })

    expect(wrapper.html()).toContain('<strong>Bold text</strong>')
    expect(wrapper.html()).toContain('<em>italic</em>')
  })
})

describe('HTML snapshot', () => {
  it('matches snapshot', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1', 'Note 2'],
          next_time: ['Try this next time']
        }]
      }
    })
    expect(wrapper.html()).toMatchSnapshot()
  })
})
