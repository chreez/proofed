import { computed } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import type { Recipe } from '@/types/recipe'
import { latestCookLogEntryWithHero, findHeroPhoto } from '@/composables/useCookLog'

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

/** Map route names to page titles for non-recipe pages. */
const PAGE_TITLES: Record<string, string> = {
  index: SITE_NAME,
  about: `About — ${SITE_NAME}`,
  stats: `Dashboard — ${SITE_NAME}`,
  'stats-demo': `Dashboard — ${SITE_NAME}`,
  'bake-log': `Cook Log — ${SITE_NAME}`,
  pricing: `Pricing — ${SITE_NAME}`,
  production: `Production — ${SITE_NAME}`,
  labels: `Labels — ${SITE_NAME}`,
  sales: `Sales — ${SITE_NAME}`,
}

export function useRecipeMeta(
  recipe: () => Recipe | null,
  recipeId: () => string | null,
  bakeDate?: () => string | undefined,
  routeName?: () => string | undefined
): void {
  const title = computed(() => {
    // Check for non-recipe pages first
    const rn = routeName?.()
    if (rn && rn in PAGE_TITLES) return PAGE_TITLES[rn]

    const r = recipe()
    const date = bakeDate?.()

    // Print route: business-grade PDF filename
    if (rn === 'recipe-print' && r) {
      const id = recipeId()
      return `bake-sheet-${id}-${r.version}`
    }

    if (r && date) {
      return `${r.meta.name} — ${formatBakeDate(date)} Bake`
    }
    if (r) return `${r.meta.name} — ${SITE_NAME}`
    return SITE_NAME
  })

  const isNonRecipePage = computed(() => {
    const rn = routeName?.()
    return rn != null && rn in PAGE_TITLES
  })

  const description = computed(() => {
    if (isNonRecipePage.value) return DEFAULT_DESCRIPTION

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

  /** Map route names to URL paths for non-recipe pages. */
  const PAGE_URLS: Record<string, string> = {
    index: BASE_URL,
    about: `${BASE_URL}/about`,
    stats: `${BASE_URL}/stats`,
    'stats-demo': `${BASE_URL}/stats`,
    'bake-log': `${BASE_URL}/bake-log`,
    pricing: `${BASE_URL}/pricing`,
    production: `${BASE_URL}/production`,
    labels: `${BASE_URL}/labels`,
    sales: `${BASE_URL}/sales`,
  }

  const url = computed(() => {
    const rn = routeName?.()
    if (rn && rn in PAGE_URLS) return PAGE_URLS[rn]

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
        const heroPhoto = findHeroPhoto(entry.photos)
        return heroPhoto ? `${BASE_URL}${heroPhoto.src}` : FALLBACK_IMAGE
      }
      return FALLBACK_IMAGE
    }

    if (!r?.cook_log?.length) return FALLBACK_IMAGE

    // Recipe-level: most recent entry with a hero-eligible photo
    const latestEntry = latestCookLogEntryWithHero(r.cook_log)
    if (!latestEntry?.photos?.length) return FALLBACK_IMAGE

    const heroPhoto = findHeroPhoto(latestEntry.photos)
    return heroPhoto ? `${BASE_URL}${heroPhoto.src}` : FALLBACK_IMAGE
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
