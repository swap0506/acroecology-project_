import { renderHook, act } from '@testing-library/react';
import { useMobile, getMobileOptimizedImageSize, getOptimalCompressionQuality } from '../useMobile';

// Mock navigator and window properties
const mockNavigator = (userAgent: string, maxTouchPoints: number = 0) => {
  Object.defineProperty(navigator, 'userAgent', {
    value: userAgent,
    configurable: true,
  });
  Object.defineProperty(navigator, 'maxTouchPoints', {
    value: maxTouchPoints,
    configurable: true,
  });
  Object.defineProperty(navigator, 'mediaDevices', {
    value: {
      getUserMedia: jest.fn(),
    },
    configurable: true,
  });
};

const mockWindow = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    value: width,
    configurable: true,
  });
  Object.defineProperty(window, 'innerHeight', {
    value: height,
    configurable: true,
  });
};

describe('useMobile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('detects mobile devices correctly', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 5);
    mockWindow(375, 667);

    const { result } = renderHook(() => useMobile());

    expect(result.current.isMobile).toBe(true);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.hasCamera).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.screenSize).toBe('small');
  });

  it('detects tablet devices correctly', () => {
    mockNavigator('Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X)', 5);
    mockWindow(768, 1024);

    const { result } = renderHook(() => useMobile());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(true);
    expect(result.current.hasCamera).toBe(true);
    expect(result.current.hasTouchScreen).toBe(true);
    expect(result.current.orientation).toBe('portrait');
    expect(result.current.screenSize).toBe('medium');
  });

  it('detects desktop devices correctly', () => {
    mockNavigator('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 0);
    mockWindow(1920, 1080);

    const { result } = renderHook(() => useMobile());

    expect(result.current.isMobile).toBe(false);
    expect(result.current.isTablet).toBe(false);
    expect(result.current.hasCamera).toBe(true);
    expect(result.current.hasTouchScreen).toBe(false);
    expect(result.current.orientation).toBe('landscape');
    expect(result.current.screenSize).toBe('large');
  });

  it('detects orientation changes', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 5);
    mockWindow(375, 667);

    const { result } = renderHook(() => useMobile());

    expect(result.current.orientation).toBe('portrait');

    // Simulate orientation change
    act(() => {
      mockWindow(667, 375);
      window.dispatchEvent(new Event('orientationchange'));
    });

    expect(result.current.orientation).toBe('landscape');
  });

  it('updates on window resize', () => {
    mockNavigator('Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)', 5);
    mockWindow(375, 667);

    const { result } = renderHook(() => useMobile());

    expect(result.current.screenSize).toBe('small');

    // Simulate resize
    act(() => {
      mockWindow(768, 1024);
      window.dispatchEvent(new Event('resize'));
    });

    expect(result.current.screenSize).toBe('medium');
  });
});

describe('getMobileOptimizedImageSize', () => {
  it('maintains aspect ratio when resizing large images', () => {
    const result = getMobileOptimizedImageSize(3000, 2000);
    
    expect(result.width).toBe(1920);
    expect(result.height).toBe(1280);
    expect(result.width / result.height).toBeCloseTo(3000 / 2000);
  });

  it('does not resize images smaller than max dimension', () => {
    const result = getMobileOptimizedImageSize(1000, 800);
    
    expect(result.width).toBe(1000);
    expect(result.height).toBe(800);
  });

  it('handles portrait orientation correctly', () => {
    const result = getMobileOptimizedImageSize(2000, 3000);
    
    expect(result.width).toBe(1280);
    expect(result.height).toBe(1920);
    expect(result.width / result.height).toBeCloseTo(2000 / 3000);
  });
});

describe('getOptimalCompressionQuality', () => {
  it('returns lower quality for large files', () => {
    const largeFileSize = 6 * 1024 * 1024; // 6MB
    const quality = getOptimalCompressionQuality(largeFileSize);
    
    expect(quality).toBe(0.6);
  });

  it('returns medium quality for medium files', () => {
    const mediumFileSize = 3 * 1024 * 1024; // 3MB
    const quality = getOptimalCompressionQuality(mediumFileSize);
    
    expect(quality).toBe(0.7);
  });

  it('returns high quality for small files', () => {
    const smallFileSize = 1 * 1024 * 1024; // 1MB
    const quality = getOptimalCompressionQuality(smallFileSize);
    
    expect(quality).toBe(0.8);
  });
});