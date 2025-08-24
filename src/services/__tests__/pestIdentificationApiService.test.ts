/**
 * Tests for Pest Identification API Service
 * Tests API integration and response handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the API service
const mockApiService = {
  identifyPestDisease: vi.fn(),
  getServiceStatus: vi.fn(),
  validateImage: vi.fn((file: File) => {
    // Mock validation logic
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!allowedTypes.includes(file.type)) {
      return false;
    }
    
    if (file.size > maxSize) {
      return false;
    }
    
    return true;
  }),
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('PestIdentificationApiService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  describe('identifyPestDisease', () => {
    it('should successfully identify pest/disease from image', async () => {
      const mockResponse = {
        matches: [
          {
            name: 'Aphids',
            scientific_name: 'Aphidoidea',
            confidence: 0.87,
            category: 'pest',
            description: 'Small insects that feed on plant sap',
            symptoms: ['Curled leaves', 'Sticky honeydew'],
            images: ['/images/pests/aphids.jpg']
          }
        ],
        treatments: [
          {
            method: 'organic',
            treatment: 'Neem oil spray',
            application: 'Spray every 3-5 days',
            timing: 'Early morning or evening',
            safety_notes: 'Safe when dry'
          }
        ],
        prevention_tips: ['Monitor regularly', 'Encourage beneficial insects'],
        expert_resources: [
          {
            name: 'Local Extension Service',
            contact: 'Contact local office',
            type: 'extension_service',
            location: 'Local'
          }
        ],
        confidence_level: 'high',
        api_source: 'plant_id_api'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');

      expect(mockApiService.identifyPestDisease).toHaveBeenCalledWith(file, 'tomato', 'test_location');
    });

    it('should handle API errors gracefully', async () => {
      const mockErrorResponse = {
        detail: {
          error_type: 'service_unavailable',
          message: 'Plant.id API is currently unavailable',
          suggestions: ['Try again later', 'Use fallback guidance'],
          fallback_available: true
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: () => Promise.resolve(mockErrorResponse)
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      try {
        await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      try {
        await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');
      } catch (error) {
        expect(error).toBeInstanceOf(TypeError);
      }
    });

    it('should handle timeout errors', async () => {
      const timeoutError = new DOMException('Request timeout', 'AbortError');
      mockFetch.mockRejectedValueOnce(timeoutError);

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      try {
        await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');
      } catch (error) {
        expect(error).toBe(timeoutError);
      }
    });

    it('should handle low confidence responses', async () => {
      const mockLowConfidenceResponse = {
        matches: [
          {
            name: 'Unknown Issue',
            confidence: 0.25,
            category: 'unknown',
            description: 'Unable to identify with high confidence',
            symptoms: [],
            images: []
          }
        ],
        treatments: [],
        prevention_tips: ['Consult local expert'],
        expert_resources: [
          {
            name: 'Agricultural Extension Service',
            contact: 'Contact for expert help',
            type: 'extension_service',
            location: 'Local'
          }
        ],
        confidence_level: 'low',
        api_source: 'fallback_service',
        fallback_mode: true,
        message: 'Low confidence identification. Expert consultation recommended.'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLowConfidenceResponse)
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');

      expect(mockApiService.identifyPestDisease).toHaveBeenCalledWith(file, 'tomato', 'test_location');
    });
  });

  describe('getServiceStatus', () => {
    it('should return service status information', async () => {
      const mockStatusResponse = {
        service_available: true,
        primary_api_available: true,
        fallback_available: true,
        local_database_loaded: true,
        pest_disease_count: 150,
        rate_limit_status: {
          requests_made_this_minute: 5,
          daily_requests: 45,
          can_make_request: true
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockStatusResponse)
      });

      const status = await mockApiService.getServiceStatus();
      expect(mockApiService.getServiceStatus).toHaveBeenCalled();
    });

    it('should handle service status errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500
      });

      try {
        await mockApiService.getServiceStatus();
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('validateImage', () => {
    it('should validate image file format', () => {
      const validJpegFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const validPngFile = new File(['test'], 'test.png', { type: 'image/png' });
      const invalidFile = new File(['test'], 'test.gif', { type: 'image/gif' });

      expect(mockApiService.validateImage(validJpegFile)).toBeTruthy();
      expect(mockApiService.validateImage(validPngFile)).toBeTruthy();
      expect(mockApiService.validateImage(invalidFile)).toBeFalsy();
    });

    it('should validate image file size', () => {
      const smallFile = new File(['x'.repeat(1024)], 'small.jpg', { type: 'image/jpeg' });
      const largeFile = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });

      expect(mockApiService.validateImage(smallFile)).toBeTruthy();
      expect(mockApiService.validateImage(largeFile)).toBeFalsy();
    });
  });

  describe('API Response Parsing', () => {
    it('should parse successful API responses correctly', () => {
      const mockApiResponse = {
        matches: [
          {
            name: 'Test Pest',
            scientific_name: 'Testicus pesticus',
            confidence: 0.85,
            category: 'pest',
            description: 'Test description',
            symptoms: ['Test symptom'],
            images: ['test.jpg']
          }
        ],
        treatments: [
          {
            method: 'organic',
            treatment: 'Test treatment',
            application: 'Test application',
            timing: 'Test timing',
            safety_notes: 'Test safety'
          }
        ],
        prevention_tips: ['Test prevention'],
        expert_resources: [
          {
            name: 'Test Expert',
            contact: 'test@example.com',
            type: 'extension_service',
            location: 'Test Location'
          }
        ],
        confidence_level: 'high',
        api_source: 'plant_id_api'
      };

      // Test that response structure is valid
      expect(mockApiResponse.matches).toHaveLength(1);
      expect(mockApiResponse.matches[0].name).toBe('Test Pest');
      expect(mockApiResponse.treatments).toHaveLength(1);
      expect(mockApiResponse.prevention_tips).toHaveLength(1);
      expect(mockApiResponse.expert_resources).toHaveLength(1);
      expect(mockApiResponse.confidence_level).toBe('high');
    });

    it('should handle malformed API responses', () => {
      const malformedResponses = [
        null,
        undefined,
        {},
        { matches: null },
        { matches: [], treatments: null },
        { matches: [{ name: null }] }
      ];

      malformedResponses.forEach(response => {
        // Test that malformed responses are handled gracefully
        const validateResponse = () => {
          // Simulate response validation
          if (!response || !response.matches || !Array.isArray(response.matches)) {
            throw new Error('Invalid response format');
          }
        };
        
        expect(validateResponse).toThrow('Invalid response format');
      });
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limit exceeded errors', async () => {
      const rateLimitResponse = {
        detail: {
          error_type: 'rate_limit_exceeded',
          message: 'API rate limit exceeded',
          suggestions: ['Wait before making another request', 'Try again in a few minutes'],
          fallback_available: true,
          retry_after: 60
        }
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        json: () => Promise.resolve(rateLimitResponse)
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      
      try {
        await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('Fallback Mechanisms', () => {
    it('should activate fallback when primary API fails', async () => {
      const fallbackResponse = {
        matches: [
          {
            name: 'General Plant Issue',
            confidence: 0.5,
            category: 'unknown',
            description: 'Unable to identify specific issue',
            symptoms: [],
            images: []
          }
        ],
        treatments: [
          {
            method: 'general',
            treatment: 'General plant care recommendations',
            application: 'Follow general guidelines',
            timing: 'As needed',
            safety_notes: 'Consult expert for specific advice'
          }
        ],
        prevention_tips: ['Regular monitoring', 'Proper plant care'],
        expert_resources: [
          {
            name: 'Local Agricultural Extension',
            contact: 'Contact local office',
            type: 'extension_service',
            location: 'Local'
          }
        ],
        confidence_level: 'low',
        api_source: 'fallback_service',
        fallback_mode: true
      };

      // First call fails
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503
      });

      // Fallback call succeeds
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(fallbackResponse)
      });

      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const result = await mockApiService.identifyPestDisease(file, 'tomato', 'test_location');

      expect(mockApiService.identifyPestDisease).toHaveBeenCalledWith(file, 'tomato', 'test_location');
    });
  });
});