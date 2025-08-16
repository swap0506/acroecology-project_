import { describe, it, expect } from 'vitest'
import { 
  validateSoilType, 
  validateSoilTypesData, 
  getSoilTypeLabel, 
  isValidSoilType,
  SOIL_TYPE_OPTIONS 
} from '../soilTypes'

describe('Soil Types Utilities', () => {
  describe('SOIL_TYPE_OPTIONS', () => {
    it('should contain all expected soil types', () => {
      const expectedTypes = ['sandy', 'clay', 'loamy', 'silty', 'peaty', 'chalky']
      const actualTypes = SOIL_TYPE_OPTIONS.map(option => option.value)
      
      expect(actualTypes).toEqual(expectedTypes)
    })

    it('should have proper labels for each soil type', () => {
      const expectedLabels = ['Sandy', 'Clay', 'Loamy', 'Silty', 'Peaty', 'Chalky']
      const actualLabels = SOIL_TYPE_OPTIONS.map(option => option.label)
      
      expect(actualLabels).toEqual(expectedLabels)
    })
  })

  describe('getSoilTypeLabel', () => {
    it('should return correct label for valid soil type', () => {
      expect(getSoilTypeLabel('sandy')).toBe('Sandy')
      expect(getSoilTypeLabel('clay')).toBe('Clay')
      expect(getSoilTypeLabel('loamy')).toBe('Loamy')
    })

    it('should return the key itself for invalid soil type', () => {
      expect(getSoilTypeLabel('invalid')).toBe('invalid')
      expect(getSoilTypeLabel('unknown')).toBe('unknown')
    })

    it('should handle empty string', () => {
      expect(getSoilTypeLabel('')).toBe('')
    })
  })

  describe('isValidSoilType', () => {
    it('should return true for valid soil types', () => {
      expect(isValidSoilType('sandy')).toBe(true)
      expect(isValidSoilType('clay')).toBe(true)
      expect(isValidSoilType('loamy')).toBe(true)
      expect(isValidSoilType('silty')).toBe(true)
      expect(isValidSoilType('peaty')).toBe(true)
      expect(isValidSoilType('chalky')).toBe(true)
    })

    it('should return false for invalid soil types', () => {
      expect(isValidSoilType('invalid')).toBe(false)
      expect(isValidSoilType('unknown')).toBe(false)
      expect(isValidSoilType('')).toBe(false)
      expect(isValidSoilType('SANDY')).toBe(false) // Case sensitive
    })
  })

  describe('validateSoilType', () => {
    const validSoilType = {
      name: 'Sandy',
      characteristics: ['Large particles', 'Good drainage'],
      water_retention: 'low',
      drainage: 'excellent',
      suitable_crops: ['carrots', 'potatoes'],
      amendments: [
        {
          name: 'Compost',
          purpose: 'Improve retention',
          application_rate: '2 inches',
          timing: 'Spring'
        }
      ],
      irrigation_guidance: {
        frequency: 'Daily',
        duration: '15 minutes',
        method: 'Drip',
        special_notes: 'Water frequently'
      }
    }

    it('should return true for valid soil type object', () => {
      expect(validateSoilType(validSoilType)).toBe(true)
    })

    it('should return false for missing required properties', () => {
      const invalidSoilType = { ...validSoilType }
      delete (invalidSoilType as any).name
      
      expect(validateSoilType(invalidSoilType)).toBe(false)
    })

    it('should return false for wrong property types', () => {
      const invalidSoilType = {
        ...validSoilType,
        characteristics: 'not an array' // Should be array
      }
      
      expect(validateSoilType(invalidSoilType)).toBe(false)
    })

    it('should return false for null or undefined', () => {
      expect(validateSoilType(null)).toBe(false)
      expect(validateSoilType(undefined)).toBe(false)
    })

    it('should return false for non-object types', () => {
      expect(validateSoilType('string')).toBe(false)
      expect(validateSoilType(123)).toBe(false)
      expect(validateSoilType([])).toBe(false)
    })
  })

  describe('validateSoilTypesData', () => {
    const validSoilTypesData = {
      soil_types: {
        sandy: {
          name: 'Sandy',
          characteristics: ['Large particles'],
          water_retention: 'low',
          drainage: 'excellent',
          suitable_crops: ['carrots'],
          amendments: [],
          irrigation_guidance: {
            frequency: 'Daily',
            duration: '15 minutes',
            method: 'Drip',
            special_notes: 'Notes'
          }
        }
      },
      compatibility_matrix: {
        wheat: {
          sandy: { score: 0.6, warnings: [] }
        }
      }
    }

    it('should return true for valid soil types data', () => {
      expect(validateSoilTypesData(validSoilTypesData)).toBe(true)
    })

    it('should return false for missing soil_types property', () => {
      const invalidData = { ...validSoilTypesData }
      delete (invalidData as any).soil_types
      
      expect(validateSoilTypesData(invalidData)).toBe(false)
    })

    it('should return false for missing compatibility_matrix property', () => {
      const invalidData = { ...validSoilTypesData }
      delete (invalidData as any).compatibility_matrix
      
      expect(validateSoilTypesData(invalidData)).toBe(false)
    })

    it('should return false for invalid soil type within soil_types', () => {
      const invalidData = {
        ...validSoilTypesData,
        soil_types: {
          sandy: {
            name: 'Sandy'
            // Missing required properties
          }
        }
      }
      
      expect(validateSoilTypesData(invalidData)).toBe(false)
    })

    it('should return false for null or undefined', () => {
      expect(validateSoilTypesData(null)).toBe(false)
      expect(validateSoilTypesData(undefined)).toBe(false)
    })
  })
})