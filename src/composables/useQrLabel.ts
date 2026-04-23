import QRCodeStyling from 'qr-code-styling'

/** Brand colors */
const ACCENT = '#a65d45'
const INK = '#1a1816'

/** Options for generating a branded QR code canvas */
export interface QrCodeOptions {
  /** URL to encode */
  url: string
  /** QR code pixel size (width & height) */
  size?: number
  /** Error correction level */
  errorCorrection?: 'L' | 'M' | 'Q' | 'H'
}

/** Options for compositing the branded QR label (QR + text) */
export interface QrLabelOptions extends QrCodeOptions {
  /** Label text to render beside the QR code (e.g. "reheat"). Omit for QR-only. */
  labelText?: string
  /** Padding around the label in pixels */
  padding?: number
  /** Font size for the label text */
  fontSize?: number
}

/**
 * Render a branded QR code onto a hidden container and return the canvas element.
 * Resolves after the QRCodeStyling library finishes rendering (~300ms).
 */
export function renderBrandedQr(
  container: HTMLElement,
  options: QrCodeOptions
): Promise<HTMLCanvasElement | null> {
  const { url, size = 256, errorCorrection = 'M' } = options
  container.innerHTML = ''

  const qrCode = new QRCodeStyling({
    width: size,
    height: size,
    type: 'canvas',
    data: url,
    margin: 8,
    dotsOptions: { color: INK, type: 'rounded' },
    cornersSquareOptions: { color: ACCENT, type: 'extra-rounded' },
    cornersDotOptions: { color: ACCENT, type: 'dot' },
    backgroundOptions: { color: '#ffffff' },
    qrOptions: { errorCorrectionLevel: errorCorrection }
  })

  qrCode.append(container)

  return new Promise((resolve) => {
    setTimeout(() => {
      const canvas = container.querySelector('canvas')
      resolve(canvas ?? null)
    }, 300)
  })
}

/**
 * Generate a branded QR label image (QR code + optional text) as a data URL.
 *
 * When `labelText` is provided, renders a horizontal label with the QR on the left
 * and the label text + accent dot on the right (e.g. "reheat.").
 *
 * When `labelText` is omitted, returns just the QR code as a data URL (for print use).
 */
export function generateQrLabelDataUrl(
  qrCanvas: HTMLCanvasElement,
  options: QrLabelOptions
): string | null {
  const { size = 256, labelText, padding = 20, fontSize = 48 } = options

  // No label text — return the raw QR code
  if (!labelText) {
    return qrCanvas.toDataURL('image/png')
  }

  // Measure text to size the right column
  const measure = document.createElement('canvas').getContext('2d')
  let textWidth: number
  if (measure) {
    measure.font = `bold ${fontSize}px "JetBrains Mono", monospace`
    textWidth = measure.measureText(labelText).width
  } else {
    textWidth = fontSize * 0.6 * labelText.length
  }
  const dotRadius = 5
  const gap = 16

  const rightColWidth = textWidth + dotRadius * 2 + 12
  const labelWidth = padding + size + gap + rightColWidth + padding
  const labelHeight = size + padding * 2

  const label = document.createElement('canvas')
  label.width = labelWidth
  label.height = labelHeight
  const ctx = label.getContext('2d')
  if (!ctx) return null

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, labelWidth, labelHeight)

  // QR code on left
  ctx.drawImage(qrCanvas, padding, padding, size, size)

  // Label text, centered vertically
  const textX = padding + size + gap
  const centerY = labelHeight / 2
  ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`
  ctx.textBaseline = 'middle'
  ctx.textAlign = 'left'
  ctx.fillStyle = INK
  ctx.fillText(labelText, textX, centerY)

  // Accent dot after text (brand dot)
  const dotX = textX + textWidth + dotRadius + 4
  const dotY = centerY + fontSize * 0.2
  ctx.beginPath()
  ctx.arc(dotX, dotY, dotRadius, 0, Math.PI * 2)
  ctx.fillStyle = ACCENT
  ctx.fill()

  return label.toDataURL('image/png')
}
