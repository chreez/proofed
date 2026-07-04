import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref, nextTick } from 'vue'
import { readFileSync } from 'fs'
import { join } from 'path'
import {
  useScrollRestore,
  readEntry,
  writeEntry,
  clearEntry,
  isExpired,
  type ScrollRestoreEntry
} from './useScrollRestore'

const KEY_PREFIX = 'proofed:scroll:'

interface ObserverInstance {
  root: Element
  cb: ResizeObserverCallback
  disconnected: boolean
}

let observers: ObserverInstance[] = []

class FakeResizeObserver {
  root: Element | null = null
  disconnected = false
  constructor(public cb: ResizeObserverCallback) {}
  observe(el: Element): void {
    this.root = el
    observers.push({ root: el, cb: this.cb, disconnected: false })
  }
  disconnect(): void {
    this.disconnected = true
    const found = observers.find(o => o.cb === this.cb)
    if (found) found.disconnected = true
  }
  unobserve(): void {}
}

function fireObservers(): void {
  for (const o of observers) {
    if (o.disconnected) continue
    o.cb([], o as unknown as ResizeObserver)
  }
}

function setScrollHeight(h: number): void {
  Object.defineProperty(document.documentElement, 'scrollHeight', {
    configurable: true,
    value: h
  })
}

function setViewport(h: number): void {
  Object.defineProperty(window, 'innerHeight', {
    configurable: true,
    value: h
  })
}

describe('useScrollRestore', () => {
  let lsStore: Record<string, string> = {}

  beforeEach(() => {
    lsStore = {}
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (k: string) => (k in lsStore ? lsStore[k] : null),
        setItem: (k: string, v: string) => { lsStore[k] = String(v) },
        removeItem: (k: string) => { delete lsStore[k] },
        clear: () => { lsStore = {} },
        length: 0,
        key: () => null
      }
    })
    observers = []
    // @ts-expect-error install fake
    globalThis.ResizeObserver = FakeResizeObserver
    setScrollHeight(1000)
    setViewport(800)
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    window.location.hash = ''
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb: FrameRequestCallback) => {
      cb(performance.now())
      return 1
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('storage helpers', () => {
    it('reads and writes entries', () => {
      const entry: ScrollRestoreEntry = {
        offset: 1234,
        savedAt: new Date().toISOString(),
        version: 'v1.0.0'
      }
      writeEntry('recipe-a', entry)
      expect(readEntry('recipe-a')).toEqual(entry)
    })

    it('returns null for missing entries', () => {
      expect(readEntry('nothing')).toBeNull()
    })

    it('returns null for malformed entries', () => {
      window.localStorage.setItem(KEY_PREFIX + 'bad', 'not-json')
      expect(readEntry('bad')).toBeNull()
    })

    it('clears entries', () => {
      writeEntry('r', { offset: 1, savedAt: 'x', version: 'v' })
      clearEntry('r')
      expect(window.localStorage.getItem(KEY_PREFIX + 'r')).toBeNull()
    })

    it('detects expiry (>24h)', () => {
      const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      expect(isExpired({ offset: 0, savedAt: old, version: 'v' })).toBe(true)
      const fresh = new Date().toISOString()
      expect(isExpired({ offset: 0, savedAt: fresh, version: 'v' })).toBe(false)
    })

    it('treats bad savedAt as expired', () => {
      expect(isExpired({ offset: 0, savedAt: 'nope', version: 'v' })).toBe(true)
    })
  })

  describe('restore behavior', () => {
    it('skips restore if URL has a hash', () => {
      window.location.hash = '#some-anchor'
      writeEntry('r1', { offset: 500, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r1')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      expect(window.scrollTo).not.toHaveBeenCalled()
    })

    it('skips restore + clears entry if version mismatches', () => {
      writeEntry('r2', { offset: 500, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r2')
      const version = ref('v2')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      expect(window.scrollTo).not.toHaveBeenCalled()
      expect(readEntry('r2')).toBeNull()
    })

    it('skips restore + clears entry if older than TTL', () => {
      const old = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
      writeEntry('r3', { offset: 500, savedAt: old, version: 'v1' })
      const id = ref('r3')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      expect(window.scrollTo).not.toHaveBeenCalled()
      expect(readEntry('r3')).toBeNull()
    })

    it('scrolls immediately when DOM is already tall enough', () => {
      setScrollHeight(5000)
      setViewport(800)
      writeEntry('r4', { offset: 1200, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r4')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 1200, behavior: 'auto' })
    })

    it('waits for scrollHeight to grow before scrolling', () => {
      setScrollHeight(500)
      setViewport(800)
      writeEntry('r5', { offset: 2000, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r5')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      // Not tall enough yet
      expect(window.scrollTo).not.toHaveBeenCalled()
      // Grow the DOM
      setScrollHeight(3000)
      fireObservers()
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 2000, behavior: 'auto' })
    })

    it('watchdog: scrolls to bottom after 3 stable observations if target unreachable', () => {
      setScrollHeight(500)
      setViewport(800)
      writeEntry('r6', { offset: 5000, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r6')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      // Fire 3 stable (no growth)
      fireObservers()
      fireObservers()
      fireObservers()
      // scrollHeight 500 - viewport 800 = -300, clamped to 0
      expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'auto' })
    })

    it('watchdog resets stable count if height changes materially', () => {
      setScrollHeight(500)
      setViewport(800)
      writeEntry('r7', { offset: 5000, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r7')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()

      fireObservers() // stable 1
      fireObservers() // stable 2
      setScrollHeight(600) // material growth
      fireObservers() // resets to 0
      fireObservers() // stable 1
      fireObservers() // stable 2

      expect(window.scrollTo).not.toHaveBeenCalled()

      // One more stable → watchdog kicks
      fireObservers()
      expect(window.scrollTo).toHaveBeenCalled()
    })
  })

  describe('save behavior', () => {
    it('writes scroll offset to localStorage on scroll event', () => {
      const id = ref('r8')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 750 })
      window.dispatchEvent(new Event('scroll'))
      const entry = readEntry('r8')
      expect(entry?.offset).toBe(750)
      expect(entry?.version).toBe('v1')
    })

    it('clears storage when scrolled to top (offset < 1)', () => {
      writeEntry('r9', { offset: 500, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r9')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
      window.dispatchEvent(new Event('scroll'))
      expect(readEntry('r9')).toBeNull()
    })

    it('stopTracking removes scroll listener', () => {
      const id = ref('r10')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      restore.stopTracking()
      Object.defineProperty(window, 'scrollY', { configurable: true, value: 999 })
      window.dispatchEvent(new Event('scroll'))
      expect(readEntry('r10')).toBeNull()
    })

    it('clearCurrent removes the tracked recipe entry', () => {
      writeEntry('r11', { offset: 500, savedAt: new Date().toISOString(), version: 'v1' })
      const id = ref('r11')
      const version = ref('v1')
      const restore = useScrollRestore(id, version)
      restore.startTracking()
      restore.clearCurrent()
      expect(readEntry('r11')).toBeNull()
    })
  })

  describe('source hygiene', () => {
    it('module source uses ResizeObserver + rAF, not setTimeout or magic delays', () => {
      const src = readFileSync(join(__dirname, 'useScrollRestore.ts'), 'utf-8')
      expect(src).toContain('ResizeObserver')
      expect(src).toContain('requestAnimationFrame')
      expect(src).not.toContain('setTimeout')
    })
  })
})
