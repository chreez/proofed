import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ScalingControl from './ScalingControl.vue'

const defaultScaling = {
  tested_range: { min: 1, max: 2 },
  ingredients: [],
  process_caveats: [],
  researched_date: '2026-04-08',
  sources: ['Test']
}

describe('ScalingControl', () => {
  it('does not render when scaling is undefined', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: undefined, modelValue: 1 }
    })
    expect(wrapper.find('button').exists()).toBe(false)
  })

  it('renders multiplier buttons for tested range + 2', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 1 }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBe(4) // 1×, 2×, 3×, 4×
    expect(buttons[0].text()).toBe('1×')
    expect(buttons[3].text()).toBe('4×')
  })

  it('highlights the active multiplier', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 2 }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[1].classes()).toContain('bg-ink')
  })

  it('emits update:modelValue on click', async () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 1 }
    })
    await wrapper.findAll('button')[2].trigger('click')
    expect(wrapper.emitted('update:modelValue')?.[0]).toEqual([3])
  })

  it('shows untested warning when beyond max', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 3 }
    })
    expect(wrapper.text()).toContain('Beyond tested range')
  })

  it('shows untested warning when below min', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 0.5 }
    })
    expect(wrapper.text()).toContain('Beyond tested range')
  })

  it('does not show untested warning within range', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 2 }
    })
    expect(wrapper.text()).not.toContain('Beyond tested range')
  })

  it('shows Scale label', () => {
    const wrapper = mount(ScalingControl, {
      props: { scaling: defaultScaling, modelValue: 1 }
    })
    expect(wrapper.text()).toContain('Scale:')
  })

  it('renders fractional buttons with fraction labels', () => {
    const fractionalScaling = {
      ...defaultScaling,
      tested_range: { min: 0.5, max: 2 }
    }
    const wrapper = mount(ScalingControl, {
      props: { scaling: fractionalScaling, modelValue: 1 }
    })
    const buttons = wrapper.findAll('button')
    expect(buttons[0].text()).toBe('½×')
    expect(buttons[1].text()).toBe('1×')
    expect(buttons[2].text()).toBe('1½×')
    expect(buttons[3].text()).toBe('2×')
  })
})
