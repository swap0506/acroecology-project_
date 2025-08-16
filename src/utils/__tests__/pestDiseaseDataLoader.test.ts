import { describe, it, expect, vi, beforeEach } from 'vitest';
import { initializePestDiseaseData, preloadCriticalData, getDataLoadingStatus } from '../pestDiseaseDataLoader';
import { pestDiseaseDataService } from '../../services/pestDiseaseDataService';

// Mock the service
vi.mock('../../services/pestDiseaseDataService', () => ({
  pestDiseaseDataService: {
    loadData: vi.fn(),
    getDatabaseStats: vi.fn(),
    getEntry: vi.fn(),
    isDataLoaded: vi.fn()
  }
}));

// Mock console methods
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
  warn: vi.spyOn(console, 'warn').mockImplementation(() => {})
};

describe('pestDiseaseDataLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('initializePestDiseaseData', () => {
    it('should initialize data successfully', async () => {
      const mockStats = {
        totalEntries: 6,
        pestCount: 3,
        diseaseCount: 2,
        deficiencyCount: 1,
        totalCrops: 10,
        totalImages: 18
      };

      (pestDiseaseDataService.loadData as any).mockResolvedValue({});
      (pestDiseaseDataService.getDatabaseStats as any).mockResolvedValue(mockStats);

      await initializePestDiseaseData();

      expect(pestDiseaseDataService.loadData).toHaveBeenCalled();
      expect(pestDiseaseDataService.getDatabaseStats).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith('Initializing pest and disease database...');
      expect(consoleSpy.log).toHaveBeenCalledWith(
        'Pest and disease database initialized successfully:',
        expect.objectContaining(mockStats)
      );
    });

    it('should handle initialization errors', async () => {
      const error = new Error('Failed to load data');
      (pestDiseaseDataService.loadData as any).mockRejectedValue(error);

      await expect(initializePestDiseaseData()).rejects.toThrow('Failed to load data');
      expect(consoleSpy.error).toHaveBeenCalledWith('Failed to initialize pest and disease database:', error);
    });
  });

  describe('preloadCriticalData', () => {
    it('should preload critical entries', async () => {
      (pestDiseaseDataService.getEntry as any).mockResolvedValue({});

      await preloadCriticalData();

      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledTimes(6);
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('aphids');
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('spider_mites');
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('whiteflies');
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('powdery_mildew');
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('late_blight');
      expect(pestDiseaseDataService.getEntry).toHaveBeenCalledWith('bacterial_spot');
      
      expect(consoleSpy.log).toHaveBeenCalledWith('Critical pest and disease data preloaded');
    });

    it('should handle preload errors gracefully', async () => {
      const error = new Error('Failed to preload');
      (pestDiseaseDataService.getEntry as any).mockRejectedValue(error);

      await preloadCriticalData();

      expect(consoleSpy.warn).toHaveBeenCalledWith('Failed to preload critical data:', error);
    });
  });

  describe('getDataLoadingStatus', () => {
    it('should return loading status', () => {
      (pestDiseaseDataService.isDataLoaded as any).mockReturnValue(true);

      const status = getDataLoadingStatus();

      expect(status.isLoaded).toBe(true);
      expect(status.service).toBe(pestDiseaseDataService);
    });
  });
});