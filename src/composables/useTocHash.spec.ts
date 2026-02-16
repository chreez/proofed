import { describe, it, expect } from 'vitest'
import { targetToHash, hashToTarget, targetToElementId, SECTION_TARGETS } from './useTocHash'

describe('useTocHash', () => {
  describe('targetToHash', () => {
    it('maps section targets to hash format', () => {
      expect(targetToHash('nutrition')).toBe('#nutrition-section')
      expect(targetToHash('cook-log')).toBe('#cook-log-section')
      expect(targetToHash('change-log')).toBe('#version-history-section')
      expect(targetToHash('source')).toBe('#source-section')
      expect(targetToHash('research')).toBe('#research-section')
    })

    it('maps stage targets to #stage-{id} format', () => {
      expect(targetToHash('prep')).toBe('#stage-prep')
      expect(targetToHash('bake')).toBe('#stage-bake')
      expect(targetToHash('mix-dough')).toBe('#stage-mix-dough')
    })
  })

  describe('hashToTarget', () => {
    it('returns null for empty or bare hash', () => {
      expect(hashToTarget('')).toBeNull()
      expect(hashToTarget('#')).toBeNull()
    })

    it('maps section hashes to targets', () => {
      expect(hashToTarget('#nutrition-section')).toBe('nutrition')
      expect(hashToTarget('#cook-log-section')).toBe('cook-log')
      expect(hashToTarget('#version-history-section')).toBe('change-log')
      expect(hashToTarget('#source-section')).toBe('#source-section' ? 'source' : null)
      expect(hashToTarget('#research-section')).toBe('research')
    })

    it('maps stage hashes to stage IDs', () => {
      expect(hashToTarget('#stage-prep')).toBe('prep')
      expect(hashToTarget('#stage-bake')).toBe('bake')
      expect(hashToTarget('#stage-mix-dough')).toBe('mix-dough')
    })

    it('handles hashes without # prefix', () => {
      expect(hashToTarget('nutrition-section')).toBe('nutrition')
      expect(hashToTarget('stage-prep')).toBe('prep')
    })

    it('returns null for unrecognized hashes', () => {
      expect(hashToTarget('#unknown')).toBeNull()
      expect(hashToTarget('#bake-2026-01-15')).toBeNull()
    })

    it('round-trips with targetToHash', () => {
      const targets = ['nutrition', 'cook-log', 'change-log', 'source', 'research', 'prep', 'bake']
      for (const target of targets) {
        expect(hashToTarget(targetToHash(target))).toBe(target)
      }
    })
  })

  describe('targetToElementId', () => {
    it('maps section targets to element IDs', () => {
      expect(targetToElementId('nutrition')).toBe('nutrition-section')
      expect(targetToElementId('cook-log')).toBe('cook-log-section')
      expect(targetToElementId('change-log')).toBe('version-history-section')
      expect(targetToElementId('source')).toBe('source-section')
      expect(targetToElementId('research')).toBe('research-section')
    })

    it('maps stage targets to stage-header-{id}', () => {
      expect(targetToElementId('prep')).toBe('stage-header-prep')
      expect(targetToElementId('bake')).toBe('stage-header-bake')
    })
  })

  describe('SECTION_TARGETS', () => {
    it('contains all non-stage section identifiers', () => {
      expect(SECTION_TARGETS).toContain('nutrition')
      expect(SECTION_TARGETS).toContain('cook-log')
      expect(SECTION_TARGETS).toContain('change-log')
      expect(SECTION_TARGETS).toContain('source')
      expect(SECTION_TARGETS).toContain('research')
      expect(SECTION_TARGETS).toHaveLength(5)
    })
  })
})
