import { nextTick } from 'vue'

const STAGE_TRANSITION_MS = 300

function getHeaderHeight(): number {
  const header = document.querySelector('header')
  return header ? header.getBoundingClientRect().height : 64
}

export function scrollToNextItem(selector: string): void {
  nextTick(() => {
    const el = document.querySelector(selector)
    if (!el) return

    const headerHeight = getHeaderHeight()
    const rect = el.getBoundingClientRect()
    const isVisible = rect.top >= headerHeight && rect.bottom <= window.innerHeight

    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}

export function scrollToStageAfterTransition(stageId: string): void {
  setTimeout(() => {
    const el = document.getElementById(`stage-header-${stageId}`)
    if (!el) return

    const headerHeight = getHeaderHeight()
    const rect = el.getBoundingClientRect()
    const isVisible = rect.top >= headerHeight && rect.bottom <= window.innerHeight

    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, STAGE_TRANSITION_MS)
}
