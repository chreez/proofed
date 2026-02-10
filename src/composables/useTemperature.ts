/**
 * Temperature conversion utility for badge displays.
 * Converts bare °F values in text to badged display with °C available for hover.
 * Also handles bare °C as fallback (converts to °F display with °C tooltip).
 */

export interface TempSegment {
  type: 'text' | 'temp'
  content: string
  /** Alternative unit text for tooltip (only when type === 'temp') */
  alt?: string
}

/**
 * Convert Celsius to Fahrenheit, rounded to nearest integer.
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32)
}

/**
 * Convert Fahrenheit to Celsius, rounded to nearest integer.
 */
export function fahrenheitToCelsius(f: number): number {
  return Math.round((f - 32) * 5 / 9)
}

/**
 * Parse text containing bare temperature values into segments.
 * Handles:
 *   - Bare °F: "350°F" -> badge with "175°C" tooltip
 *   - Bare °C: "24°C" -> badge showing "75°F" with "24°C" tooltip
 *   - Ranges: "105-115°F" -> badge with "41-46°C" tooltip
 *
 * Skips already-paired temps (e.g., "350°F (175°C)") — both units visible.
 */
export function parseTemperatures(text: string): TempSegment[] {
  // Priority order: paired temps matched first (consumed as text), then bare temps (badged).
  // Group 1: paired °F (°C) — pass through
  // Group 2: paired °C (°F) — pass through
  // Groups 3-4: bare °F range
  // Group 5: bare °F single
  // Groups 6-7: bare °C range
  // Group 8: bare °C single
  const tempRegex = /(\d+(?:\s*[–\-]\s*\d+)?°F\s*\(\s*\d+(?:\s*[–\-]\s*\d+)?°C\s*\))|(\d+(?:\s*[–\-]\s*\d+)?°C\s*\(\s*\d+(?:\s*[–\-]\s*\d+)?°F\s*\))|(\d+)\s*[–\-]\s*(\d+)°F|(\d+)°F|(\d+)\s*[–\-]\s*(\d+)°C|(\d+)°C/g

  const segments: TempSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tempRegex.exec(text)) !== null) {
    if (match[1] !== undefined || match[2] !== undefined) {
      // Paired temp — already has both units, skip (consumed by regex, included as text)
      continue
    }

    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[3] !== undefined && match[4] !== undefined) {
      // Bare Fahrenheit range: "105-115°F"
      const low = parseInt(match[3], 10)
      const high = parseInt(match[4], 10)
      const lowC = fahrenheitToCelsius(low)
      const highC = fahrenheitToCelsius(high)
      segments.push({
        type: 'temp',
        content: `${low}–${high}°F`,
        alt: `${lowC}–${highC}°C`
      })
    } else if (match[5] !== undefined) {
      // Bare single Fahrenheit: "350°F"
      const f = parseInt(match[5], 10)
      const c = fahrenheitToCelsius(f)
      segments.push({
        type: 'temp',
        content: `${f}°F`,
        alt: `${c}°C`
      })
    } else if (match[6] !== undefined && match[7] !== undefined) {
      // Bare Celsius range: "23–24°C"
      const low = parseInt(match[6], 10)
      const high = parseInt(match[7], 10)
      const lowF = celsiusToFahrenheit(low)
      const highF = celsiusToFahrenheit(high)
      segments.push({
        type: 'temp',
        content: `${lowF}–${highF}°F`,
        alt: `${low}–${high}°C`
      })
    } else if (match[8] !== undefined) {
      // Bare single Celsius: "24°C"
      const c = parseInt(match[8], 10)
      const f = celsiusToFahrenheit(c)
      segments.push({
        type: 'temp',
        content: `${f}°F`,
        alt: `${c}°C`
      })
    }

    lastIndex = match.index + match[0].length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ type: 'text', content: text.slice(lastIndex) })
  }

  // If no temps found, return the whole thing as text
  if (segments.length === 0) {
    return [{ type: 'text', content: text }]
  }

  return segments
}

/**
 * Check whether text contains any temperature pattern (for badge rendering).
 */
export function hasTemperature(text: string): boolean {
  return /\d+°[FC]/.test(text)
}
