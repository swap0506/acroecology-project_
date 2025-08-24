import { pestDiseaseDataService } from '../services/pestDiseaseDataService';

/**
 * Initialize pest and disease data on application startup
 */
export const initializePestDiseaseData = async (): Promise<void> => {
  try {
    console.log('Initializing pest and disease database...');
    
    const startTime = performance.now();
    await pestDiseaseDataService.loadData();
    const loadTime = performance.now() - startTime;
    
    const stats = await pestDiseaseDataService.getDatabaseStats();
    
    console.log('Pest and disease database initialized successfully:', {
      loadTime: `${loadTime.toFixed(2)}ms`,
      ...stats
    });
    
    // Log any missing images (in development)
    if (process.env.NODE_ENV === 'development') {
      await validateImagePaths();
    }
    
  } catch (error) {
    console.error('Failed to initialize pest and disease database:', error);
    throw error;
  }
};

/**
 * Validate that all referenced image paths exist (development only)
 */
const validateImagePaths = async (): Promise<void> => {
  try {
    const allEntries = await pestDiseaseDataService.getAllEntries();
    const missingImages: string[] = [];
    
    for (const [key, entry] of Object.entries(allEntries)) {
      for (const imagePath of entry.images) {
        try {
          // Try to fetch the image to check if it exists
          const response = await fetch(imagePath, { method: 'HEAD' });
          if (!response.ok) {
            missingImages.push(`${key}: ${imagePath}`);
          }
        } catch {
          missingImages.push(`${key}: ${imagePath}`);
        }
      }
    }
    
    if (missingImages.length > 0) {
      console.warn('Missing reference images:', missingImages);
    } else {
      console.log('All reference images are available');
    }
  } catch (error) {
    console.warn('Could not validate image paths:', error);
  }
};

/**
 * Preload critical pest and disease data for better performance
 */
export const preloadCriticalData = async (): Promise<void> => {
  try {
    // Preload common pests and diseases
    const commonKeys = [
      'aphids',
      'spider_mites',
      'whiteflies',
      'powdery_mildew',
      'late_blight',
      'bacterial_spot'
    ];
    
    const promises = commonKeys.map(key => 
      pestDiseaseDataService.getEntry(key)
    );
    
    await Promise.all(promises);
    console.log('Critical pest and disease data preloaded');
    
  } catch (error) {
    console.warn('Failed to preload critical data:', error);
  }
};

/**
 * Get data loading status for UI components
 */
export const getDataLoadingStatus = () => {
  return {
    isLoaded: pestDiseaseDataService.isDataLoaded(),
    service: pestDiseaseDataService
  };
};