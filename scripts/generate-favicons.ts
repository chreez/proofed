/**
 * Generate PNG favicon files from the SVG source.
 *
 * Produces:
 *   public/favicon-16x16.png
 *   public/favicon-32x32.png
 *   public/apple-touch-icon.png  (180x180)
 *   public/favicon.ico            (multi-size ICO: 16+32)
 *
 * Usage:
 *   npx tsx scripts/generate-favicons.ts
 */

import sharp from 'sharp'
import { writeFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = typeof import.meta.dirname === 'string'
  ? import.meta.dirname
  : dirname(fileURLToPath(import.meta.url))

const PUBLIC = resolve(__dirname, '..', 'public')

function svgCircle(size: number): Buffer {
  const r = Math.round(size * 0.4375) // ~87.5% diameter → 43.75% radius
  const cx = Math.round(size / 2)
  const cy = Math.round(size / 2)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#a65d45"/></svg>`
  return Buffer.from(svg)
}

/**
 * Build a minimal ICO file containing 16x16 and 32x32 PNG images.
 * ICO format: 6-byte header + 16-byte directory entry per image + PNG data.
 */
function buildIco(pngs: { size: number; data: Buffer }[]): Buffer {
  const headerSize = 6
  const dirEntrySize = 16
  const dirSize = dirEntrySize * pngs.length
  const dataOffset = headerSize + dirSize

  // ICO header: reserved(2) + type(2, 1=ICO) + count(2)
  const header = Buffer.alloc(headerSize)
  header.writeUInt16LE(0, 0)           // reserved
  header.writeUInt16LE(1, 2)           // type: ICO
  header.writeUInt16LE(pngs.length, 4) // image count

  const dirEntries: Buffer[] = []
  let currentOffset = dataOffset

  for (const { size, data } of pngs) {
    const entry = Buffer.alloc(dirEntrySize)
    entry.writeUInt8(size < 256 ? size : 0, 0)  // width (0 = 256)
    entry.writeUInt8(size < 256 ? size : 0, 1)  // height (0 = 256)
    entry.writeUInt8(0, 2)                        // color palette
    entry.writeUInt8(0, 3)                        // reserved
    entry.writeUInt16LE(1, 4)                     // color planes
    entry.writeUInt16LE(32, 6)                    // bits per pixel
    entry.writeUInt32LE(data.length, 8)           // image data size
    entry.writeUInt32LE(currentOffset, 12)        // offset to image data
    dirEntries.push(entry)
    currentOffset += data.length
  }

  return Buffer.concat([header, ...dirEntries, ...pngs.map(p => p.data)])
}

async function main(): Promise<void> {
  const sizes = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'apple-touch-icon.png', size: 180 },
  ]

  const pngBuffers: { name: string; size: number; data: Buffer }[] = []

  for (const { name, size } of sizes) {
    const data = await sharp(svgCircle(size))
      .resize(size, size)
      .png()
      .toBuffer()

    writeFileSync(resolve(PUBLIC, name), data)
    pngBuffers.push({ name, size, data })
    console.log(`  ${name} (${size}x${size}) — ${data.length} bytes`)
  }

  // Build favicon.ico from the 16 and 32 PNGs
  const ico16 = pngBuffers.find(p => p.size === 16)!
  const ico32 = pngBuffers.find(p => p.size === 32)!
  const icoData = buildIco([
    { size: 16, data: ico16.data },
    { size: 32, data: ico32.data },
  ])
  writeFileSync(resolve(PUBLIC, 'favicon.ico'), icoData)
  console.log(`  favicon.ico (16+32 multi-size) — ${icoData.length} bytes`)

  console.log('\nDone. Favicons written to public/')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
