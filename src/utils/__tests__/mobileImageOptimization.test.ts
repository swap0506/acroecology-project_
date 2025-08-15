import { MobileImageOptimizer, mobileImageOptimizer } from '../mobileImageOptimization';

// Mock HTML5 Canvas API
const mockCanvas = {
  getContext: jest.fn(() => ({
    clearRect: jest.fn(),
    drawImage: jest.fn(),
  })),
  toBlob: jest.fn(),
  width: 0,
  height: 0,
};

const mockImage = {
  onload: null as any,
  onerror: null as any,
  src: '',
  width: 1000,
  height: 800,
};

// Mock DOM APIs
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName: string) => {
    if (tagName === 'canvas') {
      return mockCanvas;
    }
    return {};
  }),
  configurable: true,
});

Object.defineProperty(window, 'Image', {
  value: jest.fn(() => mockImage),
  configurable: true,
});

Object.defineProperty(URL, 'createObjectURL', {
  value: jest.fn(() => 'blob:mock-url'),
  configurable: true,
});

describe('MobileImageOptimizer', () => {
  let optimizer: MobileImageOptimizer;
  let mockFile: File;

  beforeEach(() => {
    optimizer = new MobileImageOptimizer();
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    jest.clearAllMocks();
  });

  describe('optimizeForMobile', () => {
    it('optimizes image with default settings', async () => {
      const mockBlob = new Blob(['optimized'], { type: 'image/jpeg' });
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = optimizer.optimizeForMobile(mockFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }

      const result = await promise;

      expect(result.file).toBeInstanceOf(File);
      expect(result.metadata.width).toBe(1000);
      expect(result.metadata.height).toBe(800);
      expect(result.metadata.format).toBe('jpeg');
      expect(result.compressionRatio).toBeGreaterThan(0);
    });

    it('handles large images by resizing', async () => {
      mockImage.width = 3000;
      mockImage.height = 2000;
      
      const mockBlob = new Blob(['optimized'], { type: 'image/jpeg' });
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(mockBlob);
      });

      const promise = optimizer.optimizeForMobile(mockFile, { maxWidth: 1920, maxHeight: 1920 });
      
      if (mockImage.onload) {
        mockImage.onload();
      }

      await promise;

      expect(mockCanvas.width).toBe(1920);
      expect(mockCanvas.height).toBe(1280);
    });

    it('handles optimization failure gracefully', async () => {
      const promise = optimizer.optimizeForMobile(mockFile);
      
      // Simulate image error
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(promise).rejects.toThrow('Failed to load image');
    });

    it('handles canvas blob creation failure', async () => {
      mockCanvas.toBlob.mockImplementation((callback) => {
        callback(null);
      });

      const promise = optimizer.optimizeForMobile(mockFile);
      
      if (mockImage.onload) {
        mockImage.onload();
      }

      await expect(promise).rejects.toThrow('Failed to optimize image');
    });
  });

  describe('getImageMetadata', () => {
    it('extracts metadata from image file', async () => {
      const promise = optimizer.getImageMetadata(mockFile);
      
      if (mockImage.onload) {
        mockImage.onload();
      }

      const metadata = await promise;

      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(800);
      expect(metadata.size).toBe(mockFile.size);
      expect(metadata.format).toBe('jpeg');
      expect(metadata.hasExif).toBe(true);
    });

    it('handles metadata extraction failure', async () => {
      const promise = optimizer.getImageMetadata(mockFile);
      
      if (mockImage.onerror) {
        mockImage.onerror();
      }

      await expect(promise).rejects.toThrow('Failed to load image for metadata extraction');
    });
  });

  describe('generatePhotoQualityTips', () => {
    it('generates basic tips for desktop', () => {
      const tips = optimizer.generatePhotoQualityTips(false, false);
      
      expect(tips).toContain('Ensure good lighting - natural light works best');
      expect(tips).toContain('Hold the camera steady and focus on the affected area');
      expect(tips.length).toBeGreaterThan(0);
    });

    it('includes mobile-specific tips', () => {
      const tips = optimizer.generatePhotoQualityTips(true, false);
      
      expect(tips).toContain('Use both hands to steady your phone');
      expect(tips).toContain('Tap the screen to focus on the affected area');
      expect(tips.length).toBeGreaterThan(5);
    });

    it('includes camera-specific tips', () => {
      const tips = optimizer.generatePhotoQualityTips(true, true);
      
      expect(tips).toContain('Use the rear camera for better quality');
      expect(tips).toContain('Enable flash only if lighting is very poor');
      expect(tips.length).toBeGreaterThan(8);
    });
  });

  describe('cleanup', () => {
    it('cleans up canvas resources', () => {
      optimizer.cleanup();
      
      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
    });
  });
});

describe('mobileImageOptimizer singleton', () => {
  it('exports a singleton instance', () => {
    expect(mobileImageOptimizer).toBeInstanceOf(MobileImageOptimizer);
  });
});