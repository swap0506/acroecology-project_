import { 
  SoilTypesData, 
  SoilType, 
  SoilAdvice, 
  CompatibilityScore,
  validateSoilTypesData,
  isValidSoilType,
  SoilTypeKey 
} from '../types/soilTypes';
import soilTypesData from '../data/soilTypes.json';
import { measureSync } from '../utils/performance';

class SoilTypeService {
  private data: SoilTypesData;
  private isInitialized: boolean = false;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.data = soilTypesData as SoilTypesData;
    this.initialize();
  }

  private initialize(): void {
    try {
      if (!validateSoilTypesData(this.data)) {
        throw new Error('Invalid soil types data structure');
      }
      this.isInitialized = true;
      console.log('Soil types data loaded successfully');
    } catch (error) {
      console.error('Failed to initialize soil types data:', error);
      this.isInitialized = false;
    }
  }

  /**
   * Get all available soil types
   */
  getAllSoilTypes(): Record<string, SoilType> {
    if (!this.isInitialized) {
      throw new Error('Soil types data not properly initialized');
    }
    return this.data.soil_types;
  }

  /**
   * Get a specific soil type by key (cached)
   */
  getSoilType(soilTypeKey: string): SoilType | null {
    const cacheKey = `soil_type_${soilTypeKey}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = measureSync('getSoilType', () => {
      if (!this.isInitialized || !isValidSoilType(soilTypeKey)) {
        return null;
      }
      return this.data.soil_types[soilTypeKey] || null;
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Get soil-crop compatibility score (cached)
   */
  getCompatibilityScore(cropName: string, soilTypeKey: string): CompatibilityScore | null {
    const cacheKey = `compatibility_${cropName.toLowerCase()}_${soilTypeKey}`;
    
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const result = measureSync('getCompatibilityScore', () => {
      if (!this.isInitialized || !isValidSoilType(soilTypeKey)) {
        return null;
      }

      const cropLower = cropName.toLowerCase();
      const compatibility = this.data.compatibility_matrix[cropLower];
      
      if (!compatibility || !compatibility[soilTypeKey]) {
        // Return default compatibility if not found in matrix
        return {
          score: 0.5,
          warnings: ['Compatibility data not available for this crop-soil combination']
        };
      }

      return compatibility[soilTypeKey];
    });

    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Generate comprehensive soil advice for a crop-soil combination
   */
  generateSoilAdvice(cropName: string, soilTypeKey: string): SoilAdvice | null {
    if (!this.isInitialized || !isValidSoilType(soilTypeKey)) {
      return null;
    }

    const soilType = this.getSoilType(soilTypeKey);
    const compatibility = this.getCompatibilityScore(cropName, soilTypeKey);

    if (!soilType || !compatibility) {
      return null;
    }

    // Generate variety recommendations based on soil type
    const varietyRecommendations = this.generateVarietyRecommendations(cropName, soilTypeKey);

    return {
      compatibility_score: compatibility.score,
      amendments: soilType.amendments,
      irrigation_tips: soilType.irrigation_guidance,
      warnings: compatibility.warnings,
      variety_recommendations: varietyRecommendations
    };
  }

  /**
   * Generate variety recommendations based on crop and soil type
   */
  private generateVarietyRecommendations(cropName: string, soilTypeKey: string): string[] {
    const cropLower = cropName.toLowerCase();
    const recommendations: Record<string, Record<string, string[]>> = {
      'wheat': {
        'sandy': ['Drought-resistant varieties', 'Early maturing cultivars'],
        'clay': ['Varieties with strong root systems', 'Disease-resistant cultivars'],
        'loamy': ['High-yield varieties', 'Standard cultivars work well'],
        'silty': ['Varieties resistant to lodging', 'Medium-season cultivars'],
        'peaty': ['Acid-tolerant varieties', 'Varieties suited to organic soils'],
        'chalky': ['Alkaline-tolerant varieties', 'Drought-resistant cultivars']
      },
      'tomatoes': {
        'sandy': ['Determinate varieties for easier management', 'Heat-tolerant cultivars'],
        'clay': ['Disease-resistant varieties', 'Varieties with strong root systems'],
        'loamy': ['Indeterminate varieties for maximum yield', 'Heirloom varieties'],
        'silty': ['Varieties with good root development', 'Medium-season cultivars'],
        'peaty': ['Varieties tolerant of acidic conditions', 'Compact root system varieties'],
        'chalky': ['Alkaline-tolerant varieties', 'Varieties with efficient nutrient uptake']
      },
      'potatoes': {
        'sandy': ['Early varieties', 'Varieties with good skin set'],
        'clay': ['Not recommended - consider raised beds', 'Very early varieties only'],
        'loamy': ['Main crop varieties', 'Storage varieties'],
        'silty': ['Scab-resistant varieties', 'Medium-season cultivars'],
        'peaty': ['Varieties suited to organic soils', 'Acid-tolerant cultivars'],
        'chalky': ['Scab-resistant essential', 'Early varieties only']
      }
    };

    return recommendations[cropLower]?.[soilTypeKey] || [
      'Consult local agricultural extension for variety recommendations',
      'Choose varieties adapted to your local climate'
    ];
  }

  /**
   * Get suitable crops for a specific soil type
   */
  getSuitableCrops(soilTypeKey: string): string[] {
    const soilType = this.getSoilType(soilTypeKey);
    return soilType ? soilType.suitable_crops : [];
  }

  /**
   * Check if the service is properly initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Get soil type characteristics for display
   */
  getSoilCharacteristics(soilTypeKey: string): string[] {
    const soilType = this.getSoilType(soilTypeKey);
    return soilType ? soilType.characteristics : [];
  }
}

// Export singleton instance
export const soilTypeService = new SoilTypeService();
export default soilTypeService;