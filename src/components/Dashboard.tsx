import React from 'react';
import { TrendingUp, Leaf, Droplets, Sun, Calendar, MapPin, Award, Target } from 'lucide-react';

interface DashboardProps {
  user: { name: string; email: string } | null;
  predictionCount: number;
}

const Dashboard: React.FC<DashboardProps> = ({ user, predictionCount }) => {
  const recentPredictions = [
    { crop: 'Rice', confidence: 92, date: '2025-01-15', location: 'Field A' },
    { crop: 'Wheat', confidence: 88, date: '2025-01-14', location: 'Field B' },
    { crop: 'Maize', confidence: 85, date: '2025-01-13', location: 'Field C' },
    { crop: 'Cotton', confidence: 80, date: '2025-01-12', location: 'Field D' },
  ];

  const weatherData = {
    temperature: 28,
    humidity: 65,
    rainfall: 120,
    forecast: 'Partly Cloudy'
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || 'Farmer'}! 👋
          </h1>
          <p className="text-gray-600">Here's your agricultural dashboard overview</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                <p className="text-2xl font-bold text-gray-900">{predictionCount}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <TrendingUp className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">95%</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Award className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Fields</p>
                <p className="text-2xl font-bold text-gray-900">4</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <MapPin className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">This Month</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Target className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Predictions */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Recent Predictions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPredictions.map((prediction, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 rounded-full p-2">
                          <Leaf className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{prediction.crop}</p>
                          <p className="text-sm text-gray-600">{prediction.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{prediction.confidence}%</p>
                        <p className="text-sm text-gray-500">{prediction.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Widget */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Weather Today</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sun className="text-orange-500" size={20} />
                      <span className="text-gray-600">Temperature</span>
                    </div>
                    <span className="font-semibold">{weatherData.temperature}°C</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Droplets className="text-blue-500" size={20} />
                      <span className="text-gray-600">Humidity</span>
                    </div>
                    <span className="font-semibold">{weatherData.humidity}%</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="text-green-500" size={20} />
                      <span className="text-gray-600">Rainfall</span>
                    </div>
                    <span className="font-semibold">{weatherData.rainfall}mm</span>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-center text-gray-600">{weatherData.forecast}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-3">
                  <button className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                    New Prediction
                  </button>
                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                    View Analytics
                  </button>
                  <button className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                    Export Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;