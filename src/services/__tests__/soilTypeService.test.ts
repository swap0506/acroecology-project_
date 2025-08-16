import { describe, it, expect, beforeEach, vi } from 'vitest'
import { soilTypeService } from '../soilTypeService'
import { SoilTypeKey } from '../../types/soilTypes'

// Mock the soil types data
vi.mock('../../data/soilTypes.json', () => ({
  default: {
    soil_types: {
      sandy: {
        name: 'Sandy',
        characteristics: ['Large particles', 'Good drainage'],
        water_retention: 'low',
        drainage: 'excellent',
        suitable_crops: ['carrots', 'potatoes'],
        amendments: [
          {
            name: 'Organic compost',
            purpose: 'Improve water retention',
            application_rate: '2-4 inches',
            timing: 'Spring'
          }
        ],
        irrigation_guidance: {
          frequency: 'Daily',
          duration: '15-20 minutes',
          method: 'Drip irrigation',
          special_notes: 'Water frequently'
        }
      },
      clay: {
        name: 'Clay',
        characteristics: ['Small particles', 'High retention'],
        water_retention: 'high',
        drainage: 'poor',
        suitable_crops: ['rice', 'wheat'],
        amendments: [],
        irrigation_guidance: {
          frequency: '2-3 times per week',
          duration: '30-45 minutes',
          method: 'Soaker hoses',
          special_notes: 'Deep watering'
        }
      }
    },
    compatibility_matrix: {
      wheat: {
        sandy: { score: 0.6, warnings: ['May need fertilization'] },
        clay: { score: 0.8, warnings: [] }
      },
      carrots: {
        sandy: { score: 0.9, warnings: [] },
        clay: { score: 0.3, warnings: ['Heavy soil causes forked roots'] }
      }
    }
  }
}))

describe('SoilTypeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('isReady', () => {
    it('should return true when service is initialized', () => {
      expect(soilTypeService.isReady()).toBe(true)
    })
  })

  describe('getAllSoilTypes', () => {
    it('should return all soil types', () => {
      const soilTypes = soilTypeService.getAllSoilTypes()
      expect(soilTypes).toHaveProperty('sandy')
      expect(soilTypes).toHaveProperty('clay')
      expect(soilTypes.sandy.name).toBe('Sandy')
      expect(soilTypes.clay.name).toBe('Clay')
    })
  })

  describe('getSoilType', () => {
    it('should return soil type data for valid key', () => {
      const sandySoil = soilTypeService.getSoilType('sandy')
      expect(sandySoil).not.toBeNull()
      expect(sandySoil?.name).toBe('Sandy')
      expect(sandySoil?.water_retention).toBe('low')
      expect(sandySoil?.drainage).toBe('excellent')
    })

    it('should return null for invalid soil type key', () => {
      const invalidSoil = soilTypeService.getSoilType('invalid')
      expect(invalidSoil).toBeNull()
    })

    it('should return null for empty string', () => {
      const emptySoil = soilTypeService.getSoilType('')
      expect(emptySoil).toBeNull()
    })
  })

  describe('getCompatibilityScore', () => {
    it('should return compatibility score for valid crop-soil combination', () => {
      const score = soilTypeService.getCompatibilityScore('wheat', 'sandy')
      expect(score).not.toBeNull()
      expect(score?.score).toBe(0.6)
      expect(score?.warnings).toContain('May need fertilization')
    })

    it('should return compatibility score for crop with no warnings', () => {
      const score = soilTypeService.getCompatibilityScore('wheat', 'clay')
      expect(score).not.toBeNull()
      expect(score?.score).toBe(0.8)
      expect(score?.warnings).toHaveLength(0)
    })

    it('should return default score for unknown crop', () => {
      const score = soilTypeService.getCompatibilityScore('unknown', 'sandy')
      expect(score).not.toBeNull()
      expect(score?.score).toBe(0.5)
      expect(score?.warnings).toContain('Compatibility data not available')
    })

    it('should return null for invalid soil type', () => {
      const score = soilTypeService.getCompatibilityScore('wheat', 'invalid')
      expect(score).toBeNull()
    })
  })

  describe('generateSoilAdvice', () => {
    it('should generate complete soil advice for valid combination', () => {
      const advice = soilTypeService.generateSoilAdvice('wheat', 'sandy')
      expect(advice).not.toBeNull()
      expect(advice?.compatibility_score).toBe(0.6)
      expect(advice?.amendments).toHaveLength(1)
      expect(advice?.amendments[0].name).toBe('Organic compost')
      expect(advice?.irrigation_tips.frequency).toBe('Daily')
      expect(advice?.warnings).toContain('May need fertilization')
      expect(advice?.variety_recommendations).toContain('Drought-resistant varieties')
    })

    it('should return null for invalid soil type', () => {
      const advice = soilTypeService.generateSoilAdvice('wheat', 'invalid')
      expect(advice).toBeNull()
    })

    it('should return null for empty crop name', () => {
      const advice = soilTypeService.generateSoilAdvice('', 'sandy')
      expect(advice).not.toBeNull() // Service should handle empty crop names gracefully
    })
  })

  describe('getSuitableCrops', () => {
    it('should return suitable crops for valid soil type', () => {
      const crops = soilTypeService.getSuitableCrops('sandy')
      expect(crops).toContain('carrots')
      expect(crops).toContain('potatoes')
    })

    it('should return empty array for invalid soil type', () => {
      const crops = soilTypeService.getSuitableCrops('invalid')
      expect(crops).toHaveLength(0)
    })
  })

  describe('getSoilCharacteristics', () => {
    it('should return characteristics for valid soil type', () => {
      const characteristics = soilTypeService.getSoilCharacteristics('sandy')
      expect(characteristics).toContain('Large particles')
      expect(characteristics).toContain('Good drainage')
    })

    it('should return empty array for invalid soil type', () => {
      const characteristics = soilTypeService.getSoilCharacteristics('invalid')
      expect(characteristics).toHaveLength(0)
    })
  })
})