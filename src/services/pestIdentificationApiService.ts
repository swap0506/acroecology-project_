/**
 * Enhanced Pest Identification API Service with caching and performance optimization
 */

import { apiCache, cacheService } from './cacheService';
import { measureAsync } from '../utils/performance';
import { mobileImageOptimizer } from '../utils/mobileImageOptimization';

interface IdentificationRequest {
  image: File;
  cropType?: string;
  location?: string;
  additionalInfo?: string;
}

interface IdentificationResponse {
  matches: Array<{
    name: string;
    scientific_name?: string;
    confidence: number;
    category: string;
    description: string;
    symptoms: string[];
    images: string[];
  }>;
  treatments: Array<{
    method: string;
    treatment: string;
    application: string;
    timing: string;
    safety_notes: string;
  }>;
  prevention_tips: string[];
  expert_resources: Array<{
    name: string;
    contact: string;
    type: string;
    location?: string;
  }>;
  confidence_level: 'high' | 'medium' | 'low';
  api_source: string;
  fallback_mode?: boolean;
  message?: string;
}

interface ApiError {
  message: string;
  type: string;
  status_code?: number;
  retry_after?: number;
}

export class PestIdentificationApiService {
  private static instance: PestIdentificationApiService;
  private baseUrl = '/api';
  private requestQueue: Array<() => Promise<any>> = [];
  private isProcessingQueue = false;
  private rateLimitDelay = 0;
  private lastRequestTime = 0;

  private constructor() {}

  public static getInstance(): PestIdentificationApiService {
    if (!PestIdentificationApiService.instance) {
      PestIdentificationApiService.instance = new PestIdentificationApiService();
    }
    return PestIdentificationApiService.instance;
  }

  /**
   * Identify pest/disease with caching and optimization
   */
  async identifyPestDisease(request: IdentificationRequest): Promise<IdentificationResponse> {
    return measureAsync('pest_identification_api', async () => {
      // Generate image hash for caching
      const imageHash = await this.generateImageHash(request.image);
      const cropType = request.cropType || 'general';

      // Check cache first
      const cachedResult = await apiCache.getIdentificationResult(imageHash, cropType);
      if (cachedResult) {
        console.log('Using cached identification result');
        return cachedResult;
      }

      // Optimize image before sending
      const optimizedImage = await this.optimizeImageForApi(request.image);

      // Make API request with rate limiting
      const result = await this.makeApiRequest({
        ...request,
        image: optimizedImage
      });

      // Cache successful results
      if (result && !result.fallback_mode) {
        await apiCache.cacheIdentificationResult(imageHash, cropType, result);
      }

      return result;
    });
  }

  /**
   * Batch identify multiple images with optimization
   */
  async batchIdentify(requests: IdentificationRequest[]): Promise<IdentificationResponse[]> {
    return measureAsync('batch_pest_identification', async () => {
      // Process requests in parallel with concurrency limit
      const concurrencyLimit = 3;
      const results: IdentificationResponse[] = [];
      
      for (let i = 0; i < requests.length; i += concurrencyLimit) {
        const batch = requests.slice(i, i + concurrencyLimit);
        const batchPromises = batch.map(request => this.identifyPestDisease(request));
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            results.push(result.value);
          } else {
            console.error(`Batch request ${i + index} failed:`, result.reason);
            // Add error result
            results.push({
              matches: [],
              treatments: [],
              prevention_tips: [],
              expert_resources: [],
              confidence_level: 'low',
              api_source: 'error',
              fallback_mode: true,
              message: 'Failed to process image'
            });
          }
        });
      }
      
      return results;
    });
  }

  /**
   * Get service health status
   */
  async getServiceStatus(): Promise<{
    available: boolean;
    response_time: number;
    cache_stats: any;
    rate_limit_status: any;
  }> {
    return measureAsync('service_status_check', async () => {
      try {
        const startTime = Date.now();
        const response = await fetch(`${this.baseUrl}/health`, {
          method: 'GET',
          timeout: 5000
        });
        const responseTime = Date.now() - startTime;

        const available = response.ok;
        const cacheStats = cacheService.getStats();
        
        return {
          available,
          response_time: responseTime,
          cache_stats: cacheStats,
          rate_limit_status: {
            delay: this.rateLimitDelay,
            last_request: this.lastRequestTime
          }
        };
      } catch (error) {
        return {
          available: false,
          response_time: -1,
          cache_stats: cacheService.getStats(),
          rate_limit_status: {
            delay: this.rateLimitDelay,
            last_request: this.lastRequestTime
          }
        };
      }
    });
  }

  /**
   * Preload common pest/disease data
   */
  async preloadCommonData(): Promise<void> {
    return measureAsync('preload_common_data', async () => {
      const preloadFunctions = [
        {
          key: 'common_pests',
          loader: () => this.fetchCommonPests(),
          ttl: 86400000 // 24 hours
        },
        {
          key: 'common_diseases',
          loader: () => this.fetchCommonDiseases(),
          ttl: 86400000 // 24 hours
        },
        {
          key: 'treatment_database',
          loader: () => this.fetchTreatmentDatabase(),
          ttl: 86400000 // 24 hours
        }
      ];

      await cacheService.preloadData(preloadFunctions);
    });
  }

  /**
   * Clear identification cache
   */
  clearCache(): number {
    return apiCache.invalidateIdentificationCache();
  }

  private async generateImageHash(file: File): Promise<string> {
    return measureAsync('image_hash_generation', async () => {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    });
  }

  private async optimizeImageForApi(file: File): Promise<File> {
    return measureAsync('image_optimization_for_api', async () => {
      try {
        const result = await mobileImageOptimizer.optimizeForMobile(file, {
          maxWidth: 2048,
          maxHeight: 2048,
          quality: 0.85,
          format: 'jpeg'
        });
        
        console.log(`Image optimized: ${file.size} -> ${result.file.size} bytes (${result.compressionRatio.toFixed(2)}x compression)`);
        return result.file;
      } catch (error) {
        console.warn('Image optimization failed, using original:', error);
        return file;
      }
    });
  }

  private async makeApiRequest(request: IdentificationRequest): Promise<IdentificationResponse> {
    // Implement rate limiting
    await this.enforceRateLimit();

    const formData = new FormData();
    formData.append('image', request.image);
    formData.append('crop_type', request.cropType || 'general');
    formData.append('location', request.location || '');
    formData.append('additional_info', request.additionalInfo || '');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(`${this.baseUrl}/identify`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          'X-Request-ID': this.generateRequestId(),
          'X-Client-Version': '1.0.0'
        }
      });

      clearTimeout(timeoutId);
      this.lastRequestTime = Date.now();

      if (!response.ok) {
        await this.handleApiError(response);
      }

      const result = await response.json();
      return result;

    } catch (error) {
      clearTimeout(timeoutId);
      throw this.parseNetworkError(error);
    }
  }

  private async enforceRateLimit(): Promise<void> {
    if (this.rateLimitDelay > 0) {
      const timeSinceLastRequest = Date.now() - this.lastRequestTime;
      const remainingDelay = this.rateLimitDelay - timeSinceLastRequest;
      
      if (remainingDelay > 0) {
        console.log(`Rate limiting: waiting ${remainingDelay}ms`);
        await new Promise(resolve => setTimeout(resolve, remainingDelay));
      }
    }
  }

  private async handleApiError(response: Response): Promise<never> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch (parseError) {
      // If we can't parse the error response, create a generic error
    }

    const apiError: ApiError = {
      message: errorData.detail?.message || errorData.message || `API request failed with status ${response.status}`,
      type: errorData.detail?.error_type || this.getErrorTypeFromStatus(response.status),
      status_code: response.status
    };

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      if (retryAfter) {
        this.rateLimitDelay = parseInt(retryAfter) * 1000;
        apiError.retry_after = this.rateLimitDelay;
      } else {
        this.rateLimitDelay = 60000; // Default 1 minute delay
      }
    }

    throw apiError;
  }

  private parseNetworkError(error: any): ApiError {
    if (error.name === 'AbortError') {
      return {
        message: 'Request timeout - the service is taking too long to respond',
        type: 'timeout_error'
      };
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        message: 'Network error - please check your internet connection',
        type: 'network_error'
      };
    }

    return {
      message: error.message || 'Unknown network error occurred',
      type: 'network_error'
    };
  }

  private getErrorTypeFromStatus(status: number): string {
    switch (status) {
      case 400: return 'validation_error';
      case 401: return 'authentication_error';
      case 402: return 'quota_exceeded';
      case 429: return 'rate_limit_exceeded';
      case 500:
      case 502:
      case 503:
      case 504: return 'service_unavailable';
      default: return 'api_error';
    }
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async fetchCommonPests(): Promise<any> {
    // This would typically fetch from a static endpoint or local data
    return fetch('/data/common-pests.json').then(r => r.json()).catch(() => ({}));
  }

  private async fetchCommonDiseases(): Promise<any> {
    // This would typically fetch from a static endpoint or local data
    return fetch('/data/common-diseases.json').then(r => r.json()).catch(() => ({}));
  }

  private async fetchTreatmentDatabase(): Promise<any> {
    // This would typically fetch from a static endpoint or local data
    return fetch('/data/treatments.json').then(r => r.json()).catch(() => ({}));
  }
}

// Export singleton instance
export const pestIdentificationApiService = PestIdentificationApiService.getInstance();

// Utility functions for common operations
export const PestIdentificationApi = {
  /**
   * Quick identification with automatic optimization
   */
  async identify(image: File, cropType?: string): Promise<IdentificationResponse> {
    return pestIdentificationApiService.identifyPestDisease({
      image,
      cropType,
      location: 'user_location'
    });
  },

  /**
   * Get cached result if available
   */
  async getCachedResult(image: File, cropType?: string): Promise<IdentificationResponse | null> {
    const service = pestIdentificationApiService;
    const imageHash = await (service as any).generateImageHash(image);
    return apiCache.getIdentificationResult(imageHash, cropType || 'general');
  },

  /**
   * Preload common data for better performance
   */
  async preload(): Promise<void> {
    return pestIdentificationApiService.preloadCommonData();
  },

  /**
   * Check service availability
   */
  async checkHealth(): Promise<boolean> {
    const status = await pestIdentificationApiService.getServiceStatus();
    return status.available;
  }
};