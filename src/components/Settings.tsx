

  import React, { useState } from "react";
import { Download, Trash2, Save, User, Bell, Lock, Sliders, Database } from "lucide-react";

const tabs = [
  { id: "profile", label: "Profile", icon: User },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Lock },
  { id: "preferences", label: "Preferences", icon: Sliders },
  { id: "data", label: "Data", icon: Database },
];

export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    notifications: true,
    emailAlerts: false,
    language: "en",
    theme: "light",
    autoSave: false,
  });

  const handleSave = () => {
    console.log("Saving:", formData);
    alert("Settings saved!");
  };

  const handleExportData = () => {
    alert("Exporting data...");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      alert("Account deleted.");
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                placeholder="Enter your email"
              />
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">
                Account Information
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Member since: January 2025
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Account type: Free
              </p>
            </div>
          </div>
        );

      case "notifications":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Push Notifications
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Receive notifications about your predictions
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.notifications}
                onChange={(e) =>
                  setFormData({ ...formData, notifications: e.target.checked })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-gray-100">
                  Email Alerts
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Get email updates about new features
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.emailAlerts}
                onChange={(e) =>
                  setFormData({ ...formData, emailAlerts: e.target.checked })
                }
              />
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                Data Privacy
              </h4>
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Your data is encrypted and stored securely. We never share your
                personal information with third parties.
              </p>
            </div>
          </div>
        );

      case "preferences":
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Language
              </label>
              <select
                value={formData.language}
                onChange={(e) =>
                  setFormData({ ...formData, language: e.target.value })
                }
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <select
                value={formData.theme}
                onChange={(e) => {
                  setFormData({ ...formData, theme: e.target.value });
                  document.documentElement.classList.toggle(
                    "dark",
                    e.target.value === "dark"
                  );
                }}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="auto">Auto</option>
              </select>
            </div>
          </div>
        );

      case "data":
        return (
          <div className="space-y-6">
            <div className="bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">
                Data Management
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Manage your data, export information, or delete your account.
              </p>
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
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your account preferences and data
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex">
            {/* Sidebar */}
            <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
              <nav className="p-4 space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800"
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
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
                <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-6">
                  {tabs.find((tab) => tab.id === activeTab)?.label}
                </h2>

                {renderTabContent()}

                <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
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
}
