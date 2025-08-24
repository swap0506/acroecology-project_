import React from 'react';
import { TrendingUp, Leaf, Droplets, Sun, Calendar, MapPin, Award, Target, Bug } from 'lucide-react';
import { useTheme } from "../ThemeContext";

interface DashboardProps {
  user: { name: string; email: string } | null;
  predictionCount: number;
  onNavigate?: (page: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, predictionCount, onNavigate }) => {
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top bar with Theme Toggle */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Welcome back, {user?.name || 'Farmer'}! 👋
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Here's your agricultural dashboard overview
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg 
                       bg-gray-200 dark:bg-gray-700 
                       text-gray-900 dark:text-gray-100 
                       hover:bg-gray-300 dark:hover:bg-gray-600 
                       hover:scale-105 transition"
          >
            {theme === 'light' ? '🌙 Dark Mode' : '☀️ Light Mode'}
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Predictions
                </p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {predictionCount}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 rounded-full p-3 transition-colors duration-300">
                <TrendingUp className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">95%</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Award className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Fields</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <MapPin className="text-purple-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">This Month</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">12</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Predictions</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentPredictions.map((prediction, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="bg-green-100 rounded-full p-2">
                          <Leaf className="text-green-600" size={20} />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{prediction.crop}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{prediction.location}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-green-600">{prediction.confidence}%</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{prediction.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Weather Widget + Quick Actions */}
          <div className="space-y-6">
            {/* Weather Widget */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Weather Today</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Sun className="text-orange-500" size={20} />
                    <span className="text-gray-600 dark:text-gray-400">Temperature</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{weatherData.temperature}°C</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Droplets className="text-blue-500" size={20} />
                    <span className="text-gray-600 dark:text-gray-400">Humidity</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{weatherData.humidity}%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Calendar className="text-green-500" size={20} />
                    <span className="text-gray-600 dark:text-gray-400">Rainfall</span>
                  </div>
                  <span className="font-semibold text-gray-900 dark:text-white">{weatherData.rainfall}mm</span>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-center text-gray-600 dark:text-gray-400">{weatherData.forecast}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6 space-y-3">
                <button 
                  onClick={() => onNavigate?.('prediction')}
                  className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition"
                >
                  New Prediction
                </button>
                <button 
                  onClick={() => onNavigate?.('pest-identification')}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 px-4 rounded-lg font-medium transition flex items-center justify-center space-x-2"
                >
                  <Bug size={18} />
                  <span>Identify Pests</span>
                </button>
                <button 
                  onClick={() => onNavigate?.('analytics')}
                  className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition"
                >
                  View Analytics
                </button>
                <button 
                  onClick={() => onNavigate?.('settings')}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition"
                >
                  Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
