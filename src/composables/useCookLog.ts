import type { CookLogEntry } from '@/types/recipe'

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
 * or null if no entries have photos (or entries is empty/undefined).
 */
export function latestCookLogEntryWithPhotos(entries: CookLogEntry[] | undefined): CookLogEntry | null {
  if (!entries?.length) return null
  return sortedCookLog(entries).find(e => e.photos && e.photos.length > 0) ?? null
}
