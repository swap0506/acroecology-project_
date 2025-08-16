"""
Disease identification service that integrates Plant.id API with local pest/disease database.

This service handles the complete flow of disease identification, from API calls
to matching results with local treatment data and generating recommendations.
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Optional, Tuple
import logging
from dataclasses import dataclass

from .plant_id_client import PlantIdClient, FallbackApiClient, PlantIdApiError, create_plant_id_client, create_fallback_client
from .pest_disease_lookup_service import lookup_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class IdentificationMatch:
    """Represents a matched pest/disease identification result."""
    name: str
    scientific_name: Optional[str]
    confidence: float
    category: str
    description: str
    symptoms: List[str]
    images: List[str]

@dataclass
class TreatmentRecommendation:
    """Represents a treatment recommendation."""
    method: str
    treatment: str
    application: str
    timing: str
    safety_notes: str

@dataclass
class ExpertResource:
    """Represents an expert resource for consultation."""
    name: str
    contact: str
    type: str
    location: Optional[str] = None

class DiseaseIdentificationService:
    """
    Service for identifying plant diseases and providing treatment recommendations.
    
    This service integrates the Plant.id API with local pest/disease data to provide
    comprehensive identification results and treatment recommendations.
    """
    
    def __init__(self):
        """Initialize the disease identification service."""
        self.app_dir = Path(__file__).resolve().parent
        self.pest_disease_data = self._load_pest_disease_data()
        
        # Initialize API clients
        self.primary_client = None
        self.fallback_client = create_fallback_client()
        
        # Try to initialize Plant.id client
        try:
            self.primary_client = create_plant_id_client()
            logger.info("Plant.id API client initialized successfully")
        except ValueError as e:
            logger.warning(f"Plant.id API client not available: {e}")
    
    def _load_pest_disease_data(self) -> Dict:
        """
        Load local pest and disease database.
        
        Returns:
            Dictionary containing pest and disease data
        """
        # Try to load from the frontend data directory first
        frontend_data_path = self.app_dir.parent.parent / "src" / "data" / "pestsAndDiseases.json"
        local_data_path = self.app_dir / "pestsAndDiseases.json"
        
        for data_path in [frontend_data_path, local_data_path]:
            if data_path.exists():
                try:
                    with open(data_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        logger.info(f"Loaded pest/disease data from {data_path}")
                        return data
                except Exception as e:
                    logger.warning(f"Failed to load pest/disease data from {data_path}: {e}")
        
        logger.warning("No pest/disease data file found. Using empty dataset.")
        return {"pests_diseases": {}}
    
    def _normalize_name(self, name: str) -> str:
        """
        Normalize a name for matching purposes.
        
        Args:
            name: Original name string
            
        Returns:
            Normalized name string
        """
        return name.lower().strip().replace(" ", "_").replace("-", "_")
    
    def _find_local_match(self, api_name: str, scientific_name: str = None) -> Optional[Dict]:
        """
        Find a matching entry in the local pest/disease database using the lookup service.
        
        Args:
            api_name: Name returned from API
            scientific_name: Scientific name if available
            
        Returns:
            Matching local database entry or None
        """
        try:
            # Use the lookup service for better matching
            matches = lookup_service.search_by_name(api_name, min_confidence=0.6)
            
            if matches:
                # Return the best match entry
                best_match = matches[0]
                logger.info(f"Found local match for '{api_name}': {best_match.key} (confidence: {best_match.confidence})")
                return best_match.entry
            
            # If no good name match, try scientific name if available
            if scientific_name:
                matches = lookup_service.search_by_name(scientific_name, min_confidence=0.7)
                if matches:
                    best_match = matches[0]
                    logger.info(f"Found local match for scientific name '{scientific_name}': {best_match.key} (confidence: {best_match.confidence})")
                    return best_match.entry
            
            logger.info(f"No local match found for '{api_name}'")
            return None
            
        except Exception as e:
            logger.error(f"Error finding local match: {e}")
            return None
    
    def _extract_treatments_from_local_data(self, match_result) -> List[TreatmentRecommendation]:
        """
        Extract treatment recommendations using the lookup service.
        
        Args:
            match_result: MatchResult from lookup service or local entry dict
            
        Returns:
            List of treatment recommendations
        """
        treatments = []
        
        try:
            # If it's a MatchResult from lookup service, use it directly
            if hasattr(match_result, 'entry'):
                lookup_treatments = lookup_service.get_treatment_recommendations(match_result)
                for lookup_treatment in lookup_treatments:
                    treatment = TreatmentRecommendation(
                        method=lookup_treatment.method,
                        treatment=lookup_treatment.treatment,
                        application=lookup_treatment.application,
                        timing=lookup_treatment.timing,
                        safety_notes=lookup_treatment.safety_notes
                    )
                    treatments.append(treatment)
            else:
                # Fallback to direct entry parsing for backward compatibility
                local_entry = match_result
                if "treatments" in local_entry:
                    for treatment_data in local_entry["treatments"]:
                        try:
                            treatment = TreatmentRecommendation(
                                method=treatment_data.get("method", "general"),
                                treatment=treatment_data.get("treatment", ""),
                                application=treatment_data.get("application", ""),
                                timing=treatment_data.get("timing", ""),
                                safety_notes=treatment_data.get("safety_notes", "")
                            )
                            treatments.append(treatment)
                        except Exception as e:
                            logger.warning(f"Failed to parse treatment data: {e}")
        
        except Exception as e:
            logger.error(f"Error extracting treatments: {e}")
        
        return treatments
    
    def _extract_prevention_tips(self, local_entry: Dict) -> List[str]:
        """
        Extract prevention tips from local database entry.
        
        Args:
            local_entry: Local database entry
            
        Returns:
            List of prevention tips
        """
        return local_entry.get("prevention", [])
    
    def _parse_plant_id_suggestions(self, suggestions: List[Dict]) -> List[IdentificationMatch]:
        """
        Parse Plant.id API suggestions into standardized format.
        
        Args:
            suggestions: Raw suggestions from Plant.id API
            
        Returns:
            List of identification matches
        """
        matches = []
        
        for suggestion in suggestions[:3]:  # Limit to top 3 suggestions
            try:
                # Handle disease suggestions
                if "disease" in suggestion and "suggestions" in suggestion["disease"]:
                    disease_suggestions = suggestion["disease"]["suggestions"]
                    
                    for disease in disease_suggestions[:2]:  # Top 2 diseases per suggestion
                        name = disease.get("name", "Unknown Disease")
                        probability = disease.get("probability", 0.0)
                        
                        # Get additional details
                        details = disease.get("details", {})
                        description = details.get("description", "No description available")
                        
                        # Extract symptoms from description or use default
                        symptoms = []
                        if "common_names" in details:
                            symptoms.extend(details["common_names"])
                        
                        # Get images if available
                        images = []
                        if "similar_images" in disease:
                            for img in disease["similar_images"][:3]:  # Limit to 3 images
                                if "url" in img:
                                    images.append(img["url"])
                        
                        match = IdentificationMatch(
                            name=name,
                            scientific_name=details.get("entity_name"),
                            confidence=probability,
                            category="disease",
                            description=description,
                            symptoms=symptoms,
                            images=images
                        )
                        matches.append(match)
                
                # Handle plant health suggestions (if no diseases found)
                elif "plant_health_assessment" in suggestion:
                    health_data = suggestion["plant_health_assessment"]
                    
                    if health_data.get("is_healthy", {}).get("probability", 0) < 0.5:
                        match = IdentificationMatch(
                            name="Plant Health Issue Detected",
                            scientific_name=None,
                            confidence=1.0 - health_data.get("is_healthy", {}).get("probability", 0.5),
                            category="health_issue",
                            description="Plant appears to have health issues that require attention",
                            symptoms=["General plant stress indicators detected"],
                            images=[]
                        )
                        matches.append(match)
            
            except Exception as e:
                logger.warning(f"Failed to parse suggestion: {e}")
                continue
        
        return matches
    
    def _get_fallback_expert_resources(self) -> List[ExpertResource]:
        """
        Get expert resources using the lookup service with fallback.
        
        Returns:
            List of expert resources
        """
        try:
            # Get expert resources from lookup service
            lookup_experts = lookup_service.get_expert_resources()
            
            # Convert to local format
            expert_resources = []
            for expert in lookup_experts:
                resource = ExpertResource(
                    name=expert.name,
                    contact=expert.contact,
                    type=expert.type,
                    location=expert.location
                )
                expert_resources.append(resource)
            
            return expert_resources
            
        except Exception as e:
            logger.error(f"Error getting expert resources from lookup service: {e}")
            
            # Fallback to default resources
            return [
                ExpertResource(
                    name="Local Agricultural Extension Service",
                    contact="Contact your local county extension office",
                    type="extension_service",
                    location="Local"
                ),
                ExpertResource(
                    name="Plant Disease Diagnostic Lab",
                    contact="Submit samples to your state's plant diagnostic laboratory",
                    type="university",
                    location="State University"
                ),
                ExpertResource(
                    name="Certified Crop Advisor",
                    contact="Find a CCA through the American Society of Agronomy",
                    type="consultant",
                    location="Regional"
                )
            ]
    
    def _generate_comprehensive_result(self, 
                                     api_matches: List[IdentificationMatch], 
                                     confidence_level: str,
                                     api_source: str) -> Dict:
        """
        Generate comprehensive identification result with treatments and recommendations.
        
        Args:
            api_matches: Matches from API
            confidence_level: Overall confidence level
            api_source: Source of the identification
            
        Returns:
            Complete identification result dictionary
        """
        all_treatments = []
        all_prevention_tips = []
        processed_matches = []
        
        # Process each match and enrich with local data
        for match in api_matches:
            # Try to find local database match
            local_entry = self._find_local_match(match.name, match.scientific_name)
            
            if local_entry:
                # Enrich with local data
                enhanced_match = IdentificationMatch(
                    name=local_entry.get("name", match.name),
                    scientific_name=local_entry.get("scientific_name", match.scientific_name),
                    confidence=match.confidence,
                    category=local_entry.get("category", match.category),
                    description=local_entry.get("description", match.description),
                    symptoms=local_entry.get("symptoms", match.symptoms),
                    images=local_entry.get("images", match.images)
                )
                
                # Extract treatments and prevention tips
                treatments = self._extract_treatments_from_local_data(local_entry)
                prevention_tips = self._extract_prevention_tips(local_entry)
                
                all_treatments.extend(treatments)
                all_prevention_tips.extend(prevention_tips)
                
                processed_matches.append(enhanced_match)
            else:
                # Use API data as-is
                processed_matches.append(match)
        
        # Remove duplicate prevention tips
        unique_prevention_tips = list(set(all_prevention_tips))
        
        # Add general prevention tips if none found
        if not unique_prevention_tips:
            unique_prevention_tips = [
                "Monitor plants regularly for early detection of issues",
                "Maintain proper plant spacing for good air circulation",
                "Water at soil level to avoid wetting leaves",
                "Remove and dispose of affected plant material properly",
                "Practice crop rotation to break disease cycles"
            ]
        
        # Add general treatments if none found
        if not all_treatments:
            all_treatments = [
                TreatmentRecommendation(
                    method="cultural",
                    treatment="Improve plant care practices",
                    application="Ensure proper watering, lighting, and nutrition",
                    timing="Ongoing",
                    safety_notes="Monitor plant response to changes"
                ),
                TreatmentRecommendation(
                    method="organic",
                    treatment="Neem oil or horticultural soap",
                    application="Spray according to product instructions",
                    timing="Early morning or evening",
                    safety_notes="Test on small area first"
                )
            ]
        
        return {
            "matches": [
                {
                    "name": match.name,
                    "scientific_name": match.scientific_name,
                    "confidence": match.confidence,
                    "category": match.category,
                    "description": match.description,
                    "symptoms": match.symptoms,
                    "images": match.images
                }
                for match in processed_matches
            ],
            "treatments": [
                {
                    "method": treatment.method,
                    "treatment": treatment.treatment,
                    "application": treatment.application,
                    "timing": treatment.timing,
                    "safety_notes": treatment.safety_notes
                }
                for treatment in all_treatments
            ],
            "prevention_tips": unique_prevention_tips,
            "expert_resources": [
                {
                    "name": resource.name,
                    "contact": resource.contact,
                    "type": resource.type,
                    "location": resource.location
                }
                for resource in self._get_fallback_expert_resources()
            ],
            "confidence_level": confidence_level,
            "api_source": api_source
        }
    
    async def identify_disease(self, 
                             image_data: bytes, 
                             crop_type: str = None, 
                             location: str = None,
                             additional_info: str = None) -> Dict:
        """
        Identify plant diseases from image data.
        
        Args:
            image_data: Raw image bytes
            crop_type: Optional crop type hint
            location: Optional geographic location
            additional_info: Additional information about plant condition
            
        Returns:
            Complete identification result with treatments and recommendations
        """
        logger.info(f"Starting disease identification. Crop: {crop_type}, Location: {location}")
        
        # Try primary API first
        if self.primary_client:
            try:
                api_result = await self.primary_client.identify_disease(image_data, crop_type, location)
                
                if api_result["success"]:
                    # Parse API suggestions
                    suggestions = api_result["response"].suggestions
                    api_matches = self._parse_plant_id_suggestions(suggestions)
                    
                    # Generate comprehensive result
                    result = self._generate_comprehensive_result(
                        api_matches,
                        api_result["confidence_level"],
                        api_result["api_source"]
                    )
                    
                    logger.info(f"Disease identification completed successfully via {api_result['api_source']}")
                    return result
                
                else:
                    logger.warning(f"Primary API failed: {api_result.get('error', 'Unknown error')}")
                    
            except Exception as e:
                logger.error(f"Error with primary API: {e}")
        
        # Fall back to fallback client
        logger.info("Using fallback identification method")
        fallback_result = await self.fallback_client.identify_disease(image_data, crop_type, location)
        
        # Generate result from fallback
        fallback_matches = [
            IdentificationMatch(
                name="Unable to Identify Specific Issue",
                scientific_name=None,
                confidence=0.3,
                category="unknown",
                description="Primary identification service unavailable. Please consult local experts for accurate diagnosis.",
                symptoms=["Visual inspection recommended", "Professional diagnosis needed"],
                images=[]
            )
        ]
        
        result = self._generate_comprehensive_result(
            fallback_matches,
            "low",
            "fallback_analysis"
        )
        
        # Add fallback-specific messaging
        result["fallback_mode"] = True
        result["message"] = "Primary identification service unavailable. Providing general guidance."
        
        logger.info("Disease identification completed via fallback method")
        return result
    
    def get_service_status(self) -> Dict:
        """
        Get the current status of the disease identification service.
        
        Returns:
            Service status information
        """
        status = {
            "service_available": True,
            "primary_api_available": self.primary_client is not None,
            "fallback_available": True,
            "local_database_loaded": bool(self.pest_disease_data),
            "pest_disease_count": len(self.pest_disease_data.get("pests_diseases", {}))
        }
        
        # Add rate limit status if primary client is available
        if self.primary_client:
            try:
                status["rate_limit_status"] = self.primary_client.get_rate_limit_status()
            except Exception as e:
                logger.warning(f"Failed to get rate limit status: {e}")
        
        return status

# Global service instance
_disease_service_instance = None

def get_disease_identification_service() -> DiseaseIdentificationService:
    """
    Get the global disease identification service instance.
    
    Returns:
        DiseaseIdentificationService instance
    """
    global _disease_service_instance
    if _disease_service_instance is None:
        _disease_service_instance = DiseaseIdentificationService()
    return _disease_service_instance