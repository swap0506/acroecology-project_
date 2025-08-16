// Enhanced Performance monitoring utilities with detailed analytics

interface PerformanceMetric {
  label: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface PerformanceStats {
  average: number;
  median: number;
  min: number;
  max: number;
  count: number;
  latest: number;
  p95: number;
  p99: number;
  standardDeviation: number;
  throughput: number; // operations per second
}

interface PerformanceAlert {
  type: 'slow_operation' | 'memory_leak' | 'high_frequency';
  label: string;
  value: number;
  threshold: number;
  timestamp: number;
}

export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private alerts: PerformanceAlert[] = [];
  private thresholds: Map<string, number> = new Map();
  private maxMetricsPerLabel = 1000;
  private alertCallbacks: Array<(alert: PerformanceAlert) => void> = [];

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string, metadata?: Record<string, any>): () => void {
    const startTime = performance.now();
    const startMemory = (performance as any).memory?.usedJSHeapSize || 0;
    
    return () => {
      const endTime = performance.now();
      const endMemory = (performance as any).memory?.usedJSHeapSize || 0;
      const duration = endTime - startTime;
      
      const metric: PerformanceMetric = {
        label,
        duration,
        timestamp: Date.now(),
        metadata: {
          ...metadata,
          memoryDelta: endMemory - startMemory,
          userAgent: navigator.userAgent,
          connectionType: (navigator as any).connection?.effectiveType || 'unknown'
        }
      };

      this.recordMetric(metric);
      this.checkAlerts(label, duration);
    };
  }

  recordMetric(metric: PerformanceMetric): void {
    if (!this.metrics.has(metric.label)) {
      this.metrics.set(metric.label, []);
    }
    
    const measurements = this.metrics.get(metric.label)!;
    measurements.push(metric);
    
    // Keep only recent measurements to prevent memory leaks
    if (measurements.length > this.maxMetricsPerLabel) {
      measurements.splice(0, measurements.length - this.maxMetricsPerLabel);
    }
  }

  setThreshold(label: string, thresholdMs: number): void {
    this.thresholds.set(label, thresholdMs);
  }

  onAlert(callback: (alert: PerformanceAlert) => void): void {
    this.alertCallbacks.push(callback);
  }

  getStats(label: string): PerformanceStats | null {
    const measurements = this.metrics.get(label);
    if (!measurements || measurements.length === 0) {
      return null;
    }

    const durations = measurements.map(m => m.duration).sort((a, b) => a - b);
    const sum = durations.reduce((acc, time) => acc + time, 0);
    const count = durations.length;
    
    // Calculate percentiles
    const p95Index = Math.floor(count * 0.95);
    const p99Index = Math.floor(count * 0.99);
    const medianIndex = Math.floor(count * 0.5);
    
    // Calculate standard deviation
    const mean = sum / count;
    const variance = durations.reduce((acc, duration) => acc + Math.pow(duration - mean, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);
    
    // Calculate throughput (operations per second over last minute)
    const oneMinuteAgo = Date.now() - 60000;
    const recentMeasurements = measurements.filter(m => m.timestamp > oneMinuteAgo);
    const throughput = recentMeasurements.length / 60; // ops per second

    return {
      average: mean,
      median: durations[medianIndex],
      min: durations[0],
      max: durations[count - 1],
      count,
      latest: measurements[measurements.length - 1].duration,
      p95: durations[p95Index],
      p99: durations[p99Index],
      standardDeviation,
      throughput
    };
  }

  getAllStats(): Record<string, PerformanceStats> {
    const result: Record<string, PerformanceStats> = {};
    
    for (const label of this.metrics.keys()) {
      const stats = this.getStats(label);
      if (stats) {
        result[label] = stats;
      }
    }
    
    return result;
  }

  getSlowOperations(thresholdMs: number = 1000): PerformanceMetric[] {
    const slowOps: PerformanceMetric[] = [];
    
    for (const measurements of this.metrics.values()) {
      slowOps.push(...measurements.filter(m => m.duration > thresholdMs));
    }
    
    return slowOps.sort((a, b) => b.duration - a.duration);
  }

  getRecentAlerts(limitMinutes: number = 60): PerformanceAlert[] {
    const cutoff = Date.now() - (limitMinutes * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoff);
  }

  generateReport(): {
    summary: Record<string, PerformanceStats>;
    slowOperations: PerformanceMetric[];
    recentAlerts: PerformanceAlert[];
    memoryUsage: number;
    recommendations: string[];
  } {
    const summary = this.getAllStats();
    const slowOperations = this.getSlowOperations();
    const recentAlerts = this.getRecentAlerts();
    const memoryUsage = (performance as any).memory?.usedJSHeapSize || 0;
    
    const recommendations = this.generateRecommendations(summary, slowOperations);

    return {
      summary,
      slowOperations: slowOperations.slice(0, 10), // Top 10 slowest
      recentAlerts,
      memoryUsage,
      recommendations
    };
  }

  clearMetrics(label?: string): void {
    if (label) {
      this.metrics.delete(label);
    } else {
      this.metrics.clear();
      this.alerts = [];
    }
  }

  private checkAlerts(label: string, duration: number): void {
    const threshold = this.thresholds.get(label) || 1000; // Default 1 second
    
    if (duration > threshold) {
      const alert: PerformanceAlert = {
        type: 'slow_operation',
        label,
        value: duration,
        threshold,
        timestamp: Date.now()
      };
      
      this.alerts.push(alert);
      
      // Keep only recent alerts
      const oneHourAgo = Date.now() - 3600000;
      this.alerts = this.alerts.filter(a => a.timestamp > oneHourAgo);
      
      // Notify callbacks
      this.alertCallbacks.forEach(callback => {
        try {
          callback(alert);
        } catch (error) {
          console.error('Performance alert callback error:', error);
        }
      });
      
      // Log in development
      if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') {
        console.warn(`🐌 Slow operation: ${label} took ${duration.toFixed(2)}ms (threshold: ${threshold}ms)`);
      }
    }
  }

  private generateRecommendations(
    summary: Record<string, PerformanceStats>,
    slowOperations: PerformanceMetric[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Check for consistently slow operations
    for (const [label, stats] of Object.entries(summary)) {
      if (stats.average > 2000) {
        recommendations.push(`Consider optimizing "${label}" - average duration is ${stats.average.toFixed(0)}ms`);
      }
      
      if (stats.p95 > 5000) {
        recommendations.push(`"${label}" has high latency variance - 95th percentile is ${stats.p95.toFixed(0)}ms`);
      }
      
      if (stats.throughput < 0.1 && stats.count > 10) {
        recommendations.push(`"${label}" has low throughput - consider batching or caching`);
      }
    }
    
    // Check for memory-intensive operations
    const memoryIntensiveOps = slowOperations.filter(op => 
      op.metadata?.memoryDelta && op.metadata.memoryDelta > 10 * 1024 * 1024 // 10MB
    );
    
    if (memoryIntensiveOps.length > 0) {
      recommendations.push('Some operations are using significant memory - consider optimization');
    }
    
    // Check for mobile-specific issues
    const mobileOps = slowOperations.filter(op => 
      op.metadata?.userAgent?.includes('Mobile') && op.duration > 3000
    );
    
    if (mobileOps.length > 0) {
      recommendations.push('Mobile users experiencing slow performance - consider mobile-specific optimizations');
    }
    
    return recommendations;
  }
}

// Utility function for measuring async operations
export async function measureAsync<T>(
  label: string,
  operation: () => Promise<T>
): Promise<T> {
  const monitor = PerformanceMonitor.getInstance();
  const stopTimer = monitor.startTimer(label);
  
  try {
    const result = await operation();
    return result;
  } finally {
    stopTimer();
  }
}

// Utility function for measuring sync operations
export function measureSync<T>(
  label: string,
  operation: () => T
): T {
  const monitor = PerformanceMonitor.getInstance();
  const stopTimer = monitor.startTimer(label);
  
  try {
    return operation();
  } finally {
    stopTimer();
  }
}

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const monitor = PerformanceMonitor.getInstance();
  
  return {
    startTimer: monitor.startTimer.bind(monitor),
    getAllStats: monitor.getAllStats.bind(monitor),
    measureAsync,
    measureSync
  };
}