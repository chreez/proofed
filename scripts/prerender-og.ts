/**
 * Post-build script: inject per-recipe Open Graph meta tags into dist/.
 *
 * For each recipe in the manifest, creates dist/recipe/{id}/index.html
 * with recipe-specific OG tags so crawlers/link unfurlers see the right
 * metadata without needing JavaScript execution.
 *
 * Usage (appended to build script):
 *   tsx scripts/prerender-og.ts
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { resolve } from 'path'

const BASE_URL = 'https://proofeddot.netlify.app'
const SITE_NAME = 'proofed.'

interface RecipeEntry {
  id: string
  name: string
  file: string
}

interface RecipeManifest {
  recipes: RecipeEntry[]
}

interface RecipeMeta {
  name: string
  yields: string
  total_time: string
  description?: string
}

interface CookLogPhoto {
  src: string
  thumb: string
  alt: string
}

interface CookLogEntry {
  date: string
  photos?: CookLogPhoto[]
}

interface RecipeJSON {
  meta: RecipeMeta
  cook_log?: CookLogEntry[]
}

function buildDescription(meta: RecipeMeta): string {
  if (meta.description) return meta.description
  return `A ${SITE_NAME} recipe: ${meta.name} — ${meta.yields}, ${meta.total_time} total`
}

/**
 * Resolve the hero image for a recipe from cook_log.
 * Hero = last photo in the photos array of the most recent cook_log entry.
 * Returns the full absolute URL for the 800w WebP, or null if no photos exist.
 */
function resolveHeroImage(recipe: RecipeJSON): string | null {
  const cookLog = recipe.cook_log
  if (!cookLog || cookLog.length === 0) return null

  // Most recent entry is first in the array
  const latestEntry = cookLog[0]
  if (!latestEntry.photos || latestEntry.photos.length === 0) return null

  // Hero convention: last photo in the array
  const heroPhoto = latestEntry.photos[latestEntry.photos.length - 1]
  return `${BASE_URL}${heroPhoto.src}`
}

function buildOgTags(recipe: RecipeJSON, recipeId: string): string {
  const title = `${recipe.meta.name} — ${SITE_NAME}`
  const description = buildDescription(recipe.meta)
  const url = `${BASE_URL}/recipe/${recipeId}`
  const heroImage = resolveHeroImage(recipe)
  const image = heroImage ?? `${BASE_URL}/og-image.png`
  const isHero = heroImage !== null

  // Hero photos are 800w WebP; generic OG image is 1200x630
  const imageWidth = isHero ? '800' : '1200'

  const tags = [
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${SITE_NAME}">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${image}">`,
    `<meta property="og:image:width" content="${imageWidth}">`,
  ]

  // Only include height for the generic image (known 1200x630 ratio)
  // Hero photos have variable height — omitting lets crawlers fetch and measure
  if (!isHero) {
    tags.push(`<meta property="og:image:height" content="630">`)
  }

  tags.push(
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:image" content="${image}">`,
  )

  return tags.join('\n  ')
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function run(): void {
  const root = process.cwd()
  const distDir = resolve(root, 'dist')
  const publicDir = resolve(root, 'public')

  if (!existsSync(distDir)) {
    console.error('dist/ not found — run vite build first')
    process.exit(1)
  }

  const indexHtml = readFileSync(resolve(distDir, 'index.html'), 'utf8')
  const manifest: RecipeManifest = JSON.parse(
    readFileSync(resolve(publicDir, 'recipes', 'index.json'), 'utf8')
  )

  let count = 0

  for (const entry of manifest.recipes) {
    const recipeFile = resolve(publicDir, 'recipes', entry.file)
    if (!existsSync(recipeFile)) {
      console.warn(`  skip: ${entry.file} not found`)
      continue
    }

    const recipe: RecipeJSON = JSON.parse(readFileSync(recipeFile, 'utf8'))
    const ogTags = buildOgTags(recipe, entry.id)
    const title = `${recipe.meta.name} — ${SITE_NAME}`

    // Replace the default OG block with recipe-specific tags
    let html = indexHtml

    // Replace title
    html = html.replace(
      /<title>proofed\.<\/title>/,
      `<title>${escapeHtml(title)}</title>`
    )

    // Replace the OG meta block (between the two comment markers isn't available,
    // so replace individual tags)
    html = html.replace(
      /<!-- Open Graph defaults \(overridden per-route by @unhead\/vue\) -->[\s\S]*?<!-- Twitter Card defaults -->[\s\S]*?<meta name="twitter:image"[^>]*>/,
      ogTags
    )

    const outDir = resolve(distDir, 'recipe', entry.id)
    mkdirSync(outDir, { recursive: true })
    writeFileSync(resolve(outDir, 'index.html'), html)
    count++
    console.log(`  wrote: recipe/${entry.id}/index.html`)
  }

  console.log(`prerender-og: ${count} recipe pages generated`)
}

run()
