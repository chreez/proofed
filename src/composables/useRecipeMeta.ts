import { computed } from 'vue'
import { useSeoMeta } from '@unhead/vue'
import type { Recipe } from '@/types/recipe'

const BASE_URL = 'https://proofed.netlify.app'
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

  const image = `${BASE_URL}/og-image.png`

  useSeoMeta({
    title,
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogUrl: url,
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: image,
  })
}
