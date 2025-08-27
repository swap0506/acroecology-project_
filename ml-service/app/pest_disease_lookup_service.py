"""
Pest and Disease Database Lookup Service

This service provides comprehensive database lookup functionality for pest and disease
identification, including matching logic, treatment recommendations, and expert resources.
"""

import json
import re
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Set
from dataclasses import dataclass
from difflib import SequenceMatcher
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class MatchResult:
    """Represents a database match result with confidence scoring."""
    key: str
    entry: Dict
    confidence: float
    match_type: str  # "exact", "fuzzy", "scientific", "symptom", "alternative"
    match_details: str

@dataclass
class TreatmentRecommendation:
    """Enhanced treatment recommendation with priority and effectiveness."""
    method: str
    treatment: str
    application: str
    timing: str
    safety_notes: str
    priority: int  # 1=high, 2=medium, 3=low
    effectiveness: float  # 0.0-1.0

@dataclass
class ExpertResource:
    """Expert resource with contact information and specialization."""
    name: str
    contact: str
    type: str
    location: Optional[str] = None
    specialization: Optional[str] = None
    availability: Optional[str] = None

class PestDiseaseLookupService:
    """
    Comprehensive pest and disease database lookup service.
    
    Provides advanced matching, filtering, and recommendation generation
    based on confidence levels and user requirements.
    """
    
    def __init__(self):
        """Initialize the lookup service."""
        self.app_dir = Path(__file__).resolve().parent
        self.database = self._load_database()
        self.expert_resources = self._load_expert_resources()
        
        # Confidence thresholds for filtering
        self.confidence_thresholds = {
            "high": 0.8,
            "medium": 0.6,
            "low": 0.4
        }
              
  
    def _load_database(self) -> Dict:
        """Load the pest and disease database."""
        try:
            database_path = self.app_dir / "pestsAndDiseases.json"
            with open(database_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                # Handle both database structures
                if "pests_diseases" in data:
                    # Combined structure - count by category
                    pest_count = sum(1 for entry in data["pests_diseases"].values() 
                                   if entry.get("category") == "pest")
                    disease_count = sum(1 for entry in data["pests_diseases"].values() 
                                      if entry.get("category") == "disease")
                    total_count = len(data["pests_diseases"])
                    logger.info(f"Loaded database with {total_count} entries ({pest_count} pests, {disease_count} diseases)")
                else:
                    # Separate structure
                    pest_count = len(data.get('pests', {}))
                    disease_count = len(data.get('diseases', {}))
                    logger.info(f"Loaded database with {pest_count} pests and {disease_count} diseases")
                
                return data
        except FileNotFoundError:
            logger.error(f"Database file not found at {database_path}")
            return {"pests": {}, "diseases": {}}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing database JSON: {e}")
            return {"pests": {}, "diseases": {}}
    
    def _load_expert_resources(self) -> List[ExpertResource]:
        """Load expert resources from database or configuration."""
        # For now, return sample expert resources
        # In production, this would load from a separate configuration file
        return [
            ExpertResource(
                name="Agricultural Extension Office",
                contact="1-800-ASK-FARM",
                type="government",
                location="Local",
                specialization="General crop management",
                availability="Business hours"
            ),
            ExpertResource(
                name="Plant Disease Clinic",
                contact="university-clinic@example.edu",
                type="academic",
                location="State University",
                specialization="Disease diagnosis",
                availability="By appointment"
            ),
            ExpertResource(
                name="Integrated Pest Management Specialist",
                contact="ipm-expert@example.com",
                type="consultant",
                specialization="Sustainable pest control",
                availability="On-call"
            )
        ]
    
    def search_by_name(self, query: str, category: Optional[str] = None, 
                      min_confidence: float = 0.4) -> List[MatchResult]:
        """
        Search for pests or diseases by name with fuzzy matching.
        
        Args:
            query: Search query (common name, scientific name, or alternative name)
            category: Optional category filter ("pests" or "diseases")
            min_confidence: Minimum confidence threshold for results
            
        Returns:
            List of MatchResult objects sorted by confidence
        """
        results = []
        query_lower = query.lower().strip()
        
        # Handle both database structures: separate pests/diseases or combined pests_diseases
        if "pests_diseases" in self.database:
            # Combined structure - search all entries
            for key, entry in self.database["pests_diseases"].items():
                # Filter by category if specified
                if category and entry.get("category") != category.rstrip("s"):  # "pests" -> "pest"
                    continue
                
                # Check exact matches first
                if self._is_exact_match(query_lower, entry):
                    results.append(MatchResult(
                        key=key,
                        entry=entry,
                        confidence=1.0,
                        match_type="exact",
                        match_details=f"Exact match found for {entry.get('category', 'unknown')}"
                    ))
                    continue
                
                # Check fuzzy matches
                fuzzy_result = self._calculate_fuzzy_match(query_lower, entry)
                if fuzzy_result and fuzzy_result.confidence >= min_confidence:
                    fuzzy_result.key = key
                    fuzzy_result.entry = entry
                    results.append(fuzzy_result)
        else:
            # Separate structure - search specified categories
            categories = [category] if category else ["pests", "diseases"]
            
            for cat in categories:
                if cat not in self.database:
                    continue
                    
                for key, entry in self.database[cat].items():
                    # Check exact matches first
                    if self._is_exact_match(query_lower, entry):
                        results.append(MatchResult(
                            key=key,
                            entry=entry,
                            confidence=1.0,
                            match_type="exact",
                            match_details=f"Exact match found in {cat}"
                        ))
                        continue
                    
                    # Check fuzzy matches
                    fuzzy_result = self._calculate_fuzzy_match(query_lower, entry)
                    if fuzzy_result and fuzzy_result.confidence >= min_confidence:
                        fuzzy_result.key = key
                        fuzzy_result.entry = entry
                        results.append(fuzzy_result)
        
        # Sort by confidence (descending) and return
        results.sort(key=lambda x: x.confidence, reverse=True)
        return results
    
    def search_by_symptoms(self, symptoms: List[str], crop_type: Optional[str] = None,
                          min_confidence: float = 0.3) -> List[MatchResult]:
        """
        Search for pests or diseases by symptoms.
        
        Args:
            symptoms: List of observed symptoms
            crop_type: Optional crop type filter
            min_confidence: Minimum confidence threshold
            
        Returns:
            List of MatchResult objects sorted by confidence
        """
        results = []
        symptoms_lower = [s.lower().strip() for s in symptoms]
        
        # Handle both database structures
        if "pests_diseases" in self.database:
            # Combined structure
            for key, entry in self.database["pests_diseases"].items():
                # Filter by crop type if specified
                if crop_type and not self._matches_crop_type(entry, crop_type):
                    continue
                
                # Calculate symptom match confidence
                confidence = self._calculate_symptom_match(symptoms_lower, entry)
                
                if confidence >= min_confidence:
                    results.append(MatchResult(
                        key=key,
                        entry=entry,
                        confidence=confidence,
                        match_type="symptom",
                        match_details=f"Symptom match for {entry.get('category', 'unknown')}"
                    ))
        else:
            # Separate structure
            for category in ["pests", "diseases"]:
                if category not in self.database:
                    continue
                    
                for key, entry in self.database[category].items():
                    # Filter by crop type if specified
                    if crop_type and not self._matches_crop_type(entry, crop_type):
                        continue
                    
                    # Calculate symptom match confidence
                    confidence = self._calculate_symptom_match(symptoms_lower, entry)
                    
                    if confidence >= min_confidence:
                        results.append(MatchResult(
                            key=key,
                            entry=entry,
                            confidence=confidence,
                            match_type="symptom",
                            match_details=f"Symptom match in {category}"
                        ))
        
        results.sort(key=lambda x: x.confidence, reverse=True)
        return results
    
    def get_treatment_recommendations(self, match_result: MatchResult, 
                                   organic_only: bool = False) -> List[TreatmentRecommendation]:
        """
        Get treatment recommendations for a matched pest or disease.
        
        Args:
            match_result: The matched pest/disease result
            organic_only: Whether to return only organic treatments
            
        Returns:
            List of TreatmentRecommendation objects sorted by priority
        """
        treatments = []
        entry = match_result.entry
        
        if "treatments" not in entry:
            return treatments
        
        for i, treatment_data in enumerate(entry["treatments"]):
            # Skip non-organic treatments if organic_only is True
            if organic_only and treatment_data.get("method", "").lower() != "organic":
                continue
            
            # Assign priority based on method if not specified
            priority = treatment_data.get("priority", 2)
            if priority is None:
                if treatment_data.get("method", "").lower() == "organic":
                    priority = 1  # Organic gets high priority
                elif treatment_data.get("method", "").lower() == "cultural":
                    priority = 1  # Cultural practices get high priority
                else:
                    priority = 2  # Default medium priority
            
            # Assign effectiveness if not specified
            effectiveness = treatment_data.get("effectiveness", 0.7)
            if effectiveness is None:
                effectiveness = 0.7  # Default effectiveness
            
            treatment = TreatmentRecommendation(
                method=treatment_data.get("method", "general"),
                treatment=treatment_data.get("treatment", ""),
                application=treatment_data.get("application", ""),
                timing=treatment_data.get("timing", "As needed"),
                safety_notes=treatment_data.get("safety_notes", "Follow label instructions"),
                priority=priority,
                effectiveness=effectiveness
            )
            treatments.append(treatment)
        
        # Sort by priority (1=high priority first) then by effectiveness
        treatments.sort(key=lambda x: (x.priority, -x.effectiveness))
        return treatments
    
    def get_expert_resources(self, specialization: Optional[str] = None) -> List[ExpertResource]:
        """
        Get expert resources, optionally filtered by specialization.
        
        Args:
            specialization: Optional specialization filter
            
        Returns:
            List of ExpertResource objects
        """
        if not specialization:
            return self.expert_resources
        
        spec_lower = specialization.lower()
        return [
            resource for resource in self.expert_resources
            if resource.specialization and spec_lower in resource.specialization.lower()
        ]
    
    def _is_exact_match(self, query: str, entry: Dict) -> bool:
        """Check if query exactly matches any name in the entry."""
        names_to_check = [
            entry.get("name", "").lower(),  # Use "name" field instead of "common_name"
            entry.get("common_name", "").lower(),
            entry.get("scientific_name", "").lower()
        ]
        
        # Add alternative names if they exist
        if "alternative_names" in entry:
            names_to_check.extend([name.lower() for name in entry["alternative_names"]])
        
        # Remove empty strings
        names_to_check = [name for name in names_to_check if name]
        
        return query in names_to_check
    
    def _calculate_fuzzy_match(self, query: str, entry: Dict) -> Optional[MatchResult]:
        """Calculate fuzzy match confidence for a query against an entry."""
        best_confidence = 0.0
        best_match_type = ""
        best_match_details = ""
        
        # Check name field (primary name)
        name = entry.get("name", "").lower()
        if name:
            confidence = SequenceMatcher(None, query, name).ratio()
            if confidence > best_confidence:
                best_confidence = confidence
                best_match_type = "fuzzy"
                best_match_details = f"Fuzzy match with name: {entry.get('name')}"
        
        # Check common name
        common_name = entry.get("common_name", "").lower()
        if common_name:
            confidence = SequenceMatcher(None, query, common_name).ratio()
            if confidence > best_confidence:
                best_confidence = confidence
                best_match_type = "fuzzy"
                best_match_details = f"Fuzzy match with common name: {entry.get('common_name')}"
        
        # Check scientific name
        scientific_name = entry.get("scientific_name", "").lower()
        if scientific_name:
            confidence = SequenceMatcher(None, query, scientific_name).ratio()
            if confidence > best_confidence:
                best_confidence = confidence
                best_match_type = "scientific"
                best_match_details = f"Fuzzy match with scientific name: {entry.get('scientific_name')}"
        
        # Check alternative names
        if "alternative_names" in entry:
            for alt_name in entry["alternative_names"]:
                confidence = SequenceMatcher(None, query, alt_name.lower()).ratio()
                if confidence > best_confidence:
                    best_confidence = confidence
                    best_match_type = "alternative"
                    best_match_details = f"Fuzzy match with alternative name: {alt_name}"
        
        if best_confidence > 0:
            return MatchResult(
                key="",  # Will be set by caller
                entry={},  # Will be set by caller
                confidence=best_confidence,
                match_type=best_match_type,
                match_details=best_match_details
            )
        
        return None
    
    def _calculate_symptom_match(self, symptoms: List[str], entry: Dict) -> float:
        """Calculate confidence based on symptom matching."""
        if "symptoms" not in entry or not entry["symptoms"]:
            return 0.0
        
        entry_symptoms = [s.lower() for s in entry["symptoms"]]
        matched_symptoms = 0
        
        for symptom in symptoms:
            # Check for exact matches
            if symptom in entry_symptoms:
                matched_symptoms += 1
                continue
            
            # Check for partial matches
            for entry_symptom in entry_symptoms:
                if (symptom in entry_symptom or entry_symptom in symptom or
                    SequenceMatcher(None, symptom, entry_symptom).ratio() > 0.7):
                    matched_symptoms += 0.7
                    break
        
        # Calculate confidence as ratio of matched symptoms
        return min(matched_symptoms / len(symptoms), 1.0)
    
    def _matches_crop_type(self, entry: Dict, crop_type: str) -> bool:
        """Check if entry matches the specified crop type."""
        if "affected_crops" not in entry:
            return True  # If no crop restriction, assume it matches
        
        crop_type_lower = crop_type.lower()
        affected_crops = [crop.lower() for crop in entry["affected_crops"]]
        
        return crop_type_lower in affected_crops or "all" in affected_crops
    
    def get_comprehensive_analysis(self, query: str, symptoms: Optional[List[str]] = None,
                                 crop_type: Optional[str] = None) -> Dict:
        """
        Perform comprehensive analysis combining name search and symptom matching.
        
        Args:
            query: Primary search query
            symptoms: Optional list of symptoms
            crop_type: Optional crop type
            
        Returns:
            Dictionary with comprehensive analysis results
        """
        results = {
            "name_matches": [],
            "symptom_matches": [],
            "combined_recommendations": [],
            "expert_resources": [],
            "confidence_summary": {}
        }
        
        # Name-based search
        name_matches = self.search_by_name(query, min_confidence=0.3)
        results["name_matches"] = [self._match_result_to_dict(match) for match in name_matches[:5]]
        
        # Symptom-based search if symptoms provided
        if symptoms:
            symptom_matches = self.search_by_symptoms(symptoms, crop_type, min_confidence=0.2)
            results["symptom_matches"] = [self._match_result_to_dict(match) for match in symptom_matches[:5]]
        
        # Combine and deduplicate results
        all_matches = name_matches + (symptom_matches if symptoms else [])
        unique_matches = self._deduplicate_matches(all_matches)
        
        # Generate treatment recommendations for top matches
        for match in unique_matches[:3]:
            treatments = self.get_treatment_recommendations(match)
            if treatments:
                results["combined_recommendations"].append({
                    "pest_disease": match.key,
                    "confidence": match.confidence,
                    "treatments": [self._treatment_to_dict(t) for t in treatments[:3]]
                })
        
        # Add expert resources
        results["expert_resources"] = [self._expert_to_dict(expert) for expert in self.expert_resources]
        
        # Confidence summary
        if unique_matches:
            results["confidence_summary"] = {
                "highest_confidence": max(match.confidence for match in unique_matches),
                "average_confidence": sum(match.confidence for match in unique_matches) / len(unique_matches),
                "total_matches": len(unique_matches),
                "high_confidence_matches": len([m for m in unique_matches if m.confidence >= 0.8])
            }
        
        return results
    
    def _match_result_to_dict(self, match: MatchResult) -> Dict:
        """Convert MatchResult to dictionary for JSON serialization."""
        return {
            "key": match.key,
            "common_name": match.entry.get("common_name", ""),
            "scientific_name": match.entry.get("scientific_name", ""),
            "confidence": match.confidence,
            "match_type": match.match_type,
            "match_details": match.match_details,
            "description": match.entry.get("description", ""),
            "symptoms": match.entry.get("symptoms", [])
        }
    
    def _treatment_to_dict(self, treatment: TreatmentRecommendation) -> Dict:
        """Convert TreatmentRecommendation to dictionary."""
        return {
            "method": treatment.method,
            "treatment": treatment.treatment,
            "application": treatment.application,
            "timing": treatment.timing,
            "safety_notes": treatment.safety_notes,
            "priority": treatment.priority,
            "effectiveness": treatment.effectiveness
        }
    
    def _expert_to_dict(self, expert: ExpertResource) -> Dict:
        """Convert ExpertResource to dictionary."""
        return {
            "name": expert.name,
            "contact": expert.contact,
            "type": expert.type,
            "location": expert.location,
            "specialization": expert.specialization,
            "availability": expert.availability
        }
    
    def _deduplicate_matches(self, matches: List[MatchResult]) -> List[MatchResult]:
        """Remove duplicate matches, keeping the highest confidence version."""
        seen_keys = set()
        unique_matches = []
        
        # Sort by confidence first
        matches.sort(key=lambda x: x.confidence, reverse=True)
        
        for match in matches:
            if match.key not in seen_keys:
                seen_keys.add(match.key)
                unique_matches.append(match)
        
        return unique_matches


# Create a global instance for use in the main application
lookup_service = PestDiseaseLookupService()