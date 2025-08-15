"""
Plant.id API client for plant disease identification.

This module provides integration with the Plant.id API service for identifying
plant diseases, pests, and health issues from uploaded images.
"""

import os
import base64
import asyncio
import time
from typing import Dict, List, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime, timedelta
import httpx
from pydantic import BaseModel
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class RateLimitInfo:
    """Rate limiting information for API calls."""
    requests_made: int = 0
    window_start: datetime = None
    max_requests_per_minute: int = 60
    max_requests_per_day: int = 1000
    daily_requests: int = 0
    daily_reset: datetime = None

class PlantIdApiError(Exception):
    """Custom exception for Plant.id API errors."""
    def __init__(self, message: str, status_code: int = None, error_type: str = None):
        self.message = message
        self.status_code = status_code
        self.error_type = error_type
        super().__init__(self.message)

class PlantIdResponse(BaseModel):
    """Response model for Plant.id API results."""
    id: str
    suggestions: List[Dict]
    modifiers: List[str]
    secret: str
    fail_cause: Optional[str] = None
    countable: bool = True
    feedback: Optional[str] = None
    is_plant_probability: float = 0.0

class PlantIdClient:
    """
    Client for interacting with the Plant.id API service.
    
    Handles authentication, rate limiting, request formatting,
    and response parsing for plant disease identification.
    """
    
    def __init__(self, api_key: str = None):
        """
        Initialize the Plant.id client.
        
        Args:
            api_key: Plant.id API key. If not provided, will try to get from environment.
        """
        self.api_key = api_key or os.getenv('PLANT_ID_API_KEY')
        if not self.api_key:
            raise ValueError("Plant.id API key is required. Set PLANT_ID_API_KEY environment variable.")
        
        self.base_url = "https://api.plant.id/v2"
        self.timeout = 30.0
        self.rate_limit = RateLimitInfo()
        
        # Initialize daily rate limit tracking
        if self.rate_limit.daily_reset is None:
            self.rate_limit.daily_reset = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    
    def _reset_rate_limit_if_needed(self):
        """Reset rate limiting counters if time windows have passed."""
        now = datetime.now()
        
        # Reset minute window
        if (self.rate_limit.window_start is None or 
            now - self.rate_limit.window_start >= timedelta(minutes=1)):
            self.rate_limit.requests_made = 0
            self.rate_limit.window_start = now
        
        # Reset daily window
        if now >= self.rate_limit.daily_reset:
            self.rate_limit.daily_requests = 0
            self.rate_limit.daily_reset = now.replace(hour=0, minute=0, second=0, microsecond=0) + timedelta(days=1)
    
    def _check_rate_limit(self) -> Tuple[bool, str]:
        """
        Check if we can make another API request.
        
        Returns:
            Tuple of (can_proceed, error_message)
        """
        self._reset_rate_limit_if_needed()
        
        if self.rate_limit.requests_made >= self.rate_limit.max_requests_per_minute:
            return False, "Rate limit exceeded: too many requests per minute"
        
        if self.rate_limit.daily_requests >= self.rate_limit.max_requests_per_day:
            return False, "Daily quota exceeded: too many requests today"
        
        return True, ""
    
    def _update_rate_limit(self):
        """Update rate limiting counters after making a request."""
        self.rate_limit.requests_made += 1
        self.rate_limit.daily_requests += 1
    
    def _prepare_image_data(self, image_data: bytes) -> str:
        """
        Prepare image data for API request.
        
        Args:
            image_data: Raw image bytes
            
        Returns:
            Base64 encoded image string
        """
        try:
            return base64.b64encode(image_data).decode('utf-8')
        except Exception as e:
            raise PlantIdApiError(f"Failed to encode image data: {str(e)}", error_type="encoding_error")
    
    def _build_request_payload(self, image_data: bytes, crop_type: str = None, location: str = None) -> Dict:
        """
        Build the request payload for Plant.id API.
        
        Args:
            image_data: Raw image bytes
            crop_type: Optional crop type hint
            location: Optional geographic location
            
        Returns:
            Dictionary containing the API request payload
        """
        base64_image = self._prepare_image_data(image_data)
        
        # Base payload with disease identification focus
        payload = {
            "api_key": self.api_key,
            "images": [base64_image],
            "modifiers": [
                "crops_fast",  # Focus on crop plants
                "similar_images",  # Include similar reference images
                "disease_details"  # Get detailed disease information
            ],
            "disease_details": [
                "cause",
                "common_names", 
                "classification",
                "description",
                "treatment",
                "url"
            ]
        }
        
        # Add optional parameters if provided
        if crop_type:
            payload["plant_details"] = [crop_type]
        
        if location:
            payload["location"] = location
        
        return payload
    
    async def _make_api_request(self, payload: Dict) -> Dict:
        """
        Make the actual API request to Plant.id with comprehensive error handling.
        
        Args:
            payload: Request payload dictionary
            
        Returns:
            API response dictionary
            
        Raises:
            PlantIdApiError: If the API request fails
        """
        # Check rate limits
        can_proceed, error_msg = self._check_rate_limit()
        if not can_proceed:
            logger.warning(f"Rate limit exceeded: {error_msg}")
            raise PlantIdApiError(error_msg, status_code=429, error_type="rate_limit_exceeded")
        
        retry_count = 0
        max_retries = 3
        base_delay = 1.0
        
        while retry_count < max_retries:
            try:
                # Create client with extended timeout for retries
                timeout_duration = self.timeout + (retry_count * 10)  # Increase timeout on retries
                
                async with httpx.AsyncClient(timeout=timeout_duration) as client:
                    logger.info(f"Making Plant.id API request (attempt {retry_count + 1}/{max_retries})")
                    
                    response = await client.post(
                        f"{self.base_url}/identify",
                        json=payload,
                        headers={
                            "Content-Type": "application/json",
                            "User-Agent": "CropVision-PestIdentification/1.0"
                        }
                    )
                    
                    # Update rate limiting after successful request
                    self._update_rate_limit()
                    
                    # Handle different response status codes
                    if response.status_code == 200:
                        logger.info("Plant.id API request successful")
                        return response.json()
                    elif response.status_code == 401:
                        logger.error("Plant.id API authentication failed")
                        raise PlantIdApiError("Invalid API key - please check your Plant.id API configuration", 
                                            status_code=401, error_type="authentication_error")
                    elif response.status_code == 402:
                        logger.error("Plant.id API quota exceeded")
                        raise PlantIdApiError("API quota exceeded - please upgrade your Plant.id plan or try again later", 
                                            status_code=402, error_type="quota_exceeded")
                    elif response.status_code == 429:
                        logger.warning("Plant.id API rate limit exceeded")
                        if retry_count < max_retries - 1:
                            delay = base_delay * (2 ** retry_count)  # Exponential backoff
                            logger.info(f"Rate limited, waiting {delay}s before retry")
                            await asyncio.sleep(delay)
                            retry_count += 1
                            continue
                        raise PlantIdApiError("Rate limit exceeded - please try again later", 
                                            status_code=429, error_type="rate_limit_exceeded")
                    elif response.status_code >= 500:
                        logger.warning(f"Plant.id service error: {response.status_code}")
                        if retry_count < max_retries - 1:
                            delay = base_delay * (2 ** retry_count)
                            logger.info(f"Server error, waiting {delay}s before retry")
                            await asyncio.sleep(delay)
                            retry_count += 1
                            continue
                        raise PlantIdApiError("Plant.id service temporarily unavailable - please try again later", 
                                            status_code=response.status_code, error_type="service_unavailable")
                    else:
                        error_detail = response.text if response.text else "Unknown error"
                        logger.error(f"Plant.id API error {response.status_code}: {error_detail}")
                        raise PlantIdApiError(f"API request failed: {error_detail}", 
                                            status_code=response.status_code, error_type="api_error")
                        
            except httpx.TimeoutException:
                logger.warning(f"Plant.id API timeout (attempt {retry_count + 1})")
                if retry_count < max_retries - 1:
                    delay = base_delay * (2 ** retry_count)
                    logger.info(f"Timeout, waiting {delay}s before retry")
                    await asyncio.sleep(delay)
                    retry_count += 1
                    continue
                raise PlantIdApiError("Request timeout - Plant.id service is slow to respond. Please try again later.", 
                                    error_type="timeout_error")
            except httpx.NetworkError as e:
                logger.warning(f"Network error (attempt {retry_count + 1}): {str(e)}")
                if retry_count < max_retries - 1:
                    delay = base_delay * (2 ** retry_count)
                    logger.info(f"Network error, waiting {delay}s before retry")
                    await asyncio.sleep(delay)
                    retry_count += 1
                    continue
                raise PlantIdApiError(f"Network error: {str(e)}. Please check your internet connection.", 
                                    error_type="network_error")
            except Exception as e:
                if isinstance(e, PlantIdApiError):
                    raise
                logger.error(f"Unexpected error during API request: {str(e)}")
                raise PlantIdApiError(f"Unexpected error during API request: {str(e)}", 
                                    error_type="unexpected_error")
        
        # This should never be reached due to the loop logic, but just in case
        raise PlantIdApiError("Maximum retry attempts exceeded", error_type="max_retries_exceeded")
    
    def _parse_api_response(self, response_data: Dict) -> PlantIdResponse:
        """
        Parse and validate the API response.
        
        Args:
            response_data: Raw API response dictionary
            
        Returns:
            Parsed PlantIdResponse object
            
        Raises:
            PlantIdApiError: If response parsing fails
        """
        try:
            # Validate required fields
            if 'suggestions' not in response_data:
                raise PlantIdApiError("Invalid API response: missing suggestions", error_type="invalid_response")
            
            return PlantIdResponse(**response_data)
        except Exception as e:
            if isinstance(e, PlantIdApiError):
                raise
            raise PlantIdApiError(f"Failed to parse API response: {str(e)}", error_type="parsing_error")
    
    def _calculate_confidence_level(self, suggestions: List[Dict]) -> str:
        """
        Calculate overall confidence level based on suggestion scores.
        
        Args:
            suggestions: List of suggestion dictionaries from API
            
        Returns:
            Confidence level string: "high", "medium", or "low"
        """
        if not suggestions:
            return "low"
        
        # Get the highest probability from the top suggestion
        top_suggestion = suggestions[0]
        max_probability = 0.0
        
        if 'disease' in top_suggestion and 'suggestions' in top_suggestion['disease']:
            disease_suggestions = top_suggestion['disease']['suggestions']
            if disease_suggestions:
                max_probability = max(s.get('probability', 0.0) for s in disease_suggestions)
        
        # Determine confidence level based on probability
        if max_probability >= 0.8:
            return "high"
        elif max_probability >= 0.5:
            return "medium"
        else:
            return "low"
    
    async def identify_disease(self, image_data: bytes, crop_type: str = None, location: str = None) -> Dict:
        """
        Identify plant diseases from an image using Plant.id API.
        
        Args:
            image_data: Raw image bytes
            crop_type: Optional crop type hint for better accuracy
            location: Optional geographic location for regional disease patterns
            
        Returns:
            Dictionary containing identification results
            
        Raises:
            PlantIdApiError: If identification fails
        """
        logger.info(f"Starting Plant.id disease identification. Crop type: {crop_type}, Location: {location}")
        
        try:
            # Build request payload
            payload = self._build_request_payload(image_data, crop_type, location)
            
            # Make API request
            response_data = await self._make_api_request(payload)
            
            # Parse response
            parsed_response = self._parse_api_response(response_data)
            
            # Calculate confidence level
            confidence_level = self._calculate_confidence_level(parsed_response.suggestions)
            
            logger.info(f"Plant.id identification completed. Confidence: {confidence_level}")
            
            return {
                "success": True,
                "response": parsed_response,
                "confidence_level": confidence_level,
                "api_source": "plant_id",
                "is_plant_probability": parsed_response.is_plant_probability
            }
            
        except PlantIdApiError as e:
            logger.error(f"Plant.id API error: {e.message}")
            return {
                "success": False,
                "error": e.message,
                "error_type": e.error_type,
                "status_code": e.status_code
            }
        except Exception as e:
            logger.error(f"Unexpected error in disease identification: {str(e)}")
            return {
                "success": False,
                "error": f"Unexpected error: {str(e)}",
                "error_type": "unexpected_error"
            }
    
    def get_rate_limit_status(self) -> Dict:
        """
        Get current rate limiting status.
        
        Returns:
            Dictionary with rate limiting information
        """
        self._reset_rate_limit_if_needed()
        
        return {
            "requests_made_this_minute": self.rate_limit.requests_made,
            "max_requests_per_minute": self.rate_limit.max_requests_per_minute,
            "daily_requests": self.rate_limit.daily_requests,
            "max_requests_per_day": self.rate_limit.max_requests_per_day,
            "daily_reset_time": self.rate_limit.daily_reset.isoformat() if self.rate_limit.daily_reset else None,
            "can_make_request": self._check_rate_limit()[0]
        }

# Fallback API client for when Plant.id is unavailable
class FallbackApiClient:
    """
    Enhanced fallback client that provides comprehensive plant health analysis
    when the primary Plant.id API is unavailable.
    """
    
    def __init__(self):
        self.api_source = "fallback_analysis"
        self.common_issues = self._load_common_issues()
    
    def _load_common_issues(self) -> Dict:
        """Load common plant issues for basic analysis."""
        return {
            "general_stress": {
                "name": "General Plant Stress",
                "symptoms": ["wilting", "yellowing", "browning", "spots"],
                "causes": ["watering issues", "nutrient deficiency", "disease", "pest damage"],
                "recommendations": [
                    "Check soil moisture levels",
                    "Inspect for visible pests",
                    "Ensure adequate lighting",
                    "Consider nutrient deficiency"
                ]
            },
            "fungal_issues": {
                "name": "Possible Fungal Issue",
                "symptoms": ["spots", "mold", "discoloration", "wilting"],
                "causes": ["high humidity", "poor air circulation", "overwatering"],
                "recommendations": [
                    "Improve air circulation",
                    "Reduce watering frequency",
                    "Remove affected plant parts",
                    "Apply fungicidal treatment if available"
                ]
            },
            "pest_damage": {
                "name": "Possible Pest Damage",
                "symptoms": ["holes", "chewed leaves", "sticky residue", "visible insects"],
                "causes": ["aphids", "caterpillars", "mites", "other insects"],
                "recommendations": [
                    "Inspect plants carefully for pests",
                    "Use insecticidal soap or neem oil",
                    "Remove heavily infested parts",
                    "Monitor regularly for pest activity"
                ]
            }
        }
    
    async def identify_disease(self, image_data: bytes, crop_type: str = None, location: str = None) -> Dict:
        """
        Provide comprehensive fallback analysis when Plant.id API is unavailable.
        
        This method provides general plant health guidance and common issue identification
        based on typical plant problems.
        """
        logger.info("Using enhanced fallback disease identification")
        
        # Simulate processing time for realistic user experience
        await asyncio.sleep(1.0)
        
        # Provide multiple potential issues for comprehensive guidance
        suggestions = []
        
        # Add general stress assessment
        suggestions.append({
            "name": "General Plant Health Assessment",
            "probability": 0.4,
            "category": "general",
            "description": "Primary identification service unavailable. Based on common plant issues, your plant may be experiencing stress from various factors.",
            "symptoms": ["Visual symptoms detected", "Professional assessment recommended"],
            "recommendations": [
                "Contact your local agricultural extension service for in-person diagnosis",
                "Take additional photos from different angles and lighting conditions",
                "Note any recent changes in plant care, environment, or weather",
                "Document when symptoms first appeared and how they've progressed",
                "Check for common issues like watering, lighting, or nutrient deficiencies"
            ]
        })
        
        # Add common issue possibilities
        for issue_key, issue_data in self.common_issues.items():
            suggestions.append({
                "name": issue_data["name"],
                "probability": 0.3,
                "category": "possible_issue",
                "description": f"Common plant issue that could match your symptoms. {', '.join(issue_data['causes'])} are typical causes.",
                "symptoms": issue_data["symptoms"],
                "recommendations": issue_data["recommendations"]
            })
        
        return {
            "success": True,
            "fallback_mode": True,
            "confidence_level": "low",
            "api_source": "enhanced_fallback_analysis",
            "message": "Primary identification service unavailable. Providing comprehensive general guidance based on common plant issues.",
            "suggestions": suggestions,
            "additional_guidance": {
                "immediate_actions": [
                    "Isolate the affected plant if possible to prevent spread",
                    "Remove any severely damaged or dead plant material",
                    "Ensure proper watering - not too much, not too little",
                    "Check for visible pests on leaves, stems, and soil"
                ],
                "monitoring_tips": [
                    "Take photos daily to track symptom progression",
                    "Note environmental conditions (temperature, humidity, light)",
                    "Record any treatments applied and their effects",
                    "Monitor other plants for similar symptoms"
                ],
                "when_to_seek_help": [
                    "Symptoms are spreading rapidly to other plants",
                    "Plant condition is deteriorating quickly",
                    "You're unsure about the safety of treatments",
                    "Multiple plants are showing similar symptoms"
                ]
            }
        }

# Factory function to create the appropriate client
def create_plant_id_client() -> PlantIdClient:
    """
    Create a Plant.id client instance.
    
    Returns:
        PlantIdClient instance
        
    Raises:
        ValueError: If API key is not available
    """
    try:
        return PlantIdClient()
    except ValueError as e:
        logger.warning(f"Failed to create Plant.id client: {e}")
        raise

def create_fallback_client() -> FallbackApiClient:
    """
    Create a fallback client instance.
    
    Returns:
        FallbackApiClient instance
    """
    return FallbackApiClient()