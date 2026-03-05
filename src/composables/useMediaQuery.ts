import { ref, onMounted, onUnmounted } from 'vue'

/**
 * Reactive media query composable.
 * Returns a ref that tracks whether the given media query matches.
 * Defaults to true when matchMedia is unavailable (SSR/test environments).
 */
export function useMediaQuery(query: string): { matches: import('vue').Ref<boolean> } {
  const canMatch = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
  const matches = ref(canMatch ? window.matchMedia(query).matches : true)
  let mql: MediaQueryList | null = null

  function update(): void {
    matches.value = mql?.matches ?? true
  }

  onMounted(() => {
    if (!canMatch) return
    mql = window.matchMedia(query)
    update()
    mql.addEventListener('change', update)
  })

  onUnmounted(() => {
    mql?.removeEventListener('change', update)
  })

  return { matches }
}
