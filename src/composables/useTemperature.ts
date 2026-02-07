/**
 * Temperature conversion utility for badge displays.
 * Converts °C values in text to °F display with °C available for hover.
 */

export interface TempSegment {
  type: 'text' | 'temp'
  content: string
  /** Original °C text for tooltip (only when type === 'temp') */
  celsius?: string
}

/**
 * Convert Celsius to Fahrenheit, rounded to nearest integer.
 */
export function celsiusToFahrenheit(c: number): number {
  return Math.round(c * 9 / 5 + 32)
}

/**
 * Parse text containing °C temperatures into segments.
 * Handles:
 *   - Single temps: "24°C" -> "75°F"
 *   - Ranges with en-dash or hyphen: "23–24°C" or "23-24°C" -> "74–75°F"
 *
 * Only matches bare °C (not already paired with °F in parentheses),
 * so body text like "24°C (75°F)" is left alone.
 */
export function parseTemperatures(text: string): TempSegment[] {
  // Match temperature patterns:
  // Optional range: number dash/en-dash number, then °C
  // Negative lookahead: not followed by °F reference in any format:
  //   - space + parens: "24°C (75°F)" or "40-46°C (105-115°F)"
  //   - slash: "43°C/110°F"
  const tempRegex = /(\d+)\s*[–\-]\s*(\d+)°C(?!\s*[/(]\s*\d+[–\-]?\d*°F)|(\d+)°C(?!\s*[/(]\s*\d+[–\-]?\d*°F)/g

  const segments: TempSegment[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tempRegex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }

    if (match[1] !== undefined && match[2] !== undefined) {
      // Range: "23–24°C"
      const low = parseInt(match[1], 10)
      const high = parseInt(match[2], 10)
      const lowF = celsiusToFahrenheit(low)
      const highF = celsiusToFahrenheit(high)
      segments.push({
        type: 'temp',
        content: `${lowF}–${highF}°F`,
        celsius: `${low}–${high}°C`
      })
    } else {
      // Single: "24°C"
      const c = parseInt(match[3], 10)
      const f = celsiusToFahrenheit(c)
      segments.push({
        type: 'temp',
        content: `${f}°F`,
        celsius: `${c}°C`
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
 * Check whether text contains any °C temperature pattern (for badge rendering).
 */
export function hasTemperature(text: string): boolean {
  return /\d+°C/.test(text)
}
