/**
 * Tests for Pest Disease Validation Utilities
 * Tests validation logic for pest/disease data and API responses
 */

import { describe, it, expect } from 'vitest';

// Mock validation functions
const validatePestDiseaseData = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!data) {
    errors.push('Data is null or undefined');
    return { valid: false, errors };
  }

  if (!data.pests_diseases || typeof data.pests_diseases !== 'object') {
    errors.push('Missing or invalid pests_diseases object');
    return { valid: false, errors };
  }

  // Validate each entry
  for (const [key, entry] of Object.entries(data.pests_diseases)) {
    if (!entry || typeof entry !== 'object') {
      errors.push(`Entry ${key} is not a valid object`);
      continue;
    }

    const pestEntry = entry as any;

    // Required fields
    if (!pestEntry.name || typeof pestEntry.name !== 'string') {
      errors.push(`Entry ${key} missing or invalid name`);
    }

    if (!pestEntry.category || !['pest', 'disease', 'deficiency'].includes(pestEntry.category)) {
      errors.push(`Entry ${key} missing or invalid category`);
    }

    if (!pestEntry.description || typeof pestEntry.description !== 'string') {
      errors.push(`Entry ${key} missing or invalid description`);
    }

    if (!Array.isArray(pestEntry.symptoms)) {
      errors.push(`Entry ${key} missing or invalid symptoms array`);
    }

    if (!Array.isArray(pestEntry.treatments)) {
      errors.push(`Entry ${key} missing or invalid treatments array`);
    }

    if (!Array.isArray(pestEntry.prevention)) {
      errors.push(`Entry ${key} missing or invalid prevention array`);
    }

    // Validate treatments
    if (Array.isArray(pestEntry.treatments)) {
      pestEntry.treatments.forEach((treatment: any, index: number) => {
        if (!treatment.method || !treatment.treatment) {
          errors.push(`Entry ${key} treatment ${index} missing required fields`);
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
};

const validateApiResponse = (response: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!response) {
    errors.push('Response is null or undefined');
    return { valid: false, errors };
  }

  // Required fields
  if (!Array.isArray(response.matches)) {
    errors.push('Missing or invalid matches array');
  }

  if (!Array.isArray(response.treatments)) {
    errors.push('Missing or invalid treatments array');
  }

  if (!Array.isArray(response.prevention_tips)) {
    errors.push('Missing or invalid prevention_tips array');
  }

  if (!Array.isArray(response.expert_resources)) {
    errors.push('Missing or invalid expert_resources array');
  }

  if (!response.confidence_level || !['high', 'medium', 'low'].includes(response.confidence_level)) {
    errors.push('Missing or invalid confidence_level');
  }

  if (!response.api_source || typeof response.api_source !== 'string') {
    errors.push('Missing or invalid api_source');
  }

  // Validate matches
  if (Array.isArray(response.matches)) {
    response.matches.forEach((match: any, index: number) => {
      if (!match.name || typeof match.name !== 'string') {
        errors.push(`Match ${index} missing or invalid name`);
      }

      if (typeof match.confidence !== 'number' || match.confidence < 0 || match.confidence > 1) {
        errors.push(`Match ${index} missing or invalid confidence score`);
      }

      if (!match.category || !['pest', 'disease', 'deficiency', 'unknown'].includes(match.category)) {
        errors.push(`Match ${index} missing or invalid category`);
      }
    });
  }

  // Validate treatments
  if (Array.isArray(response.treatments)) {
    response.treatments.forEach((treatment: any, index: number) => {
      if (!treatment.method || !treatment.treatment) {
        errors.push(`Treatment ${index} missing required fields`);
      }
    });
  }

  return { valid: errors.length === 0, errors };
};

const validateImageFile = (file: File): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!file) {
    errors.push('No file provided');
    return { valid: false, errors };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Allowed types: ${allowedTypes.join(', ')}`);
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024;
  if (file.size > maxSize) {
    errors.push(`File too large: ${file.size} bytes. Maximum size: ${maxSize} bytes`);
  }

  // Check file name
  if (!file.name || file.name.trim() === '') {
    errors.push('File name is empty');
  }

  return { valid: errors.length === 0, errors };
};

describe('Pest Disease Validation', () => {
  describe('validatePestDiseaseData', () => {
    it('should validate correct pest/disease data structure', () => {
      const validData = {
        pests_diseases: {
          aphids: {
            name: 'Aphids',
            scientific_name: 'Aphidoidea',
            category: 'pest',
            description: 'Small insects that feed on plant sap',
            symptoms: ['Curled leaves', 'Sticky honeydew'],
            images: ['/images/pests/aphids.jpg'],
            treatments: [
              {
                method: 'organic',
                treatment: 'Neem oil spray',
                application: 'Spray every 3-5 days',
                timing: 'Early morning',
                safety_notes: 'Safe when dry'
              }
            ],
            prevention: ['Monitor regularly', 'Encourage beneficial insects'],
            affected_crops: ['tomatoes', 'peppers']
          }
        }
      };

      const result = validatePestDiseaseData(validData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject data with missing required fields', () => {
      const invalidData = {
        pests_diseases: {
          invalid_entry: {
            name: 'Test Entry',
            // Missing category, description, symptoms, treatments, prevention
          }
        }
      };

      const result = validatePestDiseaseData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('missing or invalid category'))).toBe(true);
    });

    it('should reject data with invalid category values', () => {
      const invalidData = {
        pests_diseases: {
          invalid_category: {
            name: 'Test Entry',
            category: 'invalid_category',
            description: 'Test description',
            symptoms: [],
            treatments: [],
            prevention: []
          }
        }
      };

      const result = validatePestDiseaseData(invalidData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('missing or invalid category'))).toBe(true);
    });

    it('should reject null or undefined data', () => {
      const result1 = validatePestDiseaseData(null);
      const result2 = validatePestDiseaseData(undefined);

      expect(result1.valid).toBe(false);
      expect(result2.valid).toBe(false);
      expect(result1.errors[0]).toBe('Data is null or undefined');
      expect(result2.errors[0]).toBe('Data is null or undefined');
    });

    it('should validate treatment structure', () => {
      const dataWithInvalidTreatments = {
        pests_diseases: {
          test_entry: {
            name: 'Test Entry',
            category: 'pest',
            description: 'Test description',
            symptoms: ['Test symptom'],
            treatments: [
              {
                // Missing method and treatment
                application: 'Test application'
              }
            ],
            prevention: ['Test prevention']
          }
        }
      };

      const result = validatePestDiseaseData(dataWithInvalidTreatments);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('treatment 0 missing required fields'))).toBe(true);
    });
  });

  describe('validateApiResponse', () => {
    it('should validate correct API response structure', () => {
      const validResponse = {
        matches: [
          {
            name: 'Aphids',
            scientific_name: 'Aphidoidea',
            confidence: 0.87,
            category: 'pest',
            description: 'Small insects',
            symptoms: ['Curled leaves'],
            images: ['aphids.jpg']
          }
        ],
        treatments: [
          {
            method: 'organic',
            treatment: 'Neem oil spray',
            application: 'Spray every 3-5 days',
            timing: 'Early morning',
            safety_notes: 'Safe when dry'
          }
        ],
        prevention_tips: ['Monitor regularly'],
        expert_resources: [
          {
            name: 'Extension Service',
            contact: 'contact@extension.gov',
            type: 'extension_service',
            location: 'Local'
          }
        ],
        confidence_level: 'high',
        api_source: 'plant_id_api'
      };

      const result = validateApiResponse(validResponse);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject response with missing required arrays', () => {
      const invalidResponse = {
        confidence_level: 'high',
        api_source: 'test_api'
        // Missing matches, treatments, prevention_tips, expert_resources
      };

      const result = validateApiResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(error => error.includes('Missing or invalid matches array'))).toBe(true);
    });

    it('should reject response with invalid confidence level', () => {
      const invalidResponse = {
        matches: [],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'invalid_level',
        api_source: 'test_api'
      };

      const result = validateApiResponse(invalidResponse);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Missing or invalid confidence_level'))).toBe(true);
    });

    it('should validate match structure', () => {
      const responseWithInvalidMatches = {
        matches: [
          {
            // Missing name
            confidence: 'invalid_confidence', // Should be number
            category: 'invalid_category'
          }
        ],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'high',
        api_source: 'test_api'
      };

      const result = validateApiResponse(responseWithInvalidMatches);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Match 0 missing or invalid name'))).toBe(true);
      expect(result.errors.some(error => error.includes('Match 0 missing or invalid confidence score'))).toBe(true);
    });

    it('should validate confidence score range', () => {
      const responseWithInvalidConfidence = {
        matches: [
          {
            name: 'Test Match',
            confidence: 1.5, // Invalid - should be 0-1
            category: 'pest'
          }
        ],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'high',
        api_source: 'test_api'
      };

      const result = validateApiResponse(responseWithInvalidConfidence);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Match 0 missing or invalid confidence score'))).toBe(true);
    });
  });

  describe('validateImageFile', () => {
    it('should validate correct image files', () => {
      const validJpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const validPngFile = new File(['test'], 'test.png', { type: 'image/png' });

      const result1 = validateImageFile(validJpegFile);
      const result2 = validateImageFile(validPngFile);

      expect(result1.valid).toBe(true);
      expect(result2.valid).toBe(true);
      expect(result1.errors).toHaveLength(0);
      expect(result2.errors).toHaveLength(0);
    });

    it('should reject invalid file types', () => {
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });

      const result = validateImageFile(invalidFile);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('Invalid file type'))).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeContent = 'x'.repeat(6 * 1024 * 1024); // 6MB
      const largeFile = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });

      const result = validateImageFile(largeFile);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('File too large'))).toBe(true);
    });

    it('should reject null or undefined files', () => {
      const result = validateImageFile(null as any);
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toBe('No file provided');
    });

    it('should reject files with empty names', () => {
      const fileWithEmptyName = new File(['test'], '', { type: 'image/jpeg' });

      const result = validateImageFile(fileWithEmptyName);
      expect(result.valid).toBe(false);
      expect(result.errors.some(error => error.includes('File name is empty'))).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty pest/disease database', () => {
      const emptyData = {
        pests_diseases: {}
      };

      const result = validatePestDiseaseData(emptyData);
      expect(result.valid).toBe(true); // Empty database is valid
      expect(result.errors).toHaveLength(0);
    });

    it('should handle API response with empty arrays', () => {
      const emptyResponse = {
        matches: [],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'low',
        api_source: 'fallback_service'
      };

      const result = validateApiResponse(emptyResponse);
      expect(result.valid).toBe(true); // Empty arrays are valid
      expect(result.errors).toHaveLength(0);
    });

    it('should handle very small valid image files', () => {
      const tinyFile = new File(['x'], 'tiny.jpg', { type: 'image/jpeg' });

      const result = validateImageFile(tinyFile);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});