import type { CookLogEntry, CookLogPhoto } from '@/types/recipe'

/**
 * Returns cook log entries sorted newest-first by date.
 */
export function sortedCookLog(entries: CookLogEntry[]): CookLogEntry[] {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date))
}

/**
 * Returns the most recent cook log entry by date, or null if empty/undefined.
 */
export function latestCookLogEntry(entries: CookLogEntry[] | undefined): CookLogEntry | null {
  if (!entries?.length) return null
  return sortedCookLog(entries)[0]
}

/**
 * Returns the most recent cook log entry that has a non-empty photos array,
 * skipping aberration entries (they show thumbnails in bake log but not as hero).
 * Returns null if no qualifying entries have photos.
 */
export function latestCookLogEntryWithPhotos(entries: CookLogEntry[] | undefined): CookLogEntry | null {
  if (!entries?.length) return null
  return sortedCookLog(entries).find(e => e.photos && e.photos.length > 0 && !e.aberration) ?? null
}

/**
 * Returns the hero photo from a photos array.
 * If any photo has tag "hero", use that. Otherwise fall back to last photo
 * (legacy convention). Returns null if no photos or all are excluded.
 */
export function findHeroPhoto(photos: CookLogPhoto[] | undefined): CookLogPhoto | null {
  if (!photos?.length) return null
  const tagged = photos.find(p => p.tag === 'hero')
  if (tagged) return tagged
  // Legacy: last photo is hero — but only if no tags are used at all
  const anyTagged = photos.some(p => p.tag)
  if (anyTagged) return null
  return photos[photos.length - 1]
}

/**
 * Returns the most recent cook log entry that has a hero-eligible photo.
 * Skips aberrations and entries where all photos are tagged non-hero.
 */
export function latestCookLogEntryWithHero(entries: CookLogEntry[] | undefined): CookLogEntry | null {
  if (!entries?.length) return null
  return sortedCookLog(entries).find(e =>
    e.photos && e.photos.length > 0 && !e.aberration && findHeroPhoto(e.photos) !== null
  ) ?? null
}
