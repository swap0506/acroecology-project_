import React from 'react';
import { BarChart3, PieChart, TrendingUp, Calendar, Download, Filter } from 'lucide-react';

interface AnalyticsProps {
  predictionCount: number;
}

const Analytics: React.FC<AnalyticsProps> = ({ predictionCount }) => {
  const cropDistribution = [
    { crop: 'Rice', count: 45, percentage: 35, color: 'bg-green-500' },
    { crop: 'Wheat', count: 32, percentage: 25, color: 'bg-yellow-500' },
    { crop: 'Maize', count: 28, percentage: 22, color: 'bg-orange-500' },
    { crop: 'Cotton', count: 23, percentage: 18, color: 'bg-blue-500' },
  ];

  const monthlyData = [
    { month: 'Jan', predictions: 8 },
    { month: 'Feb', predictions: 12 },
    { month: 'Mar', predictions: 15 },
    { month: 'Apr', predictions: 18 },
    { month: 'May', predictions: 22 },
    { month: 'Jun', predictions: 25 },
  ];

  const successRates = [
    { crop: 'Rice', rate: 95 },
    { crop: 'Wheat', rate: 92 },
    { crop: 'Maize', rate: 88 },
    { crop: 'Cotton', rate: 85 },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
            <p className="text-gray-600">Comprehensive insights into your crop predictions</p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="flex items-center space-x-2 bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
              <Filter size={18} />
              <span>Filter</span>
            </button>
            <button className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors">
              <Download size={18} />
              <span>Export</span>
            </button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-3xl font-bold text-gray-900">{predictionCount}</p>
                <p className="text-sm text-green-600 mt-1">↗ +12% from last month</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Confidence</p>
                <p className="text-3xl font-bold text-gray-900">90%</p>
                <p className="text-sm text-green-600 mt-1">↗ +3% from last month</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Most Popular</p>
                <p className="text-3xl font-bold text-gray-900">Rice</p>
                <p className="text-sm text-gray-600 mt-1">35% of predictions</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <PieChart className="text-yellow-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-gray-900">25</p>
                <p className="text-sm text-green-600 mt-1">↗ +8 from last month</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Calendar className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Crop Distribution Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Crop Distribution</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {cropDistribution.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                      <span className="font-medium text-gray-900">{item.crop}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${item.color}`}
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 w-12 text-right">
                        {item.percentage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Monthly Predictions</h2>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {monthlyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 w-12">{item.month}</span>
                    <div className="flex-1 mx-4">
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className="h-3 bg-gradient-to-r from-green-400 to-green-600 rounded-full"
                          style={{ width: `${(item.predictions / 25) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                    <span className="text-sm font-medium text-gray-600 w-8 text-right">
                      {item.predictions}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Success Rates */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Success Rates by Crop</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {successRates.map((item, index) => (
                <div key={index} className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-4">
                    <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                      <path
                        className="text-gray-200"
                        stroke="currentColor"
                        strokeWidth="3"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path
                        className="text-green-500"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${item.rate}, 100`}
                        strokeLinecap="round"
                        fill="none"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-bold text-gray-900">{item.rate}%</span>
                    </div>
                  </div>
                  <p className="font-medium text-gray-900">{item.crop}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;