import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTechniques, setTechniqueTooltipsEnabled } from './useTechniques'

global.fetch = vi.fn()

const mockTechniques = {
  techniques: {
    'softened': {
      title: 'Softened Butter',
      description: 'Leave at room temperature for 30-60 minutes'
    },
    'room temp': {
      title: 'Room Temperature',
      description: 'Let ingredient sit at room temperature'
    },
    'room': {
      title: 'Room',
      description: 'A shorter keyword'
    }
  }
}

describe('useTechniques', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    // Reset the module-level state by reloading
    const { techniques, loaded } = useTechniques()
    techniques.value = {}
    loaded.value = false
    setTechniqueTooltipsEnabled(true)
  })

  it('loads techniques from /techniques.json', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockTechniques)
    } as Response)

    const { loadTechniques, techniques, loaded } = useTechniques()

    await loadTechniques()

    expect(fetch).toHaveBeenCalledWith('/techniques.json')
    expect(loaded.value).toBe(true)
    expect(techniques.value).toEqual(mockTechniques.techniques)
  })

  it('finds technique by keyword', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockTechniques)
    } as Response)

    const { loadTechniques, findTechnique } = useTechniques()
    await loadTechniques()

    const result = findTechnique('butter, softened')

    expect(result).not.toBeNull()
    expect(result?.keyword).toBe('softened')
    expect(result?.technique.title).toBe('Softened Butter')
  })

  it('returns null for unknown keyword', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockTechniques)
    } as Response)

    const { loadTechniques, findTechnique } = useTechniques()
    await loadTechniques()

    const result = findTechnique('unknown ingredient')

    expect(result).toBeNull()
  })

  it('parses text into segments with techniques', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockTechniques)
    } as Response)

    const { loadTechniques, parseTextWithTechniques } = useTechniques()
    await loadTechniques()

    const result = parseTextWithTechniques('butter, softened')

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({ type: 'text', content: 'butter, ' })
    expect(result[1]).toEqual({
      type: 'technique',
      content: 'softened',
      technique: mockTechniques.techniques['softened']
    })
  })

  it('matches longest keyword first', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      json: () => Promise.resolve(mockTechniques)
    } as Response)

    const { loadTechniques, parseTextWithTechniques } = useTechniques()
    await loadTechniques()

    const result = parseTextWithTechniques('room temp butter')

    // Should match "room temp" not "room"
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      type: 'technique',
      content: 'room temp',
      technique: mockTechniques.techniques['room temp']
    })
    expect(result[1]).toEqual({ type: 'text', content: ' butter' })
  })

  describe('kill switch (PF-283)', () => {
    it('findTechnique returns null when disabled even for matching keyword', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockTechniques)
      } as Response)

      const { loadTechniques, findTechnique } = useTechniques()
      await loadTechniques()

      setTechniqueTooltipsEnabled(false)
      expect(findTechnique('room temp butter')).toBeNull()
    })

    it('parseTextWithTechniques returns single text chunk when disabled', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockTechniques)
      } as Response)

      const { loadTechniques, parseTextWithTechniques } = useTechniques()
      await loadTechniques()

      setTechniqueTooltipsEnabled(false)
      const result = parseTextWithTechniques('room temp butter')
      expect(result).toEqual([{ type: 'text', content: 'room temp butter' }])
    })

    it('re-enabling restores matcher behavior', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        json: () => Promise.resolve(mockTechniques)
      } as Response)

      const { loadTechniques, findTechnique } = useTechniques()
      await loadTechniques()

      setTechniqueTooltipsEnabled(false)
      expect(findTechnique('room temp butter')).toBeNull()

      setTechniqueTooltipsEnabled(true)
      expect(findTechnique('room temp butter')).not.toBeNull()
    })
  })
})
