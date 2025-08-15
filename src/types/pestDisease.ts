// Types for pest and disease data structure
export interface TreatmentOption {
  method: 'organic' | 'chemical' | 'cultural';
  treatment: string;
  application: string;
  timing: string;
  safety_notes: string;
}

export interface PestDiseaseEntry {
  name: string;
  scientific_name: string;
  category: 'pest' | 'disease' | 'deficiency';
  description: string;
  symptoms: string[];
  images: string[];
  treatments: TreatmentOption[];
  prevention: string[];
  affected_crops: string[];
}

export interface PestDiseaseDatabase {
  pests_diseases: Record<string, PestDiseaseEntry>;
}

// Validation functions
export const validateTreatmentOption = (treatment: any): treatment is TreatmentOption => {
  return (
    typeof treatment === 'object' &&
    treatment !== null &&
    ['organic', 'chemical', 'cultural'].includes(treatment.method) &&
    typeof treatment.treatment === 'string' &&
    typeof treatment.application === 'string' &&
    typeof treatment.timing === 'string' &&
    typeof treatment.safety_notes === 'string'
  );
};

export const validatePestDiseaseEntry = (entry: any): entry is PestDiseaseEntry => {
  return (
    typeof entry === 'object' &&
    entry !== null &&
    typeof entry.name === 'string' &&
    typeof entry.scientific_name === 'string' &&
    ['pest', 'disease', 'deficiency'].includes(entry.category) &&
    typeof entry.description === 'string' &&
    Array.isArray(entry.symptoms) &&
    entry.symptoms.every((symptom: any) => typeof symptom === 'string') &&
    Array.isArray(entry.images) &&
    entry.images.every((image: any) => typeof image === 'string') &&
    Array.isArray(entry.treatments) &&
    entry.treatments.every(validateTreatmentOption) &&
    Array.isArray(entry.prevention) &&
    entry.prevention.every((prevention: any) => typeof prevention === 'string') &&
    Array.isArray(entry.affected_crops) &&
    entry.affected_crops.every((crop: any) => typeof crop === 'string')
  );
};

export const validatePestDiseaseDatabase = (data: any): data is PestDiseaseDatabase => {
  if (typeof data !== 'object' || data === null || !data.pests_diseases) {
    return false;
  }

  const entries = data.pests_diseases;
  if (typeof entries !== 'object' || entries === null) {
    return false;
  }

  return Object.values(entries).every(validatePestDiseaseEntry);
};

// Error types for validation
export class PestDiseaseValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'PestDiseaseValidationError';
  }
}

// Utility function to validate and throw detailed errors
export const validateAndThrow = (data: any): PestDiseaseDatabase => {
  if (!data) {
    throw new PestDiseaseValidationError('Data is null or undefined');
  }

  if (!data.pests_diseases) {
    throw new PestDiseaseValidationError('Missing pests_diseases field');
  }

  const entries = data.pests_diseases;
  for (const [key, entry] of Object.entries(entries)) {
    if (!validatePestDiseaseEntry(entry)) {
      throw new PestDiseaseValidationError(`Invalid entry structure for ${key}`);
    }
  }

  return data as PestDiseaseDatabase;
};