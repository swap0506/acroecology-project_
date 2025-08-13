import React from 'react';
import { Sprout, TrendingUp, Home, Settings, Bell } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton, useUser } from '@clerk/clerk-react';

interface TranslucentHeaderProps {
  handleGoHome: () => void;
  handleNavigation: (page: string) => void;
  currentPage: string;
}

const TranslucentHeader: React.FC<TranslucentHeaderProps> = ({ handleGoHome, handleNavigation, currentPage }) => {
  const { isLoaded } = useUser();

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="relative z-20 bg-emerald-900/40 backdrop-blur-sm border-b border-white/20">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={handleGoHome}
              className="flex items-center space-x-2 text-white hover:text-green-300 transition-colors cursor-pointer"
            >
              <Sprout size={28} />
              <span className="text-white text-xl font-bold">CropVision</span>
            </button>
            <nav className="hidden md:flex items-center space-x-6">
              <button
                onClick={() => handleNavigation('dashboard')}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <Home size={18} />
                <span>Dashboard</span>
              </button>
              <button
                onClick={() => handleNavigation('analytics')}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <TrendingUp size={18} />
                <span>Analytics</span>
              </button>
              <button
                onClick={() => handleNavigation('settings')}
                className="flex items-center space-x-2 text-white/80 hover:text-white transition-colors"
              >
                <Settings size={18} />
                <span>Settings</span>
              </button>
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            <button className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-all">
              <Bell size={20} />
            </button>
            <SignedIn>
              <div className="flex items-center space-x-3">
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <SignInButton mode="modal">
                <button
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-full font-medium transition-all duration-300"
                >
                  Sign In
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslucentHeader;
