import { describe, it, expect } from 'vitest'
import {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  parseTemperatures,
  hasTemperature
} from './useTemperature'

describe('celsiusToFahrenheit', () => {
  it('converts 0°C to 32°F', () => {
    expect(celsiusToFahrenheit(0)).toBe(32)
  })

  it('converts 100°C to 212°F', () => {
    expect(celsiusToFahrenheit(100)).toBe(212)
  })

  it('converts 175°C to 347°F', () => {
    expect(celsiusToFahrenheit(175)).toBe(347)
  })
})

describe('fahrenheitToCelsius', () => {
  it('converts 32°F to 0°C', () => {
    expect(fahrenheitToCelsius(32)).toBe(0)
  })

  it('converts 212°F to 100°C', () => {
    expect(fahrenheitToCelsius(212)).toBe(100)
  })

  it('converts 350°F to 177°C', () => {
    expect(fahrenheitToCelsius(350)).toBe(177)
  })
})

describe('parseTemperatures', () => {
  it('returns plain text when no temperatures', () => {
    const result = parseTemperatures('Mix the flour')
    expect(result).toEqual([{ type: 'text', content: 'Mix the flour' }])
  })

  it('converts bare °F to badge with °C alt', () => {
    const result = parseTemperatures('Preheat to 350°F')
    expect(result).toEqual([
      { type: 'text', content: 'Preheat to ' },
      { type: 'temp', content: '350°F', alt: '177°C' }
    ])
  })

  it('converts bare °C to °F badge with °C alt (fallback)', () => {
    const result = parseTemperatures('Water at 24°C')
    expect(result).toEqual([
      { type: 'text', content: 'Water at ' },
      { type: 'temp', content: '75°F', alt: '24°C' }
    ])
  })

  it('leaves paired °F (°C) as plain text', () => {
    const result = parseTemperatures('Bake at 350°F (175°C)')
    expect(result).toEqual([{ type: 'text', content: 'Bake at 350°F (175°C)' }])
  })

  it('leaves paired °C (°F) as plain text', () => {
    const result = parseTemperatures('Bake at 175°C (350°F)')
    expect(result).toEqual([{ type: 'text', content: 'Bake at 175°C (350°F)' }])
  })

  it('handles bare °F range', () => {
    const result = parseTemperatures('Milk at 105-115°F')
    expect(result).toEqual([
      { type: 'text', content: 'Milk at ' },
      { type: 'temp', content: '105–115°F', alt: '41–46°C' }
    ])
  })

  it('handles bare °C range', () => {
    const result = parseTemperatures('Dough at 23–24°C')
    expect(result).toEqual([
      { type: 'text', content: 'Dough at ' },
      { type: 'temp', content: '73–75°F', alt: '23–24°C' }
    ])
  })

  it('handles text with multiple bare temperatures', () => {
    const result = parseTemperatures('Start at 200°F then raise to 500°F')
    expect(result).toHaveLength(4)
    expect(result[1]).toEqual({ type: 'temp', content: '200°F', alt: '93°C' })
    expect(result[3]).toEqual({ type: 'temp', content: '500°F', alt: '260°C' })
  })
})

describe('hasTemperature', () => {
  it('detects °F', () => {
    expect(hasTemperature('Preheat to 350°F')).toBe(true)
  })

  it('detects °C', () => {
    expect(hasTemperature('Water at 24°C')).toBe(true)
  })

  it('returns false for no temperature', () => {
    expect(hasTemperature('Mix the flour')).toBe(false)
  })
})
