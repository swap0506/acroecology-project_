/**
 * Performance tests for pest identification system
 * Tests caching, image optimization, and API response times
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { pestIdentificationApiService } from '../../services/pestIdentificationApiService';
import { cacheService, apiCache } from '../../services/cacheService';
import { mobileImageOptimizer } from '../../utils/mobileImageOptimization';
import { PerformanceMonitor, measureAsync } from '../../utils/performance';

// Mock file for testing
const createMockFile = (size: number = 1024 * 1024): File => {
  const buffer = new ArrayBuffer(size);
  return new File([buffer], 'test-image.jpg', { type: 'image/jpeg' });
};

// Mock image for testing
const createMockImage = (width: number = 1920, height: number = 1080): HTMLImageElement => {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: false });
  Object.defineProperty(img, 'height', { value: height, writable: false });
  return img;
};

describe('Pest Identification Performance Tests', () => {
  let performanceMonitor: PerformanceMonitor;

  beforeEach(() => {
    performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.clearMetrics();
    cacheService.clear();
    
    // Set performance thresholds
    performanceMonitor.setThreshold('image_optimization', 2000); // 2 seconds
    performanceMonitor.setThreshold('api_request', 5000); // 5 seconds
    performanceMonitor.setThreshold('cache_lookup', 100); // 100ms
  });

  afterEach(() => {
    performanceMonitor.clearMetrics();
    cacheService.clear();
  });

  describe('Image Optimization Performance', () => {
    it('should optimize images within performance threshold', async () => {
      const mockFile = createMockFile(5 * 1024 * 1024); // 5MB file
      
      const result = await measureAsync('image_optimization', async () => {
        return mobileImageOptimizer.optimizeForMobile(mockFile, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.8
        });
      });

      const stats = performanceMonitor.getStats('image_optimization');
      expect(stats).toBeDefined();
      expect(stats!.latest).toBeLessThan(2000); // Should complete within 2 seconds
      expect(result.compressionRatio).toBeGreaterThan(1); // Should achieve compression
    });

    it('should handle batch optimization efficiently', async () => {
      const files = Array.from({ length: 5 }, () => createMockFile(2 * 1024 * 1024));
      
      const results = await measureAsync('batch_optimization', async () => {
        return mobileImageOptimizer.batchOptimize(files, {
          maxWidth: 1024,
          maxHeight: 1024,
          quality: 0.7
        });
      });

      const stats = performanceMonitor.getStats('batch_optimization');
      expect(stats).toBeDefined();
      expect(results).toHaveLength(5);
      
      // Batch processing should be more efficient than individual processing
      const avgTimePerImage = stats!.latest / files.length;
      expect(avgTimePerImage).toBeLessThan(1000); // Less than 1 second per image in batch
    });

    it('should create thumbnails quickly', async () => {
      const mockFile = createMockFile(3 * 1024 * 1024);
      
      const result = await measureAsync('thumbnail_creation', async () => {
        return mobileImageOptimizer.createThumbnail(mockFile, 150);
      });

      const stats = performanceMonitor.getStats('thumbnail_creation');
      expect(stats).toBeDefined();
      expect(stats!.latest).toBeLessThan(500); // Should complete within 500ms
      expect(result.metadata.width).toBeLessThanOrEqual(150);
      expect(result.metadata.height).toBeLessThanOrEqual(150);
    });
  });

  describe('Caching Performance', () => {
    it('should cache and retrieve data quickly', async () => {
      const testData = { test: 'data', large: new Array(1000).fill('test') };
      const cacheKey = 'performance_test_key';

      // Test cache write performance
      const writeTime = await measureAsync('cache_write', async () => {
        cacheService.set(cacheKey, testData, 60000);
        return Promise.resolve();
      });

      // Test cache read performance
      const readTime = await measureAsync('cache_read', async () => {
        return cacheService.get(cacheKey);
      });

      const writeStats = performanceMonitor.getStats('cache_write');
      const readStats = performanceMonitor.getStats('cache_read');

      expect(writeStats!.latest).toBeLessThan(10); // Write should be very fast
      expect(readStats!.latest).toBeLessThan(5); // Read should be extremely fast
      expect(readTime).toEqual(testData);
    });

    it('should handle cache eviction efficiently', async () => {
      // Fill cache to capacity
      const largeData = new Array(10000).fill('large_data_item');
      
      const fillTime = await measureAsync('cache_fill', async () => {
        for (let i = 0; i < 1100; i++) { // Exceed max entries
          cacheService.set(`key_${i}`, largeData, 60000);
        }
        return Promise.resolve();
      });

      const stats = performanceMonitor.getStats('cache_fill');
      expect(stats).toBeDefined();
      
      // Cache should handle eviction without significant performance degradation
      const avgTimePerEntry = stats!.latest / 1100;
      expect(avgTimePerEntry).toBeLessThan(1); // Less than 1ms per entry on average
    });

    it('should provide fast cache statistics', async () => {
      // Add some test data
      for (let i = 0; i < 100; i++) {
        cacheService.set(`test_${i}`, { data: i }, 60000);
      }

      const statsTime = await measureAsync('cache_stats', async () => {
        return cacheService.getStats();
      });

      const performanceStats = performanceMonitor.getStats('cache_stats');
      expect(performanceStats!.latest).toBeLessThan(10); // Should be very fast
      expect(statsTime.entries).toBe(100);
    });
  });

  describe('API Service Performance', () => {
    beforeEach(() => {
      // Mock fetch for testing
      global.fetch = vi.fn();
    });

    it('should handle API requests within threshold', async () => {
      const mockResponse = {
        matches: [{ name: 'Test Pest', confidence: 0.8 }],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'high',
        api_source: 'test'
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockFile = createMockFile();
      
      const result = await measureAsync('api_request', async () => {
        return pestIdentificationApiService.identifyPestDisease({
          image: mockFile,
          cropType: 'tomato'
        });
      });

      const stats = performanceMonitor.getStats('api_request');
      expect(stats).toBeDefined();
      expect(result).toEqual(mockResponse);
    });

    it('should benefit from caching on repeated requests', async () => {
      const mockResponse = {
        matches: [{ name: 'Cached Pest', confidence: 0.9 }],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'high',
        api_source: 'test'
      };

      // Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const mockFile = createMockFile();

      // First request (should hit API)
      const firstResult = await measureAsync('first_api_request', async () => {
        return pestIdentificationApiService.identifyPestDisease({
          image: mockFile,
          cropType: 'tomato'
        });
      });

      // Second request (should hit cache)
      const secondResult = await measureAsync('cached_api_request', async () => {
        return pestIdentificationApiService.identifyPestDisease({
          image: mockFile,
          cropType: 'tomato'
        });
      });

      const firstStats = performanceMonitor.getStats('first_api_request');
      const cachedStats = performanceMonitor.getStats('cached_api_request');

      expect(firstStats).toBeDefined();
      expect(cachedStats).toBeDefined();
      
      // Cached request should be significantly faster
      expect(cachedStats!.latest).toBeLessThan(firstStats!.latest * 0.1);
      expect(firstResult).toEqual(secondResult);
    });

    it('should handle batch requests efficiently', async () => {
      const mockResponse = {
        matches: [{ name: 'Batch Pest', confidence: 0.7 }],
        treatments: [],
        prevention_tips: [],
        expert_resources: [],
        confidence_level: 'medium',
        api_source: 'test'
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockResponse)
      });

      const requests = Array.from({ length: 5 }, () => ({
        image: createMockFile(),
        cropType: 'corn'
      }));

      const results = await measureAsync('batch_api_requests', async () => {
        return pestIdentificationApiService.batchIdentify(requests);
      });

      const stats = performanceMonitor.getStats('batch_api_requests');
      expect(stats).toBeDefined();
      expect(results).toHaveLength(5);
      
      // Batch processing should be more efficient than sequential
      const avgTimePerRequest = stats!.latest / requests.length;
      expect(avgTimePerRequest).toBeLessThan(2000); // Less than 2 seconds per request in batch
    });
  });

  describe('Memory Performance', () => {
    it('should not cause memory leaks during image processing', async () => {
      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;
      
      // Process multiple images
      const files = Array.from({ length: 10 }, () => createMockFile(1024 * 1024));
      
      for (const file of files) {
        await mobileImageOptimizer.optimizeForMobile(file);
      }

      // Force garbage collection if available
      if ((global as any).gc) {
        (global as any).gc();
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should clean up cache memory efficiently', async () => {
      const initialStats = cacheService.getStats();
      
      // Fill cache with large data
      for (let i = 0; i < 500; i++) {
        const largeData = new Array(1000).fill(`large_data_${i}`);
        cacheService.set(`memory_test_${i}`, largeData, 1000); // Short TTL
      }

      const filledStats = cacheService.getStats();
      expect(filledStats.memoryUsage).toBeGreaterThan(initialStats.memoryUsage);

      // Wait for TTL expiration and cleanup
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      // Trigger cleanup by accessing cache
      cacheService.get('non_existent_key');
      
      const cleanedStats = cacheService.getStats();
      expect(cleanedStats.memoryUsage).toBeLessThan(filledStats.memoryUsage * 0.5);
    });
  });

  describe('Performance Monitoring', () => {
    it('should track performance metrics accurately', async () => {
      const testOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms operation
        return 'test_result';
      };

      // Run operation multiple times
      for (let i = 0; i < 5; i++) {
        await measureAsync('test_operation', testOperation);
      }

      const stats = performanceMonitor.getStats('test_operation');
      expect(stats).toBeDefined();
      expect(stats!.count).toBe(5);
      expect(stats!.average).toBeGreaterThan(90); // Should be around 100ms
      expect(stats!.average).toBeLessThan(150); // With some tolerance
    });

    it('should generate performance alerts for slow operations', async () => {
      const alerts: any[] = [];
      performanceMonitor.onAlert((alert) => {
        alerts.push(alert);
      });

      performanceMonitor.setThreshold('slow_test', 50); // 50ms threshold

      const slowOperation = async () => {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms operation
      };

      await measureAsync('slow_test', slowOperation);

      expect(alerts).toHaveLength(1);
      expect(alerts[0].type).toBe('slow_operation');
      expect(alerts[0].label).toBe('slow_test');
      expect(alerts[0].value).toBeGreaterThan(50);
    });

    it('should provide comprehensive performance reports', async () => {
      // Generate some test metrics
      await measureAsync('operation_a', () => Promise.resolve());
      await measureAsync('operation_b', () => new Promise(resolve => setTimeout(resolve, 200)));
      
      const report = performanceMonitor.generateReport();
      
      expect(report.summary).toBeDefined();
      expect(report.slowOperations).toBeDefined();
      expect(report.recentAlerts).toBeDefined();
      expect(report.recommendations).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });
});

// Integration performance test
describe('End-to-End Performance Integration', () => {
  it('should complete full pest identification flow within acceptable time', async () => {
    const mockFile = createMockFile(2 * 1024 * 1024); // 2MB image
    
    // Mock API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({
        matches: [{ name: 'Integration Test Pest', confidence: 0.85 }],
        treatments: [{ method: 'organic', treatment: 'Test treatment' }],
        prevention_tips: ['Test tip'],
        expert_resources: [],
        confidence_level: 'high',
        api_source: 'integration_test'
      })
    });

    const performanceMonitor = PerformanceMonitor.getInstance();
    performanceMonitor.setThreshold('full_identification_flow', 10000); // 10 seconds

    const result = await measureAsync('full_identification_flow', async () => {
      // Simulate full flow: optimization + API call
      const optimized = await mobileImageOptimizer.optimizeForMobile(mockFile);
      const identification = await pestIdentificationApiService.identifyPestDisease({
        image: optimized.file,
        cropType: 'integration_test'
      });
      return identification;
    });

    const stats = performanceMonitor.getStats('full_identification_flow');
    expect(stats).toBeDefined();
    expect(stats!.latest).toBeLessThan(10000); // Should complete within 10 seconds
    expect(result.matches).toHaveLength(1);
    expect(result.confidence_level).toBe('high');
  });
});