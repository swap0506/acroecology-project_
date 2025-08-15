import React, { useState, useEffect, useCallback } from 'react';
import { 
  Activity, 
  Clock, 
  Database, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp,
  TrendingDown,
  BarChart3,
  Gauge,
  RefreshCw,
  Download,
  Settings
} from 'lucide-react';
import { PerformanceMonitor } from '../utils/performance';
import { cacheService } from '../services/cacheService';
import { pestIdentificationApiService } from '../services/pestIdentificationApiService';

interface PerformanceDashboardProps {
  isVisible: boolean;
  onClose: () => void;
}

interface PerformanceData {
  summary: Record<string, any>;
  cacheStats: any;
  serviceStatus: any;
  alerts: any[];
  recommendations: string[];
  memoryUsage: number;
}

const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ isVisible, onClose }) => {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  const performanceMonitor = PerformanceMonitor.getInstance();

  const fetchPerformanceData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [report, cacheStats, serviceStatus] = await Promise.all([
        Promise.resolve(performanceMonitor.generateReport()),
        Promise.resolve(cacheService.getStats()),
        pestIdentificationApiService.getServiceStatus()
      ]);

      setPerformanceData({
        summary: report.summary,
        cacheStats,
        serviceStatus,
        alerts: report.recentAlerts,
        recommendations: report.recommendations,
        memoryUsage: report.memoryUsage
      });
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [performanceMonitor]);

  useEffect(() => {
    if (isVisible) {
      fetchPerformanceData();
    }
  }, [isVisible, fetchPerformanceData]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (autoRefresh && isVisible) {
      interval = setInterval(fetchPerformanceData, refreshInterval);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, isVisible, refreshInterval, fetchPerformanceData]);

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatBytes = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`;
  };

  const getPerformanceColor = (value: number, thresholds: { good: number; warning: number }): string => {
    if (value <= thresholds.good) return 'text-green-600';
    if (value <= thresholds.warning) return 'text-yellow-600';
    return 'text-red-600';
  };

  const exportPerformanceData = () => {
    if (!performanceData) return;
    
    const dataStr = JSON.stringify(performanceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gray-50 px-6 py-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="text-blue-600" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Performance Dashboard</h2>
            {isLoading && <RefreshCw className="animate-spin text-gray-400" size={16} />}
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-600">Auto-refresh:</label>
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
            </div>
            
            <button
              onClick={exportPerformanceData}
              className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            >
              <Download size={16} />
              <span>Export</span>
            </button>
            
            <button
              onClick={fetchPerformanceData}
              disabled={isLoading}
              className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={16} />
              <span>Refresh</span>
            </button>
            
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
          {!performanceData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
                <p className="text-gray-600">Loading performance data...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Overview Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Service Status */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Service Status</h3>
                    {performanceData.serviceStatus.available ? (
                      <CheckCircle className="text-green-500" size={20} />
                    ) : (
                      <AlertTriangle className="text-red-500" size={20} />
                    )}
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {performanceData.serviceStatus.available ? 'Online' : 'Offline'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Response: {formatDuration(performanceData.serviceStatus.response_time)}
                  </div>
                </div>

                {/* Cache Performance */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Cache Hit Rate</h3>
                    <Database className="text-blue-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {(performanceData.cacheStats.hitRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {performanceData.cacheStats.entries} entries
                  </div>
                </div>

                {/* Memory Usage */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Memory Usage</h3>
                    <Gauge className="text-purple-500" size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {formatBytes(performanceData.memoryUsage)}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Cache: {formatBytes(performanceData.cacheStats.memoryUsage)}
                  </div>
                </div>

                {/* Active Alerts */}
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-gray-600">Active Alerts</h3>
                    <AlertTriangle className={performanceData.alerts.length > 0 ? 'text-red-500' : 'text-gray-400'} size={20} />
                  </div>
                  <div className="text-2xl font-bold text-gray-800">
                    {performanceData.alerts.length}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last hour
                  </div>
                </div>
              </div>

              {/* Performance Metrics */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <BarChart3 className="mr-2" size={20} />
                  Performance Metrics
                </h3>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Operation</th>
                        <th className="text-right py-2">Count</th>
                        <th className="text-right py-2">Average</th>
                        <th className="text-right py-2">P95</th>
                        <th className="text-right py-2">Latest</th>
                        <th className="text-right py-2">Throughput</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(performanceData.summary).map(([operation, stats]: [string, any]) => (
                        <tr 
                          key={operation} 
                          className={`border-b hover:bg-gray-50 cursor-pointer ${selectedMetric === operation ? 'bg-blue-50' : ''}`}
                          onClick={() => setSelectedMetric(selectedMetric === operation ? null : operation)}
                        >
                          <td className="py-2 font-medium">{operation.replace(/_/g, ' ')}</td>
                          <td className="text-right py-2">{stats.count}</td>
                          <td className={`text-right py-2 ${getPerformanceColor(stats.average, { good: 1000, warning: 3000 })}`}>
                            {formatDuration(stats.average)}
                          </td>
                          <td className={`text-right py-2 ${getPerformanceColor(stats.p95, { good: 2000, warning: 5000 })}`}>
                            {formatDuration(stats.p95)}
                          </td>
                          <td className="text-right py-2">{formatDuration(stats.latest)}</td>
                          <td className="text-right py-2">
                            {stats.throughput.toFixed(2)}/s
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alerts */}
              {performanceData.alerts.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <AlertTriangle className="mr-2 text-red-500" size={20} />
                    Recent Alerts
                  </h3>
                  
                  <div className="space-y-3">
                    {performanceData.alerts.slice(0, 10).map((alert, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-red-50 border border-red-200 rounded">
                        <AlertTriangle className="text-red-500 mt-0.5 flex-shrink-0" size={16} />
                        <div className="flex-1">
                          <div className="font-medium text-red-800">
                            {alert.type.replace(/_/g, ' ')} - {alert.label}
                          </div>
                          <div className="text-sm text-red-600">
                            Value: {formatDuration(alert.value)} (threshold: {formatDuration(alert.threshold)})
                          </div>
                          <div className="text-xs text-red-500">
                            {new Date(alert.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {performanceData.recommendations.length > 0 && (
                <div className="bg-white border rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <TrendingUp className="mr-2 text-green-500" size={20} />
                    Performance Recommendations
                  </h3>
                  
                  <div className="space-y-2">
                    {performanceData.recommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-blue-50 border border-blue-200 rounded">
                        <Zap className="text-blue-500 mt-0.5 flex-shrink-0" size={16} />
                        <div className="text-blue-800">{recommendation}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cache Details */}
              <div className="bg-white border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <Database className="mr-2 text-blue-500" size={20} />
                  Cache Statistics
                </h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{performanceData.cacheStats.hits}</div>
                    <div className="text-sm text-gray-600">Cache Hits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{performanceData.cacheStats.misses}</div>
                    <div className="text-sm text-gray-600">Cache Misses</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{performanceData.cacheStats.entries}</div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {formatBytes(performanceData.cacheStats.memoryUsage)}
                    </div>
                    <div className="text-sm text-gray-600">Memory Used</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PerformanceDashboard;