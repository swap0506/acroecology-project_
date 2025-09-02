import React, { useState } from 'react';
import { SignedIn, useUser } from '@clerk/clerk-react';
import { Sprout, Bug } from 'lucide-react';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import SettingsPage from './components/Settings';
import PestIdentification from './components/PestIdentification';
import TranslucentHeader from './components/TranslucentHeader';
import GreenFooter from './components/GreenFooter';

import CropParameterCards from './components/CropParameterCards';
import ParameterInputForm from './components/ParameterInputForm';

export interface CropData {
  rainfall: string;
  temperature: string;
  humidity: string;
  phosphorous: string;
  potassium: string;
  nitrogen: string;
  ph: string;
  soilType: string;
}

const App = () => {
  const [currentPage, setCurrentPage] = useState('prediction');
  const [predictionCount, setPredictionCount] = useState(0);
  const { user } = useUser();
  const appUser = user ? { name: user.fullName || user.username || user.id, email: user.primaryEmailAddress?.emailAddress || '' } : null;

  const handleNavigation = (page: string) => setCurrentPage(page);
  const handleGoHome = () => setCurrentPage('prediction');

  if (currentPage === 'dashboard') {
    return (
      <SignedIn>
        <TranslucentHeader handleGoHome={handleGoHome} handleNavigation={handleNavigation} currentPage={currentPage} />
        <Dashboard user={appUser} predictionCount={predictionCount} onNavigate={handleNavigation} />
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button onClick={() => handleNavigation('pest-identification')} className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="Identify Pests & Diseases"><Bug size={24} /></button>
          <button onClick={() => handleNavigation('prediction')} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="New Crop Prediction"><Sprout size={24} /></button>
        </div>
        <GreenFooter />
      </SignedIn>
    );
  }
  if (currentPage === 'analytics') {
    return (
      <SignedIn>
        <TranslucentHeader handleGoHome={handleGoHome} handleNavigation={handleNavigation} currentPage={currentPage} />
        <Analytics predictionCount={predictionCount} onNavigate={handleNavigation} />
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button onClick={() => handleNavigation('pest-identification')} className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="Identify Pests & Diseases"><Bug size={24} /></button>
          <button onClick={() => handleNavigation('prediction')} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="New Crop Prediction"><Sprout size={24} /></button>
        </div>
        <GreenFooter />
      </SignedIn>
    );
  }
  if (currentPage === 'settings') {
    return (
      <SignedIn>
        <TranslucentHeader handleGoHome={handleGoHome} handleNavigation={handleNavigation} currentPage={currentPage} />
        <SettingsPage user={appUser} onUpdateUser={() => {}} onNavigate={handleNavigation} />
        <div className="fixed bottom-6 right-6 flex flex-col space-y-3">
          <button onClick={() => handleNavigation('pest-identification')} className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="Identify Pests & Diseases"><Bug size={24} /></button>
          <button onClick={() => handleNavigation('prediction')} className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110" title="New Crop Prediction"><Sprout size={24} /></button>
        </div>
        <GreenFooter />
      </SignedIn>
    );
  }
  if (currentPage === 'pest-identification') {
    return (
      <PestIdentification onBack={() => handleNavigation('prediction')} onNavigate={handleNavigation} user={appUser} />
    );
  }
  // Show parameter info cards on the main prediction/landing page
  return (
    <div className="flex flex-col items-center w-full">
      <h2 className="text-2xl font-bold mt-8 mb-2 text-green-700">Crop Selection Parameters</h2>
      <p className="text-gray-600 mb-4 text-center max-w-xl">Learn about each parameter and its ideal range before entering your values.</p>
      <CropParameterCards />
      <ParameterInputForm onSubmit={(values) => {
        // You can handle submission side effects here if needed
      }} />
    </div>
  );
};

export default App;