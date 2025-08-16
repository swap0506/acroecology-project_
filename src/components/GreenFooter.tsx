import React from 'react';

const GreenFooter: React.FC = () => (
  <div className="relative z-10 bg-emerald-900/90 backdrop-blur-sm border-t border-white/20">
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-6 text-center">
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Policies</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Terms & Conditions</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Privacy</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Data Protection</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Blog</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Latest Insights</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Documentation</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">API Guide</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Pricing</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Plans & Features</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Help Center</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Support Hub</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Community</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Forum</p>
        </div>
        <div className="space-y-2">
          <h4 className="text-white font-semibold text-sm">Contact</h4>
          <p className="text-white/70 text-xs hover:text-white cursor-pointer transition-colors">Support</p>
        </div>
      </div>
      <div className="mt-6 pt-6 border-t border-white/20 text-center">
        <p className="text-white/60 text-sm">© 2025 CropVision. All rights reserved. Empowering farmers with AI-driven insights.</p>
      </div>
    </div>
  </div>
);

export default GreenFooter;
