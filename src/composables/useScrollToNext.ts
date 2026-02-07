import { nextTick } from 'vue'

const HEADER_HEIGHT = 64

export function scrollToNextItem(selector: string): void {
  nextTick(() => {
    const el = document.querySelector(selector)
    if (!el) return

    const rect = el.getBoundingClientRect()
    const isVisible = rect.top >= HEADER_HEIGHT && rect.bottom <= window.innerHeight

    if (!isVisible) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  })
}
