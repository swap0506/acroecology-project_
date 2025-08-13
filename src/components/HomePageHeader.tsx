import React from 'react';
import { Sprout } from 'lucide-react';
import { SignedIn, SignedOut, SignInButton, UserButton } from '@clerk/clerk-react';

interface HomePageHeaderProps {
  handleGoHome: () => void;
}

const HomePageHeader: React.FC<HomePageHeaderProps> = ({ handleGoHome }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300 opacity-100 translate-y-0">
      <div className="bg-emerald-900/60 backdrop-blur-md border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-2 text-white hover:text-green-300 transition-colors cursor-pointer"
            >
              <Sprout size={28} />
              <span className="text-white text-xl font-bold">CropVision</span>
            </button>
            <div className="flex items-center space-x-4">
              <SignedIn>
                <UserButton />
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
    </header>
  );
};

export default HomePageHeader;
