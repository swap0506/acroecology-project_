import { describe, it, expect } from 'vitest';
import { validateAndThrow } from '../../types/pestDisease';
import pestsAndDiseasesData from '../pestsAndDiseases.json';

describe('pestsAndDiseases.json', () => {
  it('should have valid data structure', () => {
    expect(() => validateAndThrow(pestsAndDiseasesData)).not.toThrow();
  });

  it('should contain expected entries', () => {
    const data = validateAndThrow(pestsAndDiseasesData);
    
    expect(data.pests_diseases).toBeDefined();
    expect(Object.keys(data.pests_diseases).length).toBeGreaterThan(0);
    
    // Check for some expected entries
    expect(data.pests_diseases.aphids).toBeDefined();
    expect(data.pests_diseases.spider_mites).toBeDefined();
    expect(data.pests_diseases.powdery_mildew).toBeDefined();
  });

  it('should have entries with all required fields', () => {
    const data = validateAndThrow(pestsAndDiseasesData);
    
    for (const [key, entry] of Object.entries(data.pests_diseases)) {
      expect(entry.name, `${key} should have name`).toBeDefined();
      expect(entry.scientific_name, `${key} should have scientific_name`).toBeDefined();
      expect(entry.category, `${key} should have category`).toBeDefined();
      expect(entry.description, `${key} should have description`).toBeDefined();
      expect(entry.symptoms, `${key} should have symptoms array`).toBeInstanceOf(Array);
      expect(entry.images, `${key} should have images array`).toBeInstanceOf(Array);
      expect(entry.treatments, `${key} should have treatments array`).toBeInstanceOf(Array);
      expect(entry.prevention, `${key} should have prevention array`).toBeInstanceOf(Array);
      expect(entry.affected_crops, `${key} should have affected_crops array`).toBeInstanceOf(Array);
      
      // Validate treatments structure
      entry.treatments.forEach((treatment, index) => {
        expect(treatment.method, `${key} treatment ${index} should have method`).toBeDefined();
        expect(treatment.treatment, `${key} treatment ${index} should have treatment`).toBeDefined();
        expect(treatment.application, `${key} treatment ${index} should have application`).toBeDefined();
        expect(treatment.timing, `${key} treatment ${index} should have timing`).toBeDefined();
        expect(treatment.safety_notes, `${key} treatment ${index} should have safety_notes`).toBeDefined();
      });
    }
  });

  it('should have valid categories', () => {
    const data = validateAndThrow(pestsAndDiseasesData);
    const validCategories = ['pest', 'disease', 'deficiency'];
    
    for (const [key, entry] of Object.entries(data.pests_diseases)) {
      expect(validCategories, `${key} should have valid category`).toContain(entry.category);
    }
  });

  it('should have valid treatment methods', () => {
    const data = validateAndThrow(pestsAndDiseasesData);
    const validMethods = ['organic', 'chemical', 'cultural'];
    
    for (const [key, entry] of Object.entries(data.pests_diseases)) {
      entry.treatments.forEach((treatment, index) => {
        expect(validMethods, `${key} treatment ${index} should have valid method`).toContain(treatment.method);
      });
    }
  });
});