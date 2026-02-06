import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CookLogSection from './CookLogSection.vue'

describe('CookLogSection', () => {
  const defaultProps = {
    cookLog: [{
      date: '2026-02-05',
      version: 'v1.0.0',
      notes: ['Note 1', 'Note 2'],
      step_notes: { 'STEP_1': 'Step note' },
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
            step_notes: {},
            next_time: []
          },
          {
            date: '2026-02-04',
            version: 'v0.9.0',
            notes: ['Second note'],
            step_notes: {},
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
          step_notes: {},
          next_time: []
        }]
      }
    })

    expect(wrapper.text()).not.toContain('Next Time')
  })

  it('shows step notes count when present', () => {
    const wrapper = mount(CookLogSection, {
      props: defaultProps
    })

    // step_notes has 1 entry, so should show "1 step note"
    expect(wrapper.text()).toContain('1 step note')
  })

  it('shows plural step notes count for multiple notes', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          step_notes: { 'STEP_1': 'Note 1', 'STEP_2': 'Note 2' },
          next_time: []
        }]
      }
    })

    expect(wrapper.text()).toContain('2 step notes')
  })

  it('hides step notes count when none present', () => {
    const wrapper = mount(CookLogSection, {
      props: {
        cookLog: [{
          date: '2026-02-05',
          version: 'v1.0.0',
          notes: ['Note 1'],
          step_notes: {},
          next_time: []
        }]
      }
    })

    expect(wrapper.text()).not.toContain('step note')
  })
})
