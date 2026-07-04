import { ref, watch, onBeforeUnmount, getCurrentInstance, type Ref } from 'vue'

/**
 * PF-281 — restore scroll position when reloading a recipe.
 *
 * Save: rAF-throttled window scroll listener → localStorage.
 * Restore: on `startTracking()`, if URL has a hash, skip. Else if the stored
 * entry is fresh (<24h), matches the current recipe version, and the DOM
 * grows tall enough to reach the saved offset, scroll there. Uses
 * ResizeObserver — no timing guesses.
 */

const STORAGE_PREFIX = 'proofed:scroll:'
const TTL_MS = 24 * 60 * 60 * 1000
const STABLE_HEIGHT_DELTA_PX = 8
const STABLE_OBSERVATION_COUNT = 3

export interface ScrollRestoreEntry {
  offset: number
  savedAt: string
  version: string
}

function storageKey(recipeId: string): string {
  return STORAGE_PREFIX + recipeId
}

export function readEntry(recipeId: string): ScrollRestoreEntry | null {
  try {
    const raw = window.localStorage.getItem(storageKey(recipeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ScrollRestoreEntry
    if (
      typeof parsed.offset !== 'number' ||
      typeof parsed.savedAt !== 'string' ||
      typeof parsed.version !== 'string'
    ) {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function writeEntry(recipeId: string, entry: ScrollRestoreEntry): void {
  try {
    window.localStorage.setItem(storageKey(recipeId), JSON.stringify(entry))
  } catch {
    // localStorage may be full or unavailable — silent no-op
  }
}

export function clearEntry(recipeId: string): void {
  try {
    window.localStorage.removeItem(storageKey(recipeId))
  } catch {
    // ignore
  }
}

export function isExpired(entry: ScrollRestoreEntry, now: number = Date.now()): boolean {
  const savedAtMs = Date.parse(entry.savedAt)
  if (Number.isNaN(savedAtMs)) return true
  return now - savedAtMs > TTL_MS
}

/**
 * Compose scroll save/restore for the recipe route.
 *
 * `recipeId` and `recipeVersion` may be reactive — when either changes to a
 * non-empty value we treat that as a new tracking session (start save,
 * attempt restore). When they clear (route away), stop tracking.
 */
export function useScrollRestore(
  recipeId: Ref<string | null | undefined>,
  recipeVersion: Ref<string | null | undefined>
) {
  const isTracking = ref(false)
  let rafId: number | null = null
  let scrollHandler: (() => void) | null = null
  let observer: ResizeObserver | null = null
  let currentTrackedId: string | null = null

  function scheduleSave(id: string, version: string): void {
    if (rafId !== null) return
    rafId = window.requestAnimationFrame(() => {
      rafId = null
      const offset = window.scrollY
      // Don't persist the top-of-page — nothing to restore, just noise
      if (offset < 1) {
        clearEntry(id)
        return
      }
      writeEntry(id, {
        offset,
        savedAt: new Date().toISOString(),
        version
      })
    })
  }

  function attemptRestore(id: string, version: string, rootEl: HTMLElement | null): void {
    // Hash always wins
    if (window.location.hash) return

    const entry = readEntry(id)
    if (!entry) return

    if (entry.version !== version) {
      clearEntry(id)
      return
    }

    if (isExpired(entry)) {
      clearEntry(id)
      return
    }

    const target = entry.offset

    const doScroll = (top: number): void => {
      window.scrollTo({ top, behavior: 'auto' })
    }

    const targetReachable = (): boolean => {
      const viewport = window.innerHeight
      const scrollable = document.documentElement.scrollHeight
      return scrollable >= target + viewport || scrollable - viewport >= target
    }

    // Optimistic fast path — already tall enough at mount
    if (targetReachable()) {
      doScroll(target)
      return
    }

    // Watch the recipe root grow. Disconnect once we can reach the offset,
    // or after 3 stable observations if the target became unreachable.
    let lastHeight = document.documentElement.scrollHeight
    let stableCount = 0

    const targetEl: HTMLElement = rootEl ?? document.documentElement

    observer = new ResizeObserver(() => {
      const height = document.documentElement.scrollHeight
      const delta = Math.abs(height - lastHeight)
      lastHeight = height

      if (targetReachable()) {
        doScroll(target)
        observer?.disconnect()
        observer = null
        return
      }

      if (delta < STABLE_HEIGHT_DELTA_PX) {
        stableCount++
        if (stableCount >= STABLE_OBSERVATION_COUNT) {
          // Content never got tall enough — go to the bottom and stop
          const viewport = window.innerHeight
          const maxScroll = Math.max(0, document.documentElement.scrollHeight - viewport)
          doScroll(maxScroll)
          observer?.disconnect()
          observer = null
        }
      } else {
        stableCount = 0
      }
    })
    observer.observe(targetEl)
  }

  function startTracking(rootEl: HTMLElement | null = null): void {
    if (isTracking.value) return
    const id = recipeId.value
    const version = recipeVersion.value
    if (!id || !version) return

    currentTrackedId = id
    isTracking.value = true

    attemptRestore(id, version, rootEl)

    scrollHandler = () => {
      const activeId = recipeId.value
      const activeVersion = recipeVersion.value
      if (!activeId || !activeVersion) return
      scheduleSave(activeId, activeVersion)
    }
    window.addEventListener('scroll', scrollHandler, { passive: true })
  }

  function stopTracking(): void {
    if (!isTracking.value) return
    isTracking.value = false
    currentTrackedId = null
    if (scrollHandler) {
      window.removeEventListener('scroll', scrollHandler)
      scrollHandler = null
    }
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId)
      rafId = null
    }
    if (observer) {
      observer.disconnect()
      observer = null
    }
  }

  function clearCurrent(): void {
    const id = currentTrackedId ?? recipeId.value
    if (!id) return
    clearEntry(id)
  }

  watch(
    () => [recipeId.value, recipeVersion.value] as const,
    ([nextId, nextVersion], [prevId]) => {
      if (nextId !== prevId) {
        stopTracking()
      }
      if (nextId && nextVersion) {
        // Caller re-invokes startTracking() with rootEl after DOM mounts;
        // this watch just makes sure a route-away tears things down.
      }
    }
  )

  if (getCurrentInstance()) {
    onBeforeUnmount(() => {
      stopTracking()
    })
  }

  return {
    startTracking,
    stopTracking,
    clearCurrent,
    isTracking
  }
}
