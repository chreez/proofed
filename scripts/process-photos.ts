/**
 * Photo pipeline: process source photos into web-optimized WebP.
 *
 * Usage:
 *   npx tsx scripts/process-photos.ts photos-source/{recipe-id}/{date}/
 *   npx tsx scripts/process-photos.ts --dry-run photos-source/{recipe-id}/{date}/
 *   npx tsx scripts/process-photos.ts --all
 *   npx tsx scripts/process-photos.ts --quality 90 photos-source/{recipe-id}/{date}/
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync } from 'fs'
import { join, basename, extname, resolve, relative } from 'path'
import sharp from 'sharp'

const SIZES = [
  { suffix: '800w', width: 800 },
  { suffix: '400w', width: 400 },
] as const

const DEFAULT_QUALITY = 80
const SUPPORTED_EXTENSIONS = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png'])
const HEIC_EXTENSIONS = new Set(['.heic', '.heif'])

interface ProcessOptions {
  dryRun: boolean
  quality: number
}

interface ManifestPhoto {
  name: string
  thumb: string
  src: string
  summary: string
}

function parseArgs(): { sourcePaths: string[]; options: ProcessOptions; all: boolean } {
  const args = process.argv.slice(2)
  const options: ProcessOptions = { dryRun: false, quality: DEFAULT_QUALITY }
  const sourcePaths: string[] = []
  let all = false

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--dry-run') {
      options.dryRun = true
    } else if (args[i] === '--all') {
      all = true
    } else if (args[i] === '--quality' && args[i + 1]) {
      options.quality = parseInt(args[i + 1], 10)
      i++
    } else if (!args[i].startsWith('--')) {
      sourcePaths.push(args[i])
    }
  }

  return { sourcePaths, options, all }
}

function resolveSourceDir(sourcePath: string): { recipeId: string; date: string; absPath: string } {
  const absPath = resolve(sourcePath)
  const parts = relative(resolve('photos-source'), absPath).split('/')

  if (parts.length < 2) {
    throw new Error(`Invalid source path: ${sourcePath}. Expected photos-source/{recipe-id}/{date}/`)
  }

  return { recipeId: parts[0], date: parts[1], absPath }
}

function getOutputDir(recipeId: string, date: string): string {
  return join('public', 'images', recipeId, date)
}

function sanitizeName(filename: string): string {
  return basename(filename, extname(filename))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

async function extractExifDate(buffer: Buffer): Promise<string | null> {
  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.exif) {
      const exifStr = metadata.exif.toString('binary')
      const match = exifStr.match(/(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2}):(\d{2})/)
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`
      }
    }
  } catch {
    // EXIF extraction not critical
  }
  return null
}

async function decodeHeic(sourceBuffer: Buffer): Promise<Buffer> {
  const convert = require('heic-convert')
  const result = await convert({ buffer: sourceBuffer, format: 'PNG' })
  return Buffer.from(result)
}

async function processImage(
  filePath: string,
  outputDir: string,
  options: ProcessOptions
): Promise<ManifestPhoto | null> {
  const ext = extname(filePath).toLowerCase()
  const name = sanitizeName(filePath)
  const sourceBuffer = readFileSync(filePath)

  console.log(`  ${basename(filePath)} → ${name}`)

  // Extract EXIF date from original
  const exifDate = await extractExifDate(sourceBuffer)
  if (exifDate) {
    console.log(`    EXIF date: ${exifDate}`)
  }

  if (options.dryRun) {
    for (const size of SIZES) {
      console.log(`    [dry-run] → ${name}-${size.suffix}.webp`)
    }
    return null
  }

  // HEIC: always use heic-convert (sharp reads metadata but can't decode pixels)
  let imageBuffer: Buffer = sourceBuffer
  if (HEIC_EXTENSIONS.has(ext)) {
    console.log(`    Converting HEIC via heic-convert...`)
    imageBuffer = await decodeHeic(sourceBuffer)
  }

  for (const size of SIZES) {
    const outputName = `${name}-${size.suffix}.webp`
    const outputPath = join(outputDir, outputName)

    await sharp(imageBuffer)
      .rotate()
      .resize(size.width, null, { withoutEnlargement: true })
      .webp({ quality: options.quality })
      .toFile(outputPath)

    const stat = statSync(outputPath)
    console.log(`    → ${outputName} (${(stat.size / 1024).toFixed(0)}KB)`)
  }

  return { name, thumb: `${name}-400w.webp`, src: `${name}-800w.webp`, summary: '' }
}

async function processDirectory(
  sourcePath: string,
  options: ProcessOptions
): Promise<void> {
  const { recipeId, date, absPath } = resolveSourceDir(sourcePath)
  const outputDir = getOutputDir(recipeId, date)

  console.log(`\nRecipe: ${recipeId}`)
  console.log(`Date:   ${date}`)
  console.log(`Output: ${resolve(outputDir)}\n`)

  const files = readdirSync(absPath)
    .filter(f => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort()

  if (files.length === 0) {
    console.log('  No supported images found.')
    return
  }

  console.log(`  ${files.length} images\n`)

  if (!options.dryRun) {
    mkdirSync(outputDir, { recursive: true })
  }

  const photos: ManifestPhoto[] = []
  for (const file of files) {
    const photo = await processImage(join(absPath, file), outputDir, options)
    if (photo) photos.push(photo)
  }

  if (!options.dryRun) {
    const manifest = { recipeId, date, processedAt: new Date().toISOString(), photos }
    writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    console.log(`  manifest.json written (${photos.length} photos)`)
  }

  console.log(`\n✓ ${files.length} images processed → ${outputDir}`)
}

async function processAll(options: ProcessOptions): Promise<void> {
  const sourceRoot = resolve('photos-source')
  if (!existsSync(sourceRoot)) {
    console.error('No photos-source/ directory found.')
    process.exit(1)
  }

  const recipes = readdirSync(sourceRoot).filter(f =>
    statSync(join(sourceRoot, f)).isDirectory()
  )

  let processed = 0
  for (const recipeId of recipes) {
    const recipePath = join(sourceRoot, recipeId)
    const dates = readdirSync(recipePath).filter(f =>
      statSync(join(recipePath, f)).isDirectory()
    )

    for (const date of dates) {
      const sourcePath = join('photos-source', recipeId, date)
      const outputDir = getOutputDir(recipeId, date)

      if (existsSync(outputDir) && readdirSync(outputDir).length > 0) {
        console.log(`Skip ${recipeId}/${date} — already processed`)
        continue
      }

      await processDirectory(sourcePath, options)
      processed++
    }
  }

  if (processed === 0) {
    console.log('Nothing to process — all directories already have output.')
  }
}

async function main(): Promise<void> {
  const { sourcePaths, options, all } = parseArgs()

  if (options.dryRun) {
    console.log('=== DRY RUN ===\n')
  }

  if (all) {
    await processAll(options)
  } else if (sourcePaths.length > 0) {
    for (const sourcePath of sourcePaths) {
      await processDirectory(sourcePath, options)
    }
  } else {
    console.error('Usage:')
    console.error('  npx tsx scripts/process-photos.ts photos-source/{recipe-id}/{date}/')
    console.error('  npx tsx scripts/process-photos.ts --all')
    console.error('  npx tsx scripts/process-photos.ts --dry-run photos-source/{recipe-id}/{date}/')
    process.exit(1)
  }
}

main().catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
