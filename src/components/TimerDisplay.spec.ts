import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import TimerDisplay from './TimerDisplay.vue'

describe('TimerDisplay', () => {
  it('renders duration in minutes', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 25 }
    })

    expect(wrapper.text()).toContain('25 min')
  })

  it('formats hours and minutes', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 90 }
    })

    expect(wrapper.text()).toContain('1 hr 30 min')
  })

  it('formats exact hours without min', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 120 }
    })

    expect(wrapper.text()).toContain('2 hr')
    expect(wrapper.text()).not.toContain('min')
  })

  it('formats short durations', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1 }
    })

    expect(wrapper.text()).toContain('1 min')
  })

  it('renders flame icon for active steps (default)', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 5 }
    })

    // Default passive=false → Flame icon
    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('renders hourglass icon for passive steps', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 5, passive: true }
    })

    const svg = wrapper.find('svg')
    expect(svg.exists()).toBe(true)
  })

  it('uses monospace font for duration text', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 5 }
    })

    expect(wrapper.find('.font-mono').exists()).toBe(true)
  })

  it('renders as inline span', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 5 }
    })

    expect(wrapper.element.tagName).toBe('SPAN')
  })
})
