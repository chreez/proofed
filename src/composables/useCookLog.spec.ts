import { describe, it, expect } from 'vitest'
import { findHeroPhoto, latestCookLogEntryWithPhotos, sortedCookLog, latestCookLogEntry } from './useCookLog'
import type { CookLogPhoto, CookLogEntry } from '@/types/recipe'

describe('findHeroPhoto', () => {
  it('returns null for undefined', () => {
    expect(findHeroPhoto(undefined)).toBeNull()
  })

  it('returns null for empty array', () => {
    expect(findHeroPhoto([])).toBeNull()
  })

  it('returns hero-tagged photo when present', () => {
    const photos: CookLogPhoto[] = [
      { src: 'a.webp', thumb: 'a-t.webp', alt: 'A', tag: 'process' },
      { src: 'b.webp', thumb: 'b-t.webp', alt: 'B', tag: 'hero' },
      { src: 'c.webp', thumb: 'c-t.webp', alt: 'C', tag: 'process' },
    ]
    expect(findHeroPhoto(photos)?.src).toBe('b.webp')
  })

  it('returns null when tags are used but none is hero', () => {
    const photos: CookLogPhoto[] = [
      { src: 'a.webp', thumb: 'a-t.webp', alt: 'A', tag: 'process' },
      { src: 'b.webp', thumb: 'b-t.webp', alt: 'B', tag: 'step' },
    ]
    expect(findHeroPhoto(photos)).toBeNull()
  })

  it('falls back to last photo when no tags used (legacy)', () => {
    const photos: CookLogPhoto[] = [
      { src: 'a.webp', thumb: 'a-t.webp', alt: 'A' },
      { src: 'b.webp', thumb: 'b-t.webp', alt: 'B' },
    ]
    expect(findHeroPhoto(photos)?.src).toBe('b.webp')
  })

  it('returns null when only tag is exclude', () => {
    const photos: CookLogPhoto[] = [
      { src: 'a.webp', thumb: 'a-t.webp', alt: 'A', tag: 'exclude' },
    ]
    expect(findHeroPhoto(photos)).toBeNull()
  })
})

describe('sortedCookLog', () => {
  it('sorts newest first', () => {
    const entries = [
      { date: '2026-01-01' },
      { date: '2026-03-01' },
      { date: '2026-02-01' },
    ] as CookLogEntry[]
    const sorted = sortedCookLog(entries)
    expect(sorted[0].date).toBe('2026-03-01')
    expect(sorted[2].date).toBe('2026-01-01')
  })
})

describe('latestCookLogEntry', () => {
  it('returns null for undefined', () => {
    expect(latestCookLogEntry(undefined)).toBeNull()
  })

  it('returns most recent entry', () => {
    const entries = [
      { date: '2026-01-01' },
      { date: '2026-03-01' },
    ] as CookLogEntry[]
    expect(latestCookLogEntry(entries)?.date).toBe('2026-03-01')
  })
})

describe('latestCookLogEntryWithPhotos', () => {
  it('returns null for undefined', () => {
    expect(latestCookLogEntryWithPhotos(undefined)).toBeNull()
  })

  it('skips entries without photos', () => {
    const entries = [
      { date: '2026-03-01', photos: [] },
      { date: '2026-02-01', photos: [{ src: 'x.webp', thumb: 'x-t.webp', alt: 'X' }] },
    ] as CookLogEntry[]
    expect(latestCookLogEntryWithPhotos(entries)?.date).toBe('2026-02-01')
  })

  it('skips aberration entries', () => {
    const entries = [
      { date: '2026-03-01', photos: [{ src: 'x.webp', thumb: 'x-t.webp', alt: 'X' }], aberration: true },
      { date: '2026-02-01', photos: [{ src: 'y.webp', thumb: 'y-t.webp', alt: 'Y' }] },
    ] as CookLogEntry[]
    expect(latestCookLogEntryWithPhotos(entries)?.date).toBe('2026-02-01')
  })
})
