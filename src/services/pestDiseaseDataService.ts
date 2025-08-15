import { 
  PestDiseaseDatabase, 
  PestDiseaseEntry, 
  validateAndThrow,
  PestDiseaseValidationError 
} from '../types/pestDisease';

/**
 * Service for loading and managing pest and disease data
 */
export class PestDiseaseDataService {
  private static instance: PestDiseaseDataService;
  private database: PestDiseaseDatabase | null = null;
  private loadingPromise: Promise<PestDiseaseDatabase> | null = null;

  private constructor() {}

  /**
   * Get singleton instance of the service
   */
  public static getInstance(): PestDiseaseDataService {
    if (!PestDiseaseDataService.instance) {
      PestDiseaseDataService.instance = new PestDiseaseDataService();
    }
    return PestDiseaseDataService.instance;
  }

  /**
   * Load pest and disease data from JSON file
   */
  public async loadData(): Promise<PestDiseaseDatabase> {
    // Return cached data if already loaded
    if (this.database) {
      return this.database;
    }

    // Return existing loading promise if already in progress
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Start loading data
    this.loadingPromise = this.fetchAndValidateData();
    
    try {
      this.database = await this.loadingPromise;
      return this.database;
    } catch (error) {
      this.loadingPromise = null; // Reset on error to allow retry
      throw error;
    }
  }

  /**
   * Fetch and validate data from the JSON file
   */
  private async fetchAndValidateData(): Promise<PestDiseaseDatabase> {
    try {
      const response = await fetch('/src/data/pestsAndDiseases.json');
      
      if (!response.ok) {
        throw new Error(`Failed to load pest and disease data: ${response.status} ${response.statusText}`);
      }

      const rawData = await response.json();
      
      // Validate the data structure
      const validatedData = validateAndThrow(rawData);
      
      console.log(`Loaded ${Object.keys(validatedData.pests_diseases).length} pest and disease entries`);
      
      return validatedData;
    } catch (error) {
      if (error instanceof PestDiseaseValidationError) {
        console.error('Pest and disease data validation failed:', error.message);
        throw new Error(`Invalid pest and disease data format: ${error.message}`);
      }
      
      console.error('Failed to load pest and disease data:', error);
      throw new Error('Failed to load pest and disease database');
    }
  }

  /**
   * Get all pest and disease entries
   */
  public async getAllEntries(): Promise<Record<string, PestDiseaseEntry>> {
    const data = await this.loadData();
    return data.pests_diseases;
  }

  /**
   * Get a specific pest or disease entry by key
   */
  public async getEntry(key: string): Promise<PestDiseaseEntry | null> {
    const data = await this.loadData();
    return data.pests_diseases[key] || null;
  }

  /**
   * Search entries by category
   */
  public async getEntriesByCategory(category: 'pest' | 'disease' | 'deficiency'): Promise<Record<string, PestDiseaseEntry>> {
    const allEntries = await this.getAllEntries();
    const filtered: Record<string, PestDiseaseEntry> = {};
    
    for (const [key, entry] of Object.entries(allEntries)) {
      if (entry.category === category) {
        filtered[key] = entry;
      }
    }
    
    return filtered;
  }

  /**
   * Search entries by affected crop
   */
  public async getEntriesByCrop(crop: string): Promise<Record<string, PestDiseaseEntry>> {
    const allEntries = await this.getAllEntries();
    const filtered: Record<string, PestDiseaseEntry> = {};
    
    for (const [key, entry] of Object.entries(allEntries)) {
      if (entry.affected_crops.includes(crop.toLowerCase())) {
        filtered[key] = entry;
      }
    }
    
    return filtered;
  }

  /**
   * Search entries by symptoms (fuzzy matching)
   */
  public async searchBySymptoms(searchTerms: string[]): Promise<Record<string, PestDiseaseEntry>> {
    const allEntries = await this.getAllEntries();
    const filtered: Record<string, PestDiseaseEntry> = {};
    
    const normalizedSearchTerms = searchTerms.map(term => term.toLowerCase());
    
    for (const [key, entry] of Object.entries(allEntries)) {
      const entrySymptoms = entry.symptoms.join(' ').toLowerCase();
      const entryDescription = entry.description.toLowerCase();
      const searchText = `${entrySymptoms} ${entryDescription}`;
      
      const hasMatch = normalizedSearchTerms.some(term => 
        searchText.includes(term)
      );
      
      if (hasMatch) {
        filtered[key] = entry;
      }
    }
    
    return filtered;
  }

  /**
   * Get all unique affected crops
   */
  public async getAllAffectedCrops(): Promise<string[]> {
    const allEntries = await this.getAllEntries();
    const crops = new Set<string>();
    
    for (const entry of Object.values(allEntries)) {
      entry.affected_crops.forEach(crop => crops.add(crop));
    }
    
    return Array.from(crops).sort();
  }

  /**
   * Get statistics about the database
   */
  public async getDatabaseStats(): Promise<{
    totalEntries: number;
    pestCount: number;
    diseaseCount: number;
    deficiencyCount: number;
    totalCrops: number;
    totalImages: number;
  }> {
    const allEntries = await this.getAllEntries();
    const entries = Object.values(allEntries);
    
    const pestCount = entries.filter(e => e.category === 'pest').length;
    const diseaseCount = entries.filter(e => e.category === 'disease').length;
    const deficiencyCount = entries.filter(e => e.category === 'deficiency').length;
    
    const allCrops = await this.getAllAffectedCrops();
    const totalImages = entries.reduce((sum, entry) => sum + entry.images.length, 0);
    
    return {
      totalEntries: entries.length,
      pestCount,
      diseaseCount,
      deficiencyCount,
      totalCrops: allCrops.length,
      totalImages
    };
  }

  /**
   * Reload data (useful for development or data updates)
   */
  public async reloadData(): Promise<PestDiseaseDatabase> {
    this.database = null;
    this.loadingPromise = null;
    return this.loadData();
  }

  /**
   * Check if data is loaded
   */
  public isDataLoaded(): boolean {
    return this.database !== null;
  }
}

// Export singleton instance
export const pestDiseaseDataService = PestDiseaseDataService.getInstance();