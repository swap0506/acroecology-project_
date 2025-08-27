import { useState, useEffect } from 'react';

interface MobileCapabilities {
  isMobile: boolean;
  isTablet: boolean;
  hasCamera: boolean;
  hasTouchScreen: boolean;
  orientation: 'portrait' | 'landscape';
  screenSize: 'small' | 'medium' | 'large';
}

export const useMobile = (): MobileCapabilities => {
  const [capabilities, setCapabilities] = useState<MobileCapabilities>({
    isMobile: false,
    isTablet: false,
    hasCamera: false,
    hasTouchScreen: false,
    orientation: 'portrait',
    screenSize: 'large'
  });

  useEffect(() => {
    const detectCapabilities = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detect mobile devices
      const isMobile = /android|webos|iphone|ipod|blackberry|iemobile|opera mini/.test(userAgent);
      const isTablet = /ipad|android(?!.*mobile)|tablet/.test(userAgent);
      
      // Detect camera support
      const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      
      // Detect touch screen
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      
      // Detect orientation
      const orientation = window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
      
      // Detect screen size
      let screenSize: 'small' | 'medium' | 'large' = 'large';
      if (window.innerWidth < 640) {
        screenSize = 'small';
      } else if (window.innerWidth < 1024) {
        screenSize = 'medium';
      }

      setCapabilities({
        isMobile,
        isTablet,
        hasCamera,
        hasTouchScreen,
        orientation,
        screenSize
      });
    };

    // Initial detection
    detectCapabilities();

    // Listen for orientation and resize changes
    const handleResize = () => {
      detectCapabilities();
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return capabilities;
};

// Utility functions for mobile optimization
export const getMobileOptimizedImageSize = (originalWidth: number, originalHeight: number) => {
  const maxDimension = 1920;
  let width = originalWidth;
  let height = originalHeight;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = (height * maxDimension) / width;
      width = maxDimension;
    } else {
      width = (width * maxDimension) / height;
      height = maxDimension;
    }
  }

  return { width: Math.round(width), height: Math.round(height) };
};

export const getOptimalCompressionQuality = (fileSize: number): number => {
  // Adjust compression based on file size for mobile optimization
  if (fileSize > 5 * 1024 * 1024) { // > 5MB
    return 0.6;
  } else if (fileSize > 2 * 1024 * 1024) { // > 2MB
    return 0.7;
  } else {
    return 0.8;
  }
};