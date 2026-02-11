import { computed } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import type { Recipe } from '@/types/recipe'

const BASE_URL = 'https://proofeddot.netlify.app'
const SITE_NAME = 'proofed.'
const DEFAULT_DESCRIPTION = 'A personal cooking notebook. Recipes as structured data.'

export function useRecipeMeta(
  recipe: () => Recipe | null,
  recipeId: () => string | null
): void {
  const title = computed(() => {
    const r = recipe()
    if (r) return `${r.meta.name} — ${SITE_NAME}`
    return SITE_NAME
  })

  const description = computed(() => {
    const r = recipe()
    if (!r) return DEFAULT_DESCRIPTION
    if (r.meta.description) return r.meta.description
    return `A ${SITE_NAME} recipe: ${r.meta.name} — ${r.meta.yields}, ${r.meta.total_time} total`
  })

  const url = computed(() => {
    const id = recipeId()
    if (id) return `${BASE_URL}/recipe/${id}`
    return BASE_URL
  })

  const FALLBACK_IMAGE = `${BASE_URL}/og-image.png`

  const image = computed(() => {
    const r = recipe()
    if (!r?.cook_log?.length) return FALLBACK_IMAGE

    // Most recent entry is first in the array
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
