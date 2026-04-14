/**
 * Photo editing script: apply geometric transforms to images via Sharp.js
 *
 * Usage (single operation):
 *   npx tsx scripts/edit-photo.ts \
 *     --input public/images/recipe-id/date/photo-name-800w.webp \
 *     --operation crop \
 *     --params '{"left":100,"top":50,"width":600,"height":400}' \
 *     --version 1 \
 *     --instruction "crop tighter on the subject"
 *
 * Usage (multiple operations):
 *   npx tsx scripts/edit-photo.ts \
 *     --input public/images/recipe-id/date/photo-name-800w.webp \
 *     --operations '[{"op":"flip","params":{"direction":"horizontal"}},{"op":"crop","params":{"left":50,"top":30,"width":600,"height":350}}]' \
 *     --version 1 \
 *     --instruction "flip horizontal + crop with padding"
 *
 * Supported operations:
 *   - crop: {left, top, width, height} (pixels)
 *   - rotate: {angle} (90, 180, 270 degrees)
 *   - resize: {width?, height?} (pixels, optional — maintains aspect if only one given)
 *   - flip: {direction} ("horizontal" | "vertical")
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join, dirname, basename, extname } from 'path'
import sharp from 'sharp'

interface EditParams {
  // crop
  left?: number
  top?: number
  width?: number
  height?: number
  // rotate
  angle?: number
  // resize (explicit)
  resizeWidth?: number
  resizeHeight?: number
  // flip
  direction?: 'horizontal' | 'vertical'
}

interface ManifestPhotoVersion {
  version: number
  thumb: string
  src: string
  editInstruction: string
  editedAt: string
}

interface ManifestPhoto {
  name: string
  thumb: string
  src: string
  summary: string
  versions?: ManifestPhotoVersion[]
}

interface Manifest {
  recipeId: string
  date: string
  processedAt: string
  photos: ManifestPhoto[]
}

const SIZES = [
  { suffix: '800w', width: 800 },
  { suffix: '400w', width: 400 }
] as const

const DEFAULT_QUALITY = 80

interface EditOperation {
  op: string
  params: EditParams
}

interface ParsedArgs {
  inputPath: string
  operations: EditOperation[]
  version: number
  instruction: string
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2)
  const opts: Record<string, string> = {}

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].slice(2)
      const value = args[i + 1]
      if (value && !value.startsWith('--')) {
        opts[key] = value
        i++
      }
    }
  }

  let operations: EditOperation[]

  if (opts.operations) {
    // Multi-op mode
    try {
      operations = JSON.parse(opts.operations) as EditOperation[]
    } catch {
      console.error('Invalid JSON in --operations')
      process.exit(1)
    }
  } else if (opts.operation && opts.params) {
    // Single-op mode (backward compat)
    try {
      operations = [{ op: opts.operation, params: JSON.parse(opts.params) as EditParams }]
    } catch {
      console.error('Invalid JSON in --params')
      process.exit(1)
    }
  } else {
    console.error('Usage:')
    console.error('  Single: --operation crop --params \'{"left":100,"top":50,"width":600,"height":400}\'')
    console.error('  Multi:  --operations \'[{"op":"flip","params":{"direction":"horizontal"}},{"op":"crop","params":{"left":50,"top":30,"width":600,"height":350}}]\'')
    process.exit(1)
  }

  if (!opts.input) {
    console.error('--input is required')
    process.exit(1)
  }

  return {
    inputPath: opts.input,
    operations,
    version: parseInt(opts.version || '1', 10),
    instruction: opts.instruction || ''
  }
}

function extractPhotoName(filePath: string): string {
  const filename = basename(filePath)
  // Remove the -800w or -400w suffix, version suffix, and extension
  return filename
    .replace(/-800w\.webp$/, '')
    .replace(/-400w\.webp$/, '')
    .replace(/\.webp$/, '')
    .replace(/-v\d+$/, '')
}

async function applyTransform(imageBuffer: Buffer, operation: string, params: EditParams): Promise<Buffer> {
  let transformer = sharp(imageBuffer)

  switch (operation) {
    case 'crop':
      if (params.left !== undefined && params.top !== undefined && params.width !== undefined && params.height !== undefined) {
        transformer = transformer.extract({
          left: Math.round(params.left),
          top: Math.round(params.top),
          width: Math.round(params.width),
          height: Math.round(params.height)
        })
      } else {
        throw new Error('crop requires left, top, width, height parameters')
      }
      break

    case 'rotate':
      if (params.angle !== undefined && [90, 180, 270].includes(params.angle)) {
        transformer = transformer.rotate(params.angle)
      } else {
        throw new Error('rotate requires angle parameter (90, 180, or 270)')
      }
      break

    case 'resize':
      {
        const width = params.resizeWidth || params.width
        const height = params.resizeHeight || params.height
        if (width || height) {
          transformer = transformer.resize(width || null, height || null, {
            withoutEnlargement: true
          })
        } else {
          throw new Error('resize requires width and/or height parameters')
        }
      }
      break

    case 'flip':
      if (params.direction === 'horizontal') {
        transformer = transformer.flop()
      } else if (params.direction === 'vertical') {
        transformer = transformer.flip()
      } else {
        throw new Error('flip requires direction parameter (horizontal or vertical)')
      }
      break

    default:
      throw new Error(`Unknown operation: ${operation}`)
  }

  // Return as PNG buffer (lossless intermediate) to avoid re-encoding quality loss
  return transformer.png().toBuffer()
}

async function editPhoto(args: ParsedArgs): Promise<void> {
  if (!existsSync(args.inputPath)) {
    console.error(`Input file not found: ${args.inputPath}`)
    process.exit(1)
  }

  const inputBuffer = readFileSync(args.inputPath)
  const photoName = extractPhotoName(args.inputPath)
  const outputDir = dirname(args.inputPath)
  const manifestPath = join(outputDir, 'manifest.json')

  console.log(`Photo name: ${photoName}`)
  console.log(`Operations: ${args.operations.map(o => o.op).join(' → ')}`)
  console.log(`Version: ${args.version}`)
  console.log(`Instruction: ${args.instruction}`)
  console.log()

  // Apply all transforms sequentially
  console.log('Applying transforms...')
  let buffer = inputBuffer
  for (const operation of args.operations) {
    console.log(`  Applying ${operation.op}...`)
    buffer = await applyTransform(buffer, operation.op, operation.params)
  }

  // Generate versioned outputs
  const versionSuffix = `v${args.version}`
  const outputFiles: string[] = []

  for (const size of SIZES) {
    const outputName = `${photoName}-${versionSuffix}-${size.suffix}.webp`
    const outputPath = join(outputDir, outputName)

    const resized = await sharp(buffer)
      .resize(size.width, null, { withoutEnlargement: true })
      .webp({ quality: DEFAULT_QUALITY })
      .toFile(outputPath)

    console.log(`✓ ${outputName} (${(resized.size / 1024).toFixed(0)}KB)`)
    outputFiles.push(outputName)
  }

  // Update manifest
  if (existsSync(manifestPath)) {
    try {
      const manifestContent = readFileSync(manifestPath, 'utf-8')
      const manifest: Manifest = JSON.parse(manifestContent)

      // Find the photo in manifest
      const photo = manifest.photos.find(p => p.name === photoName)
      if (photo) {
        if (!photo.versions) {
          photo.versions = []
        }

        // Add version entry
        const versionEntry: ManifestPhotoVersion = {
          version: args.version,
          thumb: `${photoName}-${versionSuffix}-400w.webp`,
          src: `${photoName}-${versionSuffix}-800w.webp`,
          editInstruction: args.instruction,
          editedAt: new Date().toISOString()
        }

        // Replace existing version if it exists, otherwise add
        const existingIndex = photo.versions.findIndex(v => v.version === args.version)
        if (existingIndex >= 0) {
          photo.versions[existingIndex] = versionEntry
        } else {
          photo.versions.push(versionEntry)
        }

        // Write updated manifest
        writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
        console.log()
        console.log(`✓ manifest.json updated with version ${args.version}`)
      } else {
        console.error(`Photo "${photoName}" not found in manifest.json`)
        process.exit(1)
      }
    } catch (err) {
      console.error('Error updating manifest:', err)
      process.exit(1)
    }
  } else {
    console.warn(`Warning: manifest.json not found at ${manifestPath}`)
    console.warn('Version entry not recorded in manifest')
  }

  // Output result
  console.log()
  console.log(JSON.stringify({
    success: true,
    files: outputFiles,
    manifest: 'updated'
  }, null, 2))
}

const args = parseArgs()
editPhoto(args).catch(err => {
  console.error('Error:', err.message)
  process.exit(1)
})
