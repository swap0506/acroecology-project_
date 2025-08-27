import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Loader2, AlertCircle, Eye } from 'lucide-react';

interface ProgressiveImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  lowQualitySrc?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  lazy?: boolean;
  threshold?: number;
  quality?: 'low' | 'medium' | 'high';
  showLoadingIndicator?: boolean;
  fallbackComponent?: React.ReactNode;
}

interface ImageLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  hasError: boolean;
  currentSrc: string;
  loadProgress: number;
}

const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  alt,
  className = '',
  placeholderSrc,
  lowQualitySrc,
  onLoad,
  onError,
  lazy = true,
  threshold = 100,
  quality = 'high',
  showLoadingIndicator = true,
  fallbackComponent
}) => {
  const [loadState, setLoadState] = useState<ImageLoadState>({
    isLoading: false,
    isLoaded: false,
    hasError: false,
    currentSrc: placeholderSrc || '',
    loadProgress: 0
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [isInView, setIsInView] = useState(!lazy);
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Generate different quality versions of the image
  const getImageSrc = useCallback((requestedQuality: 'low' | 'medium' | 'high') => {
    if (requestedQuality === 'low' && lowQualitySrc) {
      return lowQualitySrc;
    }
    
    // If the src has query parameters, modify them for quality
    const url = new URL(src, window.location.origin);
    
    switch (requestedQuality) {
      case 'low':
        url.searchParams.set('q', '30');
        url.searchParams.set('w', '400');
        break;
      case 'medium':
        url.searchParams.set('q', '60');
        url.searchParams.set('w', '800');
        break;
      case 'high':
      default:
        url.searchParams.set('q', '85');
        break;
    }
    
    return url.toString();
  }, [src, lowQualitySrc]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsInView(true);
          observerRef.current?.disconnect();
        }
      },
      {
        rootMargin: `${threshold}px`,
        threshold: 0.1
      }
    );

    observerRef.current.observe(imgRef.current);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, threshold]);

  // Progressive loading logic
  useEffect(() => {
    if (!isInView) return;

    const loadImage = async (imageSrc: string, isLowQuality = false) => {
      return new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        
        img.onload = () => {
          setLoadState(prev => ({
            ...prev,
            isLoaded: !isLowQuality, // Only mark as fully loaded for high quality
            currentSrc: imageSrc,
            loadProgress: isLowQuality ? 50 : 100
          }));
          resolve(img);
        };
        
        img.onerror = () => {
          reject(new Error(`Failed to load image: ${imageSrc}`));
        };
        
        img.src = imageSrc;
      });
    };

    const loadProgressively = async () => {
      setLoadState(prev => ({
        ...prev,
        isLoading: true,
        hasError: false,
        loadProgress: 0
      }));

      try {
        // Step 1: Load low quality version first (if available)
        if (lowQualitySrc || quality !== 'low') {
          const lowQualityUrl = getImageSrc('low');
          await loadImage(lowQualityUrl, true);
        }

        // Step 2: Load medium quality if requested
        if (quality === 'medium') {
          const mediumQualityUrl = getImageSrc('medium');
          await loadImage(mediumQualityUrl, false);
        }

        // Step 3: Load high quality version
        if (quality === 'high') {
          const highQualityUrl = getImageSrc('high');
          await loadImage(highQualityUrl, false);
        }

        setLoadState(prev => ({
          ...prev,
          isLoading: false,
          isLoaded: true,
          loadProgress: 100
        }));

        onLoad?.();

      } catch (error) {
        console.error('Progressive image loading failed:', error);
        
        // Retry logic
        if (retryCount.current < maxRetries) {
          retryCount.current++;
          console.log(`Retrying image load (attempt ${retryCount.current}/${maxRetries})`);
          
          // Exponential backoff
          setTimeout(() => {
            loadProgressively();
          }, Math.pow(2, retryCount.current) * 1000);
          
          return;
        }

        setLoadState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true,
          loadProgress: 0
        }));

        onError?.(error as Error);
      }
    };

    loadProgressively();
  }, [isInView, src, lowQualitySrc, quality, getImageSrc, onLoad, onError]);

  // Render loading placeholder
  const renderPlaceholder = () => (
    <div 
      className={`
        flex items-center justify-center bg-gray-100 animate-pulse
        ${className}
      `}
      style={{ minHeight: '200px' }}
    >
      {showLoadingIndicator && (
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400 mx-auto mb-2" />
          <div className="text-sm text-gray-500">
            Loading image...
            {loadState.loadProgress > 0 && (
              <div className="mt-2">
                <div className="w-24 bg-gray-200 rounded-full h-1.5 mx-auto">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${loadState.loadProgress}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400 mt-1 block">
                  {loadState.loadProgress}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  // Render error state
  const renderError = () => {
    if (fallbackComponent) {
      return fallbackComponent;
    }

    return (
      <div 
        className={`
          flex items-center justify-center bg-red-50 border border-red-200 rounded-lg
          ${className}
        `}
        style={{ minHeight: '200px' }}
      >
        <div className="text-center p-4">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
          <div className="text-sm text-red-600 mb-2">Failed to load image</div>
          <button
            onClick={() => {
              retryCount.current = 0;
              setIsInView(true);
            }}
            className="px-3 py-1 bg-red-100 text-red-700 text-xs rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  };

  // Render the image
  const renderImage = () => (
    <div className="relative">
      <img
        ref={imgRef}
        src={loadState.currentSrc}
        alt={alt}
        className={`
          transition-all duration-500
          ${loadState.isLoaded ? 'opacity-100' : 'opacity-70'}
          ${loadState.isLoading && !loadState.currentSrc ? 'opacity-0' : ''}
          ${className}
        `}
        style={{
          filter: loadState.isLoaded ? 'none' : 'blur(2px)',
        }}
      />
      
      {/* Loading overlay for progressive enhancement */}
      {loadState.isLoading && loadState.currentSrc && (
        <div className="absolute inset-0 bg-white bg-opacity-20 flex items-center justify-center">
          <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            Enhancing...
          </div>
        </div>
      )}
    </div>
  );

  // Main render logic
  if (loadState.hasError) {
    return renderError();
  }

  if (!isInView || (!loadState.currentSrc && loadState.loadProgress === 0)) {
    return renderPlaceholder();
  }

  return renderImage();
};

export default ProgressiveImage;

// Hook for managing multiple progressive images
export const useProgressiveImageLoader = () => {
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set());
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageLoad = useCallback((src: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
    setLoadedImages(prev => new Set(prev).add(src));
  }, []);

  const handleImageError = useCallback((src: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
    setFailedImages(prev => new Set(prev).add(src));
  }, []);

  const startLoading = useCallback((src: string) => {
    setLoadingImages(prev => new Set(prev).add(src));
    setLoadedImages(prev => {
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
    setFailedImages(prev => {
      const next = new Set(prev);
      next.delete(src);
      return next;
    });
  }, []);

  const isLoading = useCallback((src: string) => loadingImages.has(src), [loadingImages]);
  const isLoaded = useCallback((src: string) => loadedImages.has(src), [loadedImages]);
  const hasFailed = useCallback((src: string) => failedImages.has(src), [failedImages]);

  const getLoadingStats = useCallback(() => ({
    loading: loadingImages.size,
    loaded: loadedImages.size,
    failed: failedImages.size,
    total: loadingImages.size + loadedImages.size + failedImages.size
  }), [loadingImages.size, loadedImages.size, failedImages.size]);

  return {
    handleImageLoad,
    handleImageError,
    startLoading,
    isLoading,
    isLoaded,
    hasFailed,
    getLoadingStats
  };
};