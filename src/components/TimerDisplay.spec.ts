import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'
import TimerDisplay from './TimerDisplay.vue'

// Mock onUnmounted since we're testing a component that uses useTimer
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual as object,
    onUnmounted: vi.fn()
  }
})

describe('TimerDisplay', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders initial time display', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 5, earlyCheckPercent: 0.7 }
    })

    expect(wrapper.text()).toContain('5:00')
    expect(wrapper.text()).toContain('Start')
  })

  it('starts timer on Start button click', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    await wrapper.find('button').trigger('click') // Start

    vi.advanceTimersByTime(5000)
    await nextTick()

    expect(wrapper.text()).toContain('0:55')
    expect(wrapper.text()).toContain('Pause')
  })

  it('pauses timer on Pause button click', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    // Start
    await wrapper.find('button').trigger('click')
    vi.advanceTimersByTime(5000)
    await nextTick()

    // Pause
    const pauseBtn = wrapper.findAll('button').find(b => b.text() === 'Pause')
    await pauseBtn?.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('Resume')
    expect(wrapper.text()).toContain('Reset')
  })

  it('resets timer on Reset button click', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    // Start
    await wrapper.find('button').trigger('click')
    vi.advanceTimersByTime(5000)
    await nextTick()

    // Pause first
    const pauseBtn = wrapper.findAll('button').find(b => b.text() === 'Pause')
    await pauseBtn?.trigger('click')
    await nextTick()

    // Reset
    const resetBtn = wrapper.findAll('button').find(b => b.text() === 'Reset')
    await resetBtn?.trigger('click')
    await nextTick()

    expect(wrapper.text()).toContain('1:00')
    expect(wrapper.text()).toContain('Start')
  })

  it('shows early check warning', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.5 } // 50% of 60s = 30s
    })

    await wrapper.find('button').trigger('click')
    vi.advanceTimersByTime(31000) // past 30s threshold
    await nextTick()

    expect(wrapper.text()).toContain('Check progress soon!')
  })

  it('shows completion message', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    await wrapper.find('button').trigger('click')
    vi.advanceTimersByTime(60000) // complete 1 minute
    await nextTick()

    expect(wrapper.text()).toContain('Timer complete!')
  })

  it('shows progress bar', () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    const progressBar = wrapper.find('.h-2.bg-stone-200')
    expect(progressBar.exists()).toBe(true)
  })

  it('applies correct color to timer display based on status', async () => {
    const wrapper = mount(TimerDisplay, {
      props: { durationMin: 1, earlyCheckPercent: 0.7 }
    })

    // Idle: text-stone-700
    const timeDisplay = wrapper.find('.text-3xl')
    expect(timeDisplay.classes()).toContain('text-stone-700')

    // Start: text-ink
    await wrapper.find('button').trigger('click')
    await nextTick()

    expect(timeDisplay.classes()).toContain('text-ink')
  })
})
