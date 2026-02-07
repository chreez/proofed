import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock onUnmounted since we're not in a component context
vi.mock('vue', async () => {
  const actual = await vi.importActual('vue')
  return {
    ...actual as object,
    onUnmounted: vi.fn()
  }
})

import { useTimer } from './useTimer'

describe('useTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('initializes with idle state', () => {
    const timer = useTimer(5)

    expect(timer.status.value).toBe('idle')
    expect(timer.elapsedSeconds.value).toBe(0)
    expect(timer.remainingSeconds.value).toBe(300) // 5 * 60
    expect(timer.progressPercent.value).toBe(0)
    expect(timer.isEarlyCheck.value).toBe(false)
  })

  it('formats remaining time correctly', () => {
    const timer = useTimer(5)

    expect(timer.remainingFormatted.value).toBe('5:00')
  })

  it('starts the timer and ticks', () => {
    const timer = useTimer(1) // 1 minute = 60 seconds

    timer.start()
    expect(timer.status.value).toBe('running')

    vi.advanceTimersByTime(1000)
    expect(timer.elapsedSeconds.value).toBe(1)
    expect(timer.remainingSeconds.value).toBe(59)

    vi.advanceTimersByTime(4000)
    expect(timer.elapsedSeconds.value).toBe(5)
    expect(timer.remainingSeconds.value).toBe(55)
  })

  it('does not start if already running', () => {
    const timer = useTimer(1)

    timer.start()
    expect(timer.status.value).toBe('running')

    // Starting again should be a no-op
    timer.start()
    expect(timer.status.value).toBe('running')

    vi.advanceTimersByTime(1000)
    expect(timer.elapsedSeconds.value).toBe(1) // only 1 tick, not double
  })

  it('pauses the timer', () => {
    const timer = useTimer(1)

    timer.start()
    vi.advanceTimersByTime(5000)
    expect(timer.elapsedSeconds.value).toBe(5)

    timer.pause()
    expect(timer.status.value).toBe('paused')

    // Advance more time — should not tick
    vi.advanceTimersByTime(5000)
    expect(timer.elapsedSeconds.value).toBe(5)
  })

  it('does not pause if not running', () => {
    const timer = useTimer(1)

    // Pausing when idle should be a no-op
    timer.pause()
    expect(timer.status.value).toBe('idle')

    timer.start()
    timer.pause()
    expect(timer.status.value).toBe('paused')

    // Pausing when already paused should be a no-op
    timer.pause()
    expect(timer.status.value).toBe('paused')
  })

  it('resumes after pause', () => {
    const timer = useTimer(1)

    timer.start()
    vi.advanceTimersByTime(5000)
    timer.pause()
    expect(timer.elapsedSeconds.value).toBe(5)

    timer.start()
    expect(timer.status.value).toBe('running')

    vi.advanceTimersByTime(3000)
    expect(timer.elapsedSeconds.value).toBe(8)
  })

  it('resets the timer', () => {
    const timer = useTimer(1)

    timer.start()
    vi.advanceTimersByTime(5000)
    expect(timer.elapsedSeconds.value).toBe(5)

    timer.reset()
    expect(timer.status.value).toBe('idle')
    expect(timer.elapsedSeconds.value).toBe(0)
    expect(timer.remainingFormatted.value).toBe('1:00')

    // Should not be ticking after reset
    vi.advanceTimersByTime(5000)
    expect(timer.elapsedSeconds.value).toBe(0)
  })

  it('resets earlyCheckFired on reset', () => {
    const timer = useTimer(1, 0.5)

    timer.start()
    // Advance past the early check threshold (30 seconds for 1 min at 50%)
    vi.advanceTimersByTime(31000)
    expect(timer.isEarlyCheck.value).toBe(true)

    timer.reset()
    expect(timer.isEarlyCheck.value).toBe(false)
  })

  it('fires early check at threshold', () => {
    const timer = useTimer(1, 0.7) // 70% of 60s = 42s

    timer.start()

    // Before threshold
    vi.advanceTimersByTime(41000)
    expect(timer.isEarlyCheck.value).toBe(false)

    // At threshold
    vi.advanceTimersByTime(1000) // elapsed = 42
    expect(timer.isEarlyCheck.value).toBe(true)
  })

  it('completes when duration reached', () => {
    const timer = useTimer(1) // 60 seconds

    timer.start()
    vi.advanceTimersByTime(60000) // exactly 60 seconds

    expect(timer.status.value).toBe('completed')
    expect(timer.progressPercent.value).toBe(100)
    expect(timer.remainingSeconds.value).toBe(0)

    // Should not tick past completion
    vi.advanceTimersByTime(5000)
    expect(timer.elapsedSeconds.value).toBe(60)
  })

  it('calculates progress percent correctly', () => {
    const timer = useTimer(1) // 60 seconds

    timer.start()

    vi.advanceTimersByTime(30000) // 30 seconds = 50%
    expect(timer.progressPercent.value).toBe(50)

    vi.advanceTimersByTime(15000) // 45 seconds = 75%
    expect(timer.progressPercent.value).toBe(75)
  })

  it('isEarlyCheck is false when paused', () => {
    const timer = useTimer(1, 0.5) // 50% of 60s = 30s

    timer.start()
    vi.advanceTimersByTime(31000) // past threshold
    expect(timer.isEarlyCheck.value).toBe(true)

    timer.pause()
    // isEarlyCheck requires status === 'running'
    expect(timer.isEarlyCheck.value).toBe(false)
  })

  it('formats remaining time with leading zero on seconds', () => {
    const timer = useTimer(2) // 120 seconds

    timer.start()
    vi.advanceTimersByTime(55000) // 55s elapsed, 65s remaining = 1:05

    expect(timer.remainingFormatted.value).toBe('1:05')
  })

  it('uses default earlyCheckPercent of 0.7', () => {
    const timer = useTimer(10) // 600 seconds, 70% = 420s

    timer.start()
    vi.advanceTimersByTime(419000) // 419 seconds
    expect(timer.isEarlyCheck.value).toBe(false)

    vi.advanceTimersByTime(1000) // 420 seconds
    expect(timer.isEarlyCheck.value).toBe(true)
  })
})
