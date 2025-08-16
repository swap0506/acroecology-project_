/**
 * Comprehensive caching service for API responses and database lookups
 * Implements multiple caching strategies with TTL and memory management
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  accessCount: number;
  lastAccessed: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  memoryUsage: number;
  hitRate: number;
}

export class CacheService {
  private static instance: CacheService;
  private cache = new Map<string, CacheEntry<any>>();
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    entries: 0,
    memoryUsage: 0,
    hitRate: 0
  };
  private maxEntries = 1000;
  private cleanupInterval: NodeJS.Timeout | null = null;

  private constructor() {
    // Start cleanup interval
    this.startCleanup();
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  /**
   * Store data in cache with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 300000): void { // 5 minutes default
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
      accessCount: 0,
      lastAccessed: Date.now()
    };

    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxEntries) {
      this.evictOldest();
    }

    this.cache.set(key, entry);
    this.updateStats();
  }

  /**
   * Retrieve data from cache
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      this.updateHitRate();
      return null;
    }

    // Update access statistics
    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.stats.hits++;
    this.updateHitRate();

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Remove specific key from cache
   */
  delete(key: string): boolean {
    const result = this.cache.delete(key);
    this.updateStats();
    return result;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.stats = {
      hits: 0,
      misses: 0,
      entries: 0,
      memoryUsage: 0,
      hitRate: 0
    };
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    this.updateStats();
    return { ...this.stats };
  }

  /**
   * Cache API response with automatic key generation
   */
  async cacheApiCall<T>(
    key: string,
    apiCall: () => Promise<T>,
    ttlMs: number = 300000
  ): Promise<T> {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Make API call and cache result
    try {
      const result = await apiCall();
      this.set(key, result, ttlMs);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }

  /**
   * Cache database lookup with automatic key generation
   */
  cacheDatabaseLookup<T>(
    key: string,
    lookup: () => T,
    ttlMs: number = 600000 // 10 minutes for database lookups
  ): T {
    // Check cache first
    const cached = this.get<T>(key);
    if (cached !== null) {
      return cached;
    }

    // Perform lookup and cache result
    const result = lookup();
    this.set(key, result, ttlMs);
    return result;
  }

  /**
   * Generate cache key for API requests
   */
  generateApiKey(endpoint: string, params: Record<string, any> = {}): string {
    const paramString = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');
    
    return `api:${endpoint}:${this.hashString(paramString)}`;
  }

  /**
   * Generate cache key for database lookups
   */
  generateDbKey(table: string, query: Record<string, any> = {}): string {
    const queryString = Object.keys(query)
      .sort()
      .map(key => `${key}=${JSON.stringify(query[key])}`)
      .join('&');
    
    return `db:${table}:${this.hashString(queryString)}`;
  }

  /**
   * Preload frequently accessed data
   */
  async preloadData(preloadFunctions: Array<{ key: string; loader: () => Promise<any>; ttl?: number }>): Promise<void> {
    const promises = preloadFunctions.map(async ({ key, loader, ttl = 300000 }) => {
      try {
        if (!this.has(key)) {
          const data = await loader();
          this.set(key, data, ttl);
        }
      } catch (error) {
        console.warn(`Failed to preload data for key ${key}:`, error);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Invalidate cache entries by pattern
   */
  invalidatePattern(pattern: string): number {
    let count = 0;
    const regex = new RegExp(pattern);
    
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    this.updateStats();
    return count;
  }

  /**
   * Get cache entries by pattern
   */
  getByPattern<T>(pattern: string): Array<{ key: string; data: T }> {
    const regex = new RegExp(pattern);
    const results: Array<{ key: string; data: T }> = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (regex.test(key) && Date.now() - entry.timestamp <= entry.ttl) {
        results.push({ key, data: entry.data });
      }
    }
    
    return results;
  }

  private startCleanup(): void {
    // Run cleanup every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 300000);
  }

  private cleanup(): void {
    const now = Date.now();
    let removedCount = 0;

    for (const [key, entry] of this.cache.entries()) {
      // Remove expired entries
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        removedCount++;
      }
    }

    // If still over capacity, remove least recently used entries
    if (this.cache.size > this.maxEntries * 0.8) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      const toRemove = Math.floor(this.maxEntries * 0.2);
      for (let i = 0; i < toRemove && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      console.log(`Cache cleanup: removed ${removedCount} entries`);
      this.updateStats();
    }
  }

  private evictOldest(): void {
    // Find and remove the oldest entry
    let oldestKey = '';
    let oldestTime = Date.now();

    for (const [key, entry] of this.cache.entries()) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  private updateStats(): void {
    this.stats.entries = this.cache.size;
    this.stats.memoryUsage = this.estimateMemoryUsage();
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses;
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0;
    for (const [key, entry] of this.cache.entries()) {
      size += key.length * 2; // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2;
      size += 64; // Overhead for entry metadata
    }
    return size;
  }

  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(36);
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cacheService = CacheService.getInstance();

// Specialized cache instances for different data types
export class ApiCache {
  private cache = cacheService;

  async cacheIdentificationResult(
    imageHash: string,
    cropType: string,
    result: any,
    ttl: number = 3600000 // 1 hour
  ): Promise<void> {
    const key = this.cache.generateApiKey('identify', { imageHash, cropType });
    this.cache.set(key, result, ttl);
  }

  async getIdentificationResult(imageHash: string, cropType: string): Promise<any | null> {
    const key = this.cache.generateApiKey('identify', { imageHash, cropType });
    return this.cache.get(key);
  }

  async cachePestDiseaseData(data: any, ttl: number = 86400000): Promise<void> { // 24 hours
    const key = 'pest_disease_database';
    this.cache.set(key, data, ttl);
  }

  async getPestDiseaseData(): Promise<any | null> {
    return this.cache.get('pest_disease_database');
  }

  invalidateIdentificationCache(): number {
    return this.cache.invalidatePattern('^api:identify:');
  }
}

export class DatabaseCache {
  private cache = cacheService;

  cacheQuery<T>(table: string, query: Record<string, any>, result: T, ttl: number = 600000): void {
    const key = this.cache.generateDbKey(table, query);
    this.cache.set(key, result, ttl);
  }

  getQuery<T>(table: string, query: Record<string, any>): T | null {
    const key = this.cache.generateDbKey(table, query);
    return this.cache.get(key);
  }

  invalidateTable(table: string): number {
    return this.cache.invalidatePattern(`^db:${table}:`);
  }
}

// Export specialized cache instances
export const apiCache = new ApiCache();
export const databaseCache = new DatabaseCache();