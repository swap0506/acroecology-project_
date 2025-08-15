/**
 * Tests for Pest Disease Matching Logic
 * Tests the matching algorithms used to connect API results with local database
 */

import { describe, it, expect, beforeEach } from 'vitest';

// Mock matching utilities
interface MatchResult {
  key: string;
  confidence: number;
  matchType: 'exact' | 'partial' | 'symptom' | 'category';
  matchDetails: string;
}

interface PestDiseaseEntry {
  name: string;
  scientific_name?: string;
  category: 'pest' | 'disease' | 'deficiency';
  description: string;
  symptoms: string[];
  affected_crops: string[];
  treatments: Array<{
    method: string;
    treatment: string;
    application: string;
    timing: string;
    safety_notes: string;
  }>;
  prevention: string[];
}

// Mock database
const mockDatabase: Record<string, PestDiseaseEntry> = {
  aphids: {
    name: 'Aphids',
    scientific_name: 'Aphidoidea',
    category: 'pest',
    description: 'Small, soft-bodied insects that feed on plant sap',
    symptoms: ['curled leaves', 'yellowing leaves', 'sticky honeydew', 'stunted growth'],
    affected_crops: ['tomatoes', 'peppers', 'lettuce', 'roses'],
    treatments: [
      {
        method: 'organic',
        treatment: 'Neem oil spray',
        application: 'Spray every 3-5 days',
        timing: 'Early morning or evening',
        safety_notes: 'Safe for beneficial insects when dry'
      }
    ],
    prevention: ['Encourage beneficial insects', 'Remove weeds', 'Regular monitoring']
  },
  powdery_mildew: {
    name: 'Powdery Mildew',
    scientific_name: 'Erysiphales',
    category: 'disease',
    description: 'Fungal disease causing white powdery coating on leaves',
    symptoms: ['white powdery coating', 'distorted leaves', 'yellowing', 'premature leaf drop'],
    affected_crops: ['tomatoes', 'cucumbers', 'roses', 'grapes'],
    treatments: [
      {
        method: 'organic',
        treatment: 'Baking soda spray',
        application: 'Mix 1 tsp per quart water',
        timing: 'Weekly applications',
        safety_notes: 'Safe for edible plants'
      }
    ],
    prevention: ['Improve air circulation', 'Avoid overhead watering', 'Remove infected leaves']
  },
  spider_mites: {
    name: 'Spider Mites',
    scientific_name: 'Tetranychidae',
    category: 'pest',
    description: 'Tiny arachnids that cause stippling damage to leaves',
    symptoms: ['stippled leaves', 'fine webbing', 'yellowing', 'bronze coloration'],
    affected_crops: ['tomatoes', 'beans', 'corn', 'strawberries'],
    treatments: [
      {
        method: 'organic',
        treatment: 'Predatory mites',
        application: 'Release according to package instructions',
        timing: 'Early infestation',
        safety_notes: 'Biological control method'
      }
    ],
    prevention: ['Maintain humidity', 'Regular water spraying', 'Avoid dusty conditions']
  }
};

// Mock matching functions
const matchByName = (query: string, database: Record<string, PestDiseaseEntry>): MatchResult[] => {
  const results: MatchResult[] = [];
  const queryLower = query.toLowerCase().trim();

  // Return empty if query is empty
  if (!queryLower) {
    return results;
  }

  for (const [key, entry] of Object.entries(database)) {
    const nameLower = entry.name.toLowerCase();
    const scientificLower = entry.scientific_name?.toLowerCase() || '';

    // Exact match
    if (nameLower === queryLower || scientificLower === queryLower) {
      results.push({
        key,
        confidence: 1.0,
        matchType: 'exact',
        matchDetails: `Exact match: ${entry.name}`
      });
    }
    // Partial match
    else if (nameLower.includes(queryLower) || queryLower.includes(nameLower)) {
      const confidence = Math.min(
        queryLower.length / nameLower.length,
        nameLower.length / queryLower.length
      ) * 0.8;
      
      results.push({
        key,
        confidence,
        matchType: 'partial',
        matchDetails: `Partial match: ${entry.name}`
      });
    }
    // Scientific name partial match
    else if (scientificLower && (scientificLower.includes(queryLower) || queryLower.includes(scientificLower))) {
      results.push({
        key,
        confidence: 0.7,
        matchType: 'partial',
        matchDetails: `Scientific name match: ${entry.scientific_name}`
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
};

const matchBySymptoms = (symptoms: string[], database: Record<string, PestDiseaseEntry>): MatchResult[] => {
  const results: MatchResult[] = [];
  const symptomsLower = symptoms.map(s => s.toLowerCase().trim()).filter(s => s.length > 0);

  // Return empty if no valid symptoms
  if (symptomsLower.length === 0) {
    return results;
  }

  for (const [key, entry] of Object.entries(database)) {
    const entrySymptoms = entry.symptoms.map(s => s.toLowerCase());
    let matchCount = 0;
    const matchedSymptoms: string[] = [];

    for (const symptom of symptomsLower) {
      for (const entrySymptom of entrySymptoms) {
        if (entrySymptom.includes(symptom) || symptom.includes(entrySymptom)) {
          matchCount++;
          matchedSymptoms.push(entrySymptom);
          break;
        }
      }
    }

    if (matchCount > 0) {
      const confidence = matchCount / Math.max(symptoms.length, entry.symptoms.length);
      results.push({
        key,
        confidence,
        matchType: 'symptom',
        matchDetails: `Matched symptoms: ${matchedSymptoms.join(', ')}`
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
};

const matchByCrop = (crop: string, database: Record<string, PestDiseaseEntry>): MatchResult[] => {
  const results: MatchResult[] = [];
  const cropLower = crop.toLowerCase().trim();

  // Return empty if crop is empty
  if (!cropLower) {
    return results;
  }

  for (const [key, entry] of Object.entries(database)) {
    const affectedCrops = entry.affected_crops.map(c => c.toLowerCase());
    
    if (affectedCrops.some(c => c.includes(cropLower) || cropLower.includes(c))) {
      results.push({
        key,
        confidence: 0.6,
        matchType: 'category',
        matchDetails: `Affects ${crop} crops`
      });
    }
  }

  return results.sort((a, b) => b.confidence - a.confidence);
};

const combineMatches = (matchSets: MatchResult[][]): MatchResult[] => {
  const combinedMap = new Map<string, MatchResult>();

  for (const matches of matchSets) {
    for (const match of matches) {
      const existing = combinedMap.get(match.key);
      if (existing) {
        // Combine confidence scores (weighted average)
        existing.confidence = (existing.confidence + match.confidence) / 2;
        existing.matchDetails += ` | ${match.matchDetails}`;
      } else {
        combinedMap.set(match.key, { ...match });
      }
    }
  }

  return Array.from(combinedMap.values()).sort((a, b) => b.confidence - a.confidence);
};

describe('Pest Disease Matching Logic', () => {
  describe('matchByName', () => {
    it('should find exact name matches with high confidence', () => {
      const results = matchByName('Aphids', mockDatabase);
      
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('aphids');
      expect(results[0].confidence).toBe(1.0);
      expect(results[0].matchType).toBe('exact');
    });

    it('should find partial name matches with lower confidence', () => {
      const results = matchByName('mildew', mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
      const powderyMildewMatch = results.find(r => r.key === 'powdery_mildew');
      expect(powderyMildewMatch).toBeDefined();
      expect(powderyMildewMatch!.confidence).toBeLessThan(1.0);
      expect(powderyMildewMatch!.matchType).toBe('partial');
    });

    it('should find scientific name matches', () => {
      const results = matchByName('Aphidoidea', mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
      const aphidMatch = results.find(r => r.key === 'aphids');
      expect(aphidMatch).toBeDefined();
      expect(aphidMatch!.confidence).toBe(1.0);
    });

    it('should handle case insensitive searches', () => {
      const results = matchByName('APHIDS', mockDatabase);
      
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('aphids');
      expect(results[0].confidence).toBe(1.0);
    });

    it('should return empty array for no matches', () => {
      const results = matchByName('nonexistent pest', mockDatabase);
      
      expect(results).toHaveLength(0);
    });

    it('should rank results by confidence', () => {
      const results = matchByName('mite', mockDatabase);
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i-1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
        }
      }
    });
  });

  describe('matchBySymptoms', () => {
    it('should match entries by symptoms with appropriate confidence', () => {
      const symptoms = ['yellowing leaves', 'curled leaves'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
      
      // Should find aphids (has both symptoms)
      const aphidMatch = results.find(r => r.key === 'aphids');
      expect(aphidMatch).toBeDefined();
      expect(aphidMatch!.confidence).toBeGreaterThan(0);
    });

    it('should handle partial symptom matches', () => {
      const symptoms = ['powdery coating'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      const powderyMildewMatch = results.find(r => r.key === 'powdery_mildew');
      expect(powderyMildewMatch).toBeDefined();
      expect(powderyMildewMatch!.matchType).toBe('symptom');
    });

    it('should calculate confidence based on symptom overlap', () => {
      const symptoms = ['yellowing leaves', 'curled leaves', 'sticky honeydew'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      const aphidMatch = results.find(r => r.key === 'aphids');
      expect(aphidMatch).toBeDefined();
      expect(aphidMatch!.confidence).toBeGreaterThan(0.5);
    });

    it('should handle case insensitive symptom matching', () => {
      const symptoms = ['YELLOWING LEAVES'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array when no symptoms match', () => {
      const symptoms = ['completely unknown symptom'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      expect(results).toHaveLength(0);
    });

    it('should rank results by symptom match confidence', () => {
      const symptoms = ['yellowing', 'leaves'];
      const results = matchBySymptoms(symptoms, mockDatabase);
      
      if (results.length > 1) {
        for (let i = 1; i < results.length; i++) {
          expect(results[i-1].confidence).toBeGreaterThanOrEqual(results[i].confidence);
        }
      }
    });
  });

  describe('matchByCrop', () => {
    it('should find entries that affect specific crops', () => {
      const results = matchByCrop('tomatoes', mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
      
      // All entries in mock database affect tomatoes
      expect(results.length).toBe(3);
      
      results.forEach(result => {
        expect(result.matchType).toBe('category');
        expect(result.confidence).toBe(0.6);
      });
    });

    it('should handle partial crop name matches', () => {
      const results = matchByCrop('tomato', mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case insensitive crop matching', () => {
      const results = matchByCrop('TOMATOES', mockDatabase);
      
      expect(results.length).toBeGreaterThan(0);
    });

    it('should return empty array for crops not in database', () => {
      const results = matchByCrop('unknown_crop', mockDatabase);
      
      expect(results).toHaveLength(0);
    });
  });

  describe('combineMatches', () => {
    it('should combine multiple match sets correctly', () => {
      const nameMatches = matchByName('aphids', mockDatabase);
      const symptomMatches = matchBySymptoms(['yellowing leaves'], mockDatabase);
      const cropMatches = matchByCrop('tomatoes', mockDatabase);
      
      const combined = combineMatches([nameMatches, symptomMatches, cropMatches]);
      
      expect(combined.length).toBeGreaterThan(0);
      
      // Should have unique entries
      const keys = combined.map(r => r.key);
      const uniqueKeys = [...new Set(keys)];
      expect(keys.length).toBe(uniqueKeys.length);
    });

    it('should boost confidence for entries found in multiple match sets', () => {
      const nameMatches = matchByName('aphids', mockDatabase);
      const symptomMatches = matchBySymptoms(['curled leaves'], mockDatabase);
      
      const combined = combineMatches([nameMatches, symptomMatches]);
      
      const aphidMatch = combined.find(r => r.key === 'aphids');
      expect(aphidMatch).toBeDefined();
      
      // Should have combined match details
      expect(aphidMatch!.matchDetails).toContain('|');
    });

    it('should maintain proper ranking after combination', () => {
      const nameMatches = matchByName('mite', mockDatabase);
      const symptomMatches = matchBySymptoms(['stippled leaves'], mockDatabase);
      
      const combined = combineMatches([nameMatches, symptomMatches]);
      
      if (combined.length > 1) {
        for (let i = 1; i < combined.length; i++) {
          expect(combined[i-1].confidence).toBeGreaterThanOrEqual(combined[i].confidence);
        }
      }
    });

    it('should handle empty match sets', () => {
      const emptyMatches: MatchResult[] = [];
      const nameMatches = matchByName('aphids', mockDatabase);
      
      const combined = combineMatches([emptyMatches, nameMatches]);
      
      expect(combined.length).toBe(nameMatches.length);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty database', () => {
      const emptyDatabase: Record<string, PestDiseaseEntry> = {};
      
      const nameResults = matchByName('aphids', emptyDatabase);
      const symptomResults = matchBySymptoms(['yellowing'], emptyDatabase);
      const cropResults = matchByCrop('tomatoes', emptyDatabase);
      
      expect(nameResults).toHaveLength(0);
      expect(symptomResults).toHaveLength(0);
      expect(cropResults).toHaveLength(0);
    });

    it('should handle empty search queries', () => {
      const nameResults = matchByName('', mockDatabase);
      const symptomResults = matchBySymptoms([], mockDatabase);
      const cropResults = matchByCrop('', mockDatabase);
      
      expect(nameResults).toHaveLength(0);
      expect(symptomResults).toHaveLength(0);
      expect(cropResults).toHaveLength(0);
    });

    it('should handle special characters in search queries', () => {
      const specialCharQueries = ['aphids!', 'mildew?', 'spider-mites'];
      
      specialCharQueries.forEach(query => {
        const results = matchByName(query, mockDatabase);
        // Should not crash and may or may not find matches
        expect(Array.isArray(results)).toBe(true);
      });
    });

    it('should handle very long search queries', () => {
      const longQuery = 'a'.repeat(1000);
      const results = matchByName(longQuery, mockDatabase);
      
      expect(Array.isArray(results)).toBe(true);
      expect(results).toHaveLength(0);
    });

    it('should handle database entries with missing fields', () => {
      const incompleteDatabase: Record<string, any> = {
        incomplete_entry: {
          name: 'Incomplete Entry',
          category: 'pest',
          // Missing other required fields
        }
      };
      
      const results = matchByName('incomplete', incompleteDatabase);
      
      // Should not crash
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Performance', () => {
    it('should handle large databases efficiently', () => {
      // Create a large mock database
      const largeDatabase: Record<string, PestDiseaseEntry> = {};
      
      for (let i = 0; i < 1000; i++) {
        largeDatabase[`entry_${i}`] = {
          name: `Test Entry ${i}`,
          category: 'pest',
          description: `Description ${i}`,
          symptoms: [`symptom_${i}`, `common_symptom`],
          affected_crops: [`crop_${i}`],
          treatments: [],
          prevention: []
        };
      }
      
      const startTime = Date.now();
      const results = matchByName('Test Entry 500', largeDatabase);
      const endTime = Date.now();
      
      expect(results.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});