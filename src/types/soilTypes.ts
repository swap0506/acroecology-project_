// Soil Type Data Models and Interfaces

export interface Amendment {
  name: string;
  purpose: string;
  application_rate: string;
  timing: string;
}

export interface IrrigationGuidance {
  frequency: string;
  duration: string;
  method: string;
  special_notes: string;
}

export interface SoilType {
  name: string;
  characteristics: string[];
  water_retention: 'low' | 'medium' | 'high' | 'very_high';
  drainage: 'poor' | 'moderate' | 'good' | 'excellent' | 'variable';
  suitable_crops: string[];
  amendments: Amendment[];
  irrigation_guidance: IrrigationGuidance;
}

export interface CompatibilityScore {
  score: number;
  warnings: string[];
}

export interface CompatibilityMatrix {
  [cropName: string]: {
    [soilType: string]: CompatibilityScore;
  };
}

export interface SoilTypesData {
  soil_types: {
    [key: string]: SoilType;
  };
  compatibility_matrix: CompatibilityMatrix;
}

export interface SoilAdvice {
  compatibility_score: number;
  amendments: Amendment[];
  irrigation_tips: IrrigationGuidance;
  warnings: string[];
  variety_recommendations: string[];
}

// Validation functions
export const validateSoilType = (soilType: any): soilType is SoilType => {
  return (
    typeof soilType === 'object' &&
    typeof soilType.name === 'string' &&
    Array.isArray(soilType.characteristics) &&
    typeof soilType.water_retention === 'string' &&
    typeof soilType.drainage === 'string' &&
    Array.isArray(soilType.suitable_crops) &&
    Array.isArray(soilType.amendments) &&
    typeof soilType.irrigation_guidance === 'object'
  );
};

export const validateSoilTypesData = (data: any): data is SoilTypesData => {
  return (
    typeof data === 'object' &&
    typeof data.soil_types === 'object' &&
    typeof data.compatibility_matrix === 'object' &&
    Object.values(data.soil_types).every(validateSoilType)
  );
};

// Soil type options for UI
export const SOIL_TYPE_OPTIONS = [
  { value: 'sandy', label: 'Sandy' },
  { value: 'clay', label: 'Clay' },
  { value: 'loamy', label: 'Loamy' },
  { value: 'silty', label: 'Silty' },
  { value: 'peaty', label: 'Peaty' },
  { value: 'chalky', label: 'Chalky' }
] as const;

export type SoilTypeKey = typeof SOIL_TYPE_OPTIONS[number]['value'];

// Helper functions
export const getSoilTypeLabel = (key: string): string => {
  const option = SOIL_TYPE_OPTIONS.find(opt => opt.value === key);
  return option ? option.label : key;
};

export const isValidSoilType = (soilType: string): soilType is SoilTypeKey => {
  return SOIL_TYPE_OPTIONS.some(opt => opt.value === soilType);
};