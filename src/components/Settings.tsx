import React, { useState } from 'react';
import { User, Bell, Shield, Globe, Palette, Database, Download, Trash2, Save } from 'lucide-react';

interface SettingsProps {
  user: { name: string; email: string } | null;
  onUpdateUser: (userData: { name: string; email: string }) => void;
}

const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser }) => {
  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    notifications: true,
    emailAlerts: false,
    language: 'en',
    theme: 'light',
    autoSave: true,
  });

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Palette },
    { id: 'data', label: 'Data', icon: Database },
  ];

  const handleSave = () => {
    if (activeTab === 'profile') {
      onUpdateUser({ name: formData.name, email: formData.email });
    }
    // Show success message
    alert('Settings saved successfully!');
  };

  const handleExportData = () => {
    // Simulate data export
    const data = {
      user: user,
      predictions: 'Sample prediction data...',
      settings: formData,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cropvision-data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = () => {
    if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      localStorage.removeItem('cropVisionUser');
      localStorage.removeItem('cropPredictionCount');
      alert('Account deleted successfully.');
      window.location.reload();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
              <p className="text-sm text-gray-600">Member since: January 2025</p>
              <p className="text-sm text-gray-600">Account type: Free</p>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Push Notifications</h4>
                <p className="text-sm text-gray-600">Receive notifications about your predictions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.notifications}
                  onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Email Alerts</h4>
                <p className="text-sm text-gray-600">Get email updates about new features</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailAlerts}
                  onChange={(e) => setFormData({ ...formData, emailAlerts: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Data Privacy</h4>
              <p className="text-sm text-blue-800">Your data is encrypted and stored securely. We never share your personal information with third parties.</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Data Collection</span>
                <span className="text-sm text-green-600">Minimal</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Third-party Sharing</span>
                <span className="text-sm text-red-600">Disabled</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">Data Encryption</span>
                <span className="text-sm text-green-600">Enabled</span>
              </div>
            </div>
          </div>
        );

      case 'preferences':
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
              <select
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
              <select
                value={formData.theme}
                onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Auto-save</h4>
                <p className="text-sm text-gray-600">Automatically save your predictions</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.autoSave}
                  onChange={(e) => setFormData({ ...formData, autoSave: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 mb-2">Data Management</h4>
              <p className="text-sm text-yellow-800">Manage your data, export information, or delete your account.</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={handleExportData}
                className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                <Download size={18} />
                <span>Export My Data</span>
              </button>
              
              <button
                onClick={handleDeleteAccount}
                className="w-full flex items-center justify-center space-x-2 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg transition-colors"
              >
                <Trash2 size={18} />
                <span>Delete Account</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>• Export includes all your predictions and account data</p>
              <p>• Account deletion is permanent and cannot be undone</p>
              <p>• Data is removed within 30 days of deletion request</p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
          <p className="text-gray-600">Manage your account preferences and data</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 border-r border-gray-200">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-green-100 text-green-700 border border-green-200'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-8">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-semibold text-gray-900 mb-6">
                  {tabs.find(tab => tab.id === activeTab)?.label}
                </h2>
                
                {renderTabContent()}
                
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={handleSave}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
                  >
                    <Save size={18} />
                    <span>Save Changes</span>
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

export default Settings;