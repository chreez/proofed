/**
 * Pure mapping functions for TOC ↔ URL hash conversion.
 * No DOM or Vue dependencies — fully unit-testable.
 */

/** Maps a TOC navigation target to a URL hash string */
export function targetToHash(target: string): string {
  if (target === 'nutrition') return '#nutrition-section'
  if (target === 'cook-log') return '#cook-log-section'
  if (target === 'change-log') return '#version-history-section'
  if (target === 'source') return '#source-section'
  if (target === 'research') return '#research-section'
  return `#stage-${target}`
}

/** Maps a URL hash to a TOC navigation target. Returns null if unrecognized. */
export function hashToTarget(hash: string): string | null {
  if (!hash || hash === '#') return null
  const h = hash.startsWith('#') ? hash.slice(1) : hash
  if (h === 'nutrition-section') return 'nutrition'
  if (h === 'cook-log-section') return 'cook-log'
  if (h === 'version-history-section') return 'change-log'
  if (h === 'source-section') return 'source'
  if (h === 'research-section') return 'research'
  if (h.startsWith('stage-')) return h.replace('stage-', '')
  return null
}

/** Known section targets (non-stage TOC items) */
export const SECTION_TARGETS = ['nutrition', 'cook-log', 'change-log', 'source', 'research'] as const

/** Maps a TOC target to its DOM element ID for scrolling */
export function targetToElementId(target: string): string {
  if (target === 'nutrition') return 'nutrition-section'
  if (target === 'cook-log') return 'cook-log-section'
  if (target === 'change-log') return 'version-history-section'
  if (target === 'source') return 'source-section'
  if (target === 'research') return 'research-section'
  return `stage-header-${target}`
}
