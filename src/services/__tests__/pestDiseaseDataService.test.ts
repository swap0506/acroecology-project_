import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PestDiseaseDataService } from '../pestDiseaseDataService';
import { PestDiseaseValidationError } from '../../types/pestDisease';

// Mock fetch
global.fetch = vi.fn();

describe('PestDiseaseDataService', () => {
  let service: PestDiseaseDataService;

  beforeEach(() => {
    service = PestDiseaseDataService.getInstance();
    // Reset the service state
    (service as any).database = null;
    (service as any).loadingPromise = null;
    vi.clearAllMocks();
  });

  const mockValidData = {
    pests_diseases: {
      test_pest: {
        name: 'Test Pest',
        scientific_name: 'Testicus pesticus',
        category: 'pest',
        description: 'A test pest for unit testing',
        symptoms: ['Test symptom 1', 'Test symptom 2'],
        images: ['/images/pests/test_pest.jpg'],
        treatments: [
          {
            method: 'organic',
            treatment: 'Test treatment',
            application: 'Test application',
            timing: 'Test timing',
            safety_notes: 'Test safety notes'
          }
        ],
        prevention: ['Test prevention'],
        affected_crops: ['test_crop']
      }
    }
  };

  describe('loadData', () => {
    it('should load and validate data successfully', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidData)
      });

      const result = await service.loadData();
      
      expect(result).toEqual(mockValidData);
      expect(fetch).toHaveBeenCalledWith('/src/data/pestsAndDiseases.json');
    });

    it('should throw error when fetch fails', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      await expect(service.loadData()).rejects.toThrow('Failed to load pest and disease database');
    });

    it('should throw error when data is invalid', async () => {
      const invalidData = {
        pests_diseases: {
          invalid_entry: {
            name: 'Invalid Entry',
            // Missing required fields
          }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(invalidData)
      });

      await expect(service.loadData()).rejects.toThrow('Invalid pest and disease data format');
    });

    it('should return cached data on subsequent calls', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidData)
      });

      const result1 = await service.loadData();
      const result2 = await service.loadData();
      
      expect(result1).toBe(result2);
      expect(fetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllEntries', () => {
    it('should return all pest and disease entries', async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidData)
      });

      const entries = await service.getAllEntries();
      
      expect(entries).toEqual(mockValidData.pests_diseases);
    });
  });

  describe('getEntry', () => {
    beforeEach(async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidData)
      });
      await service.loadData();
    });

    it('should return specific entry when it exists', async () => {
      const entry = await service.getEntry('test_pest');
      
      expect(entry).toEqual(mockValidData.pests_diseases.test_pest);
    });

    it('should return null when entry does not exist', async () => {
      const entry = await service.getEntry('nonexistent_pest');
      
      expect(entry).toBeNull();
    });
  });

  describe('getEntriesByCategory', () => {
    beforeEach(async () => {
      const dataWithMultipleCategories = {
        pests_diseases: {
          test_pest: { ...mockValidData.pests_diseases.test_pest, category: 'pest' },
          test_disease: { ...mockValidData.pests_diseases.test_pest, category: 'disease', name: 'Test Disease' },
          test_deficiency: { ...mockValidData.pests_diseases.test_pest, category: 'deficiency', name: 'Test Deficiency' }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithMultipleCategories)
      });
      await service.loadData();
    });

    it('should return only pest entries', async () => {
      const pests = await service.getEntriesByCategory('pest');
      
      expect(Object.keys(pests)).toEqual(['test_pest']);
      expect(pests.test_pest.category).toBe('pest');
    });

    it('should return only disease entries', async () => {
      const diseases = await service.getEntriesByCategory('disease');
      
      expect(Object.keys(diseases)).toEqual(['test_disease']);
      expect(diseases.test_disease.category).toBe('disease');
    });
  });

  describe('getEntriesByCrop', () => {
    beforeEach(async () => {
      const dataWithDifferentCrops = {
        pests_diseases: {
          tomato_pest: { ...mockValidData.pests_diseases.test_pest, affected_crops: ['tomatoes', 'peppers'] },
          corn_pest: { ...mockValidData.pests_diseases.test_pest, affected_crops: ['corn', 'wheat'] }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(dataWithDifferentCrops)
      });
      await service.loadData();
    });

    it('should return entries affecting specific crop', async () => {
      const tomatoPests = await service.getEntriesByCrop('tomatoes');
      
      expect(Object.keys(tomatoPests)).toEqual(['tomato_pest']);
    });

    it('should handle case insensitive crop search', async () => {
      const tomatoPests = await service.getEntriesByCrop('TOMATOES');
      
      expect(Object.keys(tomatoPests)).toEqual(['tomato_pest']);
    });
  });

  describe('searchBySymptoms', () => {
    beforeEach(async () => {
      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockValidData)
      });
      await service.loadData();
    });

    it('should find entries by symptom keywords', async () => {
      const results = await service.searchBySymptoms(['Test symptom']);
      
      expect(Object.keys(results)).toEqual(['test_pest']);
    });

    it('should handle case insensitive search', async () => {
      const results = await service.searchBySymptoms(['TEST SYMPTOM']);
      
      expect(Object.keys(results)).toEqual(['test_pest']);
    });
  });

  describe('getDatabaseStats', () => {
    beforeEach(async () => {
      const statsData = {
        pests_diseases: {
          pest1: { ...mockValidData.pests_diseases.test_pest, category: 'pest', images: ['img1.jpg', 'img2.jpg'] },
          disease1: { ...mockValidData.pests_diseases.test_pest, category: 'disease', images: ['img3.jpg'] },
          deficiency1: { ...mockValidData.pests_diseases.test_pest, category: 'deficiency', images: ['img4.jpg'] }
        }
      };

      (fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(statsData)
      });
      await service.loadData();
    });

    it('should return correct database statistics', async () => {
      const stats = await service.getDatabaseStats();
      
      expect(stats).toEqual({
        totalEntries: 3,
        pestCount: 1,
        diseaseCount: 1,
        deficiencyCount: 1,
        totalCrops: 1,
        totalImages: 4
      });
    });
  });
});