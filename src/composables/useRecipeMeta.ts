import { computed } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import type { Recipe } from '@/types/recipe'

const BASE_URL = 'https://proofeddot.netlify.app'
const SITE_NAME = 'proofed.'
const DEFAULT_DESCRIPTION = 'A personal cooking notebook. Recipes as structured data.'

/**
 * Format a date string (YYYY-MM-DD) as "Mon DD, YYYY" (e.g., "Feb 10, 2026").
 */
export function formatBakeDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

/**
 * Truncate a string to maxLen characters, adding ellipsis if truncated.
 */
function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text
  return text.slice(0, maxLen - 1).trimEnd() + '\u2026'
}

export function useRecipeMeta(
  recipe: () => Recipe | null,
  recipeId: () => string | null,
  bakeDate?: () => string | undefined
): void {
  const title = computed(() => {
    const r = recipe()
    const date = bakeDate?.()
    if (r && date) {
      return `${r.meta.name} — ${formatBakeDate(date)} Bake`
    }
    if (r) return `${r.meta.name} — ${SITE_NAME}`
    return SITE_NAME
  })

  const description = computed(() => {
    const r = recipe()
    const date = bakeDate?.()

    if (r && date) {
      // Find matching cook_log entry
      const entry = r.cook_log?.find(e => e.date === date)
      if (entry?.summary) return truncate(entry.summary, 150)
    }

    if (!r) return DEFAULT_DESCRIPTION
    if (r.meta.description) return r.meta.description
    return `A ${SITE_NAME} recipe: ${r.meta.name} — ${r.meta.yields}, ${r.meta.total_time} total`
  })

  const url = computed(() => {
    const id = recipeId()
    const date = bakeDate?.()
    if (id && date) return `${BASE_URL}/recipe/${id}/bake/${date}`
    if (id) return `${BASE_URL}/recipe/${id}`
    return BASE_URL
  })

  const FALLBACK_IMAGE = `${BASE_URL}/og-image.png`

  const image = computed(() => {
    const r = recipe()
    const date = bakeDate?.()

    if (r && date) {
      // Bake-specific: hero from that bake's photos
      const entry = r.cook_log?.find(e => e.date === date)
      if (entry?.photos?.length) {
        const heroPhoto = entry.photos[entry.photos.length - 1]
        return `${BASE_URL}${heroPhoto.src}`
      }
      return FALLBACK_IMAGE
    }

    if (!r?.cook_log?.length) return FALLBACK_IMAGE

    // Recipe-level: most recent entry's hero
    const latestEntry = r.cook_log[0]
    if (!latestEntry.photos?.length) return FALLBACK_IMAGE

    // Hero convention: last photo in the array (800w WebP)
    const heroPhoto = latestEntry.photos[latestEntry.photos.length - 1]
    return `${BASE_URL}${heroPhoto.src}`
  })

  const imageWidth = computed(() => image.value === FALLBACK_IMAGE ? 1200 : 800)
  const imageHeight = computed(() => image.value === FALLBACK_IMAGE ? 630 : undefined)

  useSeoMeta({
    title,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
    ogImageWidth: imageWidth,
    ogImageHeight: imageHeight,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })
}
