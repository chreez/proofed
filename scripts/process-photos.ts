/**
 * Photo pipeline: process source photos into web-optimized WebP.
 *
 * Usage:
 *   npx tsx scripts/process-photos.ts photos-source/{recipe-id}/{date}/
 *   npx tsx scripts/process-photos.ts --dry-run photos-source/{recipe-id}/{date}/
 *   npx tsx scripts/process-photos.ts --all
 *   npx tsx scripts/process-photos.ts --quality 90 photos-source/{recipe-id}/{date}/
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync, existsSync, statSync, unlinkSync } from 'fs'
import { join, basename, extname, resolve, relative } from 'path'
import { execSync } from 'child_process'
import sharp from 'sharp'

const SIZES = [
  { suffix: '800w', width: 800 },
  { suffix: '400w', width: 400 },
] as const

const DEFAULT_QUALITY = 80
const SUPPORTED_EXTENSIONS = new Set(['.heic', '.heif', '.jpg', '.jpeg', '.png'])
const HEIC_EXTENSIONS = new Set(['.heic', '.heif'])
const VIDEO_EXTENSIONS = new Set(['.mov', '.mp4'])
const FRAME_RATE = 1  // 1 frame per second

interface ProcessOptions {
  dryRun: boolean
  quality: number
}

interface ManifestPhoto {
  name: string
  thumb: string
  src: string
  summary: string
  source?: 'video'
  sourceFile?: string
  frameIndex?: number
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

function ffmpegAvailable(): boolean {
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

async function extractVideoFrames(
  videoPath: string,
  outputDir: string,
  options: ProcessOptions
): Promise<Array<{ filename: string; frameIndex: number }>> {
  const videoBasename = sanitizeName(videoPath)
  const framePattern = join(outputDir, `${videoBasename}-frame-%03d.jpg`)

  // Extract frames at 1 FPS to the output directory
  const ffmpegCmd = `ffmpeg -i "${videoPath}" -vf "fps=${FRAME_RATE}" -q:v 2 "${framePattern}"`

  console.log(`  Extracting frames from ${basename(videoPath)} (${FRAME_RATE} fps)...`)

  if (options.dryRun) {
    console.log(`    [dry-run] → would extract frames to ${videoBasename}-frame-*.jpg`)
    return []
  }

  try {
    execSync(ffmpegCmd, { stdio: 'pipe' })
  } catch (err) {
    console.error(`  Error extracting frames from ${basename(videoPath)}: ${err instanceof Error ? err.message : String(err)}`)
    return []
  }

  // Find extracted frames in the output directory
  const frameFiles = readdirSync(outputDir)
    .filter(f => f.startsWith(`${videoBasename}-frame-`) && f.endsWith('.jpg'))
    .sort()

  const result: Array<{ filename: string; frameIndex: number }> = []
  frameFiles.forEach((filename, index) => {
    console.log(`    → ${filename}`)
    result.push({ filename, frameIndex: index })
  })

  return result
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
  options: ProcessOptions,
  videoProvenance?: { sourceFile: string; frameIndex: number }
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

  const photo: ManifestPhoto = {
    name,
    thumb: `${name}-400w.webp`,
    src: `${name}-800w.webp`,
    summary: ''
  }

  // Add video provenance if this frame came from a video
  if (videoProvenance) {
    photo.source = 'video'
    photo.sourceFile = videoProvenance.sourceFile
    photo.frameIndex = videoProvenance.frameIndex
  }

  return photo
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

  const imageFiles = readdirSync(absPath)
    .filter(f => SUPPORTED_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort()

  const videoFiles = readdirSync(absPath)
    .filter(f => VIDEO_EXTENSIONS.has(extname(f).toLowerCase()))
    .sort()

  let totalProcessed = imageFiles.length

  if (imageFiles.length === 0 && videoFiles.length === 0) {
    console.log('  No supported images or videos found.')
    return
  }

  if (imageFiles.length > 0) {
    console.log(`  ${imageFiles.length} images`)
  }
  if (videoFiles.length > 0) {
    console.log(`  ${videoFiles.length} videos`)
  }
  console.log()

  if (!options.dryRun) {
    mkdirSync(outputDir, { recursive: true })
  }

  // Check for ffmpeg if we have video files
  let ffmpegReady = true
  if (videoFiles.length > 0 && !ffmpegAvailable()) {
    console.error('  ERROR: ffmpeg not installed. Install it to extract frames from videos.')
    console.error('  Videos will be skipped. Photo processing continues for non-video files.\n')
    ffmpegReady = false
  }

  const photos: ManifestPhoto[] = []

  // Track extracted frames for provenance
  const extractedFrameMetadata: Record<string, { sourceFile: string; frameIndex: number }> = {}

  // Extract frames from videos first
  if (ffmpegReady && videoFiles.length > 0) {
    console.log('Extracting video frames...\n')
    for (const videoFile of videoFiles) {
      const videoPath = join(absPath, videoFile)
      const frames = await extractVideoFrames(videoPath, outputDir, options)
      // Map extracted frame filenames to their provenance
      frames.forEach(frame => {
        extractedFrameMetadata[frame.filename] = {
          sourceFile: videoFile,
          frameIndex: frame.frameIndex
        }
      })
      totalProcessed += frames.length
    }
    if (videoFiles.length > 0 && !options.dryRun) {
      console.log()
    }
  }

  // Process all images (originals + extracted frames)
  console.log('Processing images...\n')
  for (const file of imageFiles) {
    const photo = await processImage(join(absPath, file), outputDir, options)
    if (photo) photos.push(photo)
  }

  // Process extracted video frames
  const extractedFrames = readdirSync(outputDir)
    .filter(f => f.endsWith('.jpg') && Object.keys(extractedFrameMetadata).includes(f))
    .sort()

  for (const frameFile of extractedFrames) {
    const provenance = extractedFrameMetadata[frameFile]
    const photo = await processImage(join(outputDir, frameFile), outputDir, options, provenance)
    if (photo) {
      photos.push(photo)
    }
    // Delete the temporary JPG frame after processing
    if (!options.dryRun) {
      try {
        const jpgPath = join(outputDir, frameFile)
        if (existsSync(jpgPath)) {
          unlinkSync(jpgPath)
        }
      } catch {
        // Ignore deletion errors
      }
    }
  }

  if (!options.dryRun) {
    const manifest = { recipeId, date, processedAt: new Date().toISOString(), photos }
    writeFileSync(join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n')
    console.log(`  manifest.json written (${photos.length} photos)`)
  }

  console.log(`\n✓ ${totalProcessed} items processed → ${outputDir}`)
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
