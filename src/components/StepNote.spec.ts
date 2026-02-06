import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import StepNote from './StepNote.vue'

describe('StepNote', () => {
  const defaultProps = {
    note: 'Test note content',
    date: '2026-02-05'
  }

  it('renders note text', () => {
    const wrapper = mount(StepNote, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('Test note content')
  })

  it('renders date', () => {
    const wrapper = mount(StepNote, {
      props: defaultProps
    })

    expect(wrapper.text()).toContain('2026-02-05')
  })

  it('renders session link when provided', () => {
    const wrapper = mount(StepNote, {
      props: {
        ...defaultProps,
        sessionLink: '#session-1'
      }
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('#session-1')
    expect(link.text()).toBe('View full session')
  })

  it('does not render session link when not provided', () => {
    const wrapper = mount(StepNote, {
      props: defaultProps
    })

    const link = wrapper.find('a')
    expect(link.exists()).toBe(false)
  })
})
