import { ref, computed, onUnmounted } from 'vue'

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

export function useTimer(durationMin: number, earlyCheckPercent: number = 0.7) {
  const durationSeconds = durationMin * 60
  const earlyCheckAt = Math.floor(durationSeconds * earlyCheckPercent)

  const elapsedSeconds = ref(0)
  const status = ref<TimerStatus>('idle')
  const earlyCheckFired = ref(false)

  let intervalId: number | null = null

  const remainingSeconds = computed(() =>
    Math.max(0, durationSeconds - elapsedSeconds.value)
  )

  const remainingFormatted = computed(() => {
    const mins = Math.floor(remainingSeconds.value / 60)
    const secs = remainingSeconds.value % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  })

  const progressPercent = computed(() =>
    Math.min(100, (elapsedSeconds.value / durationSeconds) * 100)
  )

  const isEarlyCheck = computed(() =>
    earlyCheckFired.value && status.value === 'running'
  )

  function start() {
    if (status.value === 'running') return
    status.value = 'running'
    intervalId = window.setInterval(tick, 1000)
  }

  function pause() {
    if (status.value !== 'running') return
    status.value = 'paused'
    if (intervalId) clearInterval(intervalId)
  }

  function reset() {
    if (intervalId) clearInterval(intervalId)
    elapsedSeconds.value = 0
    status.value = 'idle'
    earlyCheckFired.value = false
  }

  function tick() {
    elapsedSeconds.value++

    if (!earlyCheckFired.value && elapsedSeconds.value >= earlyCheckAt) {
      earlyCheckFired.value = true
    }

    if (elapsedSeconds.value >= durationSeconds) {
      status.value = 'completed'
      if (intervalId) clearInterval(intervalId)
    }
  }

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  return {
    elapsedSeconds,
    remainingSeconds,
    remainingFormatted,
    progressPercent,
    status,
    isEarlyCheck,
    start,
    pause,
    reset
  }
}
