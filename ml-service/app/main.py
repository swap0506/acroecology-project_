import os,json,joblib
import numpy as np
import time
import asyncio
import logging
from pathlib import Path
from typing import Optional, List
from functools import lru_cache
import tempfile
import shutil
from PIL import Image
import io
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, ValidationError
from dotenv import load_dotenv

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import disease identification service
from .disease_identification_service import get_disease_identification_service


APP_DIR = Path(__file__).resolve().parent
MODEL_PATH = APP_DIR / "model.pkl"
ENCODER_PATH = APP_DIR / "label_encoder.pkl"
FEATURE_ORDER_PATH = APP_DIR / "feature_order.json"
SOIL_TYPES_PATH = APP_DIR / "soil_types.json"

if not MODEL_PATH.exists() or not ENCODER_PATH.exists() or not FEATURE_ORDER_PATH.exists():
    raise FileNotFoundError("Model, encoder, or feature order file not found. "
                            "Run training script first.")

# Load ML model and related files
model = joblib.load(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)

with open(FEATURE_ORDER_PATH) as f:
    feature_order = json.load(f)

# Load soil types data
soil_types_data = {}
if SOIL_TYPES_PATH.exists():
    with open(SOIL_TYPES_PATH) as f:
        soil_types_data = json.load(f)
else:
    print("Warning: Soil types data not found. Soil-specific features will be disabled.")


# Utility functions for soil operations with caching
@lru_cache(maxsize=128)
def get_soil_type_data(soil_type: str) -> dict:
    """Get soil type data from the loaded soil types data. Cached for performance."""
    try:
        if not soil_types_data or 'soil_types' not in soil_types_data:
            print("Warning: Soil types data not available")
            return {}
        return soil_types_data['soil_types'].get(soil_type, {})
    except Exception as e:
        print(f"Error accessing soil type data: {e}")
        return {}

@lru_cache(maxsize=256)
def get_compatibility_score(crop_name: str, soil_type: str) -> dict:
    """Get crop-soil compatibility score and warnings. Cached for performance."""
    try:
        if not soil_types_data or 'compatibility_matrix' not in soil_types_data:
            return {"score": 0.5, "warnings": ["Compatibility data not available"]}
        
        crop_lower = crop_name.lower()
        compatibility_matrix = soil_types_data['compatibility_matrix']
        
        if crop_lower in compatibility_matrix and soil_type in compatibility_matrix[crop_lower]:
            return compatibility_matrix[crop_lower][soil_type]
        
        return {"score": 0.5, "warnings": ["Compatibility data not available for this crop-soil combination"]}
    except Exception as e:
        print(f"Error getting compatibility score: {e}")
        return {"score": 0.5, "warnings": ["Error calculating compatibility score"]}

@lru_cache(maxsize=256)
def generate_variety_recommendations(crop_name: str, soil_type: str) -> tuple:
    """Generate variety recommendations based on crop and soil type. Returns tuple for caching."""
    variety_recommendations = {
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
    }
    
    crop_lower = crop_name.lower()
    if crop_lower in variety_recommendations and soil_type in variety_recommendations[crop_lower]:
        return tuple(variety_recommendations[crop_lower][soil_type])
    
    return tuple([
        'Consult local agricultural extension for variety recommendations',
        'Choose varieties adapted to your local climate'
    ])

def get_suitable_crops_for_soil(soil_type: str) -> List[str]:
    """Get list of crops suitable for a specific soil type."""
    soil_data = get_soil_type_data(soil_type)
    return soil_data.get('suitable_crops', [])

def validate_soil_type(soil_type: str) -> bool:
    """Validate if the provided soil type is supported."""
    if not soil_types_data or 'soil_types' not in soil_types_data:
        return False
    return soil_type in soil_types_data['soil_types']

def get_soil_characteristics(soil_type: str) -> List[str]:
    """Get characteristics of a specific soil type."""
    soil_data = get_soil_type_data(soil_type)
    return soil_data.get('characteristics', [])

# Image processing utility functions
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/jpg", "image/png"}
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_IMAGE_DIMENSION = 4096  # 4K resolution max

def validate_image_file(file: UploadFile) -> dict:
    """Validate uploaded image file for security and format compliance."""
    errors = []
    
    # Check file size
    if hasattr(file, 'size') and file.size and file.size > MAX_IMAGE_SIZE:
        errors.append(f"File size ({file.size / 1024 / 1024:.1f}MB) exceeds maximum allowed size (10MB)")
    
    # Check content type
    if file.content_type not in ALLOWED_IMAGE_TYPES:
        errors.append(f"Unsupported file format: {file.content_type}. Only JPG and PNG files are allowed.")
    
    # Check filename extension
    if file.filename:
        ext = file.filename.lower().split('.')[-1]
        if ext not in ['jpg', 'jpeg', 'png']:
            errors.append(f"Unsupported file extension: .{ext}. Only .jpg, .jpeg, and .png files are allowed.")
    
    return {
        "valid": len(errors) == 0,
        "errors": errors
    }

def optimize_image(image_data: bytes) -> tuple[bytes, dict]:
    """Optimize image for processing while maintaining quality."""
    try:
        # Open image with PIL
        image = Image.open(io.BytesIO(image_data))
        
        # Get original dimensions
        original_width, original_height = image.size
        original_size = len(image_data)
        
        # Convert to RGB if necessary (handles RGBA, P mode, etc.)
        if image.mode not in ['RGB', 'L']:
            if image.mode == 'RGBA':
                # Create white background for transparent images
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[-1])
                image = background
            else:
                image = image.convert('RGB')
        
        # Resize if image is too large
        if max(original_width, original_height) > MAX_IMAGE_DIMENSION:
            # Calculate new dimensions maintaining aspect ratio
            if original_width > original_height:
                new_width = MAX_IMAGE_DIMENSION
                new_height = int((original_height * MAX_IMAGE_DIMENSION) / original_width)
            else:
                new_height = MAX_IMAGE_DIMENSION
                new_width = int((original_width * MAX_IMAGE_DIMENSION) / original_height)
            
            image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # Save optimized image
        output_buffer = io.BytesIO()
        
        # Determine format and quality
        if original_size > 2 * 1024 * 1024:  # If larger than 2MB, use higher compression
            quality = 85
        else:
            quality = 95
        
        image.save(output_buffer, format='JPEG', quality=quality, optimize=True)
        optimized_data = output_buffer.getvalue()
        
        optimization_info = {
            "original_size": original_size,
            "optimized_size": len(optimized_data),
            "original_dimensions": f"{original_width}x{original_height}",
            "final_dimensions": f"{image.size[0]}x{image.size[1]}",
            "compression_ratio": round(len(optimized_data) / original_size, 2),
            "quality": quality
        }
        
        return optimized_data, optimization_info
        
    except Exception as e:
        raise ValueError(f"Failed to process image: {str(e)}")

def create_temp_image_file(image_data: bytes, suffix: str = ".jpg") -> str:
    """Create a temporary file for the processed image."""
    try:
        # Create temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=suffix)
        temp_file.write(image_data)
        temp_file.close()
        return temp_file.name
    except Exception as e:
        raise ValueError(f"Failed to create temporary file: {str(e)}")

def cleanup_temp_file(file_path: str) -> None:
    """Clean up temporary file safely."""
    try:
        if os.path.exists(file_path):
            os.unlink(file_path)
    except Exception as e:
        print(f"Warning: Failed to cleanup temporary file {file_path}: {e}")

def get_fallback_expert_resources():
    """Get fallback expert resources when identification fails."""
    return [
        {
            "name": "Local Agricultural Extension Service",
            "contact": "Contact your local county extension office",
            "type": "extension_service",
            "location": "Local"
        },
        {
            "name": "Plant Disease Diagnostic Lab",
            "contact": "Submit samples to your state's plant diagnostic laboratory",
            "type": "university",
            "location": "State University"
        },
        {
            "name": "Certified Crop Advisor",
            "contact": "Find a CCA through the American Society of Agronomy",
            "type": "consultant",
            "location": "Regional"
        }
    ]

def generate_soil_advice(crop_name: str, soil_type: str):
    """Generate comprehensive soil advice for a crop-soil combination."""
    if not soil_type or not soil_types_data:
        return None
    
    # Validate soil type
    if not validate_soil_type(soil_type):
        return None
    
    try:
        soil_data = get_soil_type_data(soil_type)
        if not soil_data:
            return None
        
        compatibility = get_compatibility_score(crop_name, soil_type)
        variety_recommendations_tuple = generate_variety_recommendations(crop_name, soil_type)
        variety_recommendations = list(variety_recommendations_tuple)
        
        # Convert soil data to Pydantic models with error handling
        amendments = []
        for amendment_data in soil_data.get('amendments', []):
            try:
                amendments.append(Amendment(**amendment_data))
            except Exception as e:
                print(f"Error creating amendment: {e}")
                continue
        
        irrigation_data = soil_data.get('irrigation_guidance', {})
        try:
            irrigation_guidance = IrrigationGuidance(**irrigation_data)
        except Exception as e:
            print(f"Error creating irrigation guidance: {e}")
            # Provide default irrigation guidance
            irrigation_guidance = IrrigationGuidance(
                frequency="Regular watering as needed",
                duration="Medium duration sessions",
                method="Standard irrigation methods",
                special_notes="Monitor soil moisture and adjust as needed"
            )
        
        return {
            "compatibility_score": compatibility['score'],
            "amendments": [amendment.dict() for amendment in amendments],
            "irrigation_tips": irrigation_guidance.dict(),
            "warnings": compatibility['warnings'],
            "variety_recommendations": variety_recommendations
        }
    
    except Exception as e:
        print(f"Error generating soil advice: {e}")
        return None

app = FastAPI(title="Crop Recommendation API", version="1.0")

origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,https://acroecology-project-r8rz.vercel.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in origins],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred. Please try again later.",
            "details": str(exc) if app.debug else None
        }
    )

@app.exception_handler(ValidationError)
async def validation_exception_handler(request, exc):
    return JSONResponse(
        status_code=422,
        content={
            "error": "Validation error",
            "message": "Invalid input data provided.",
            "details": exc.errors()
        }
    )


# Soil-related data models
class Amendment(BaseModel):
    name: str
    purpose: str
    application_rate: str
    timing: str

class IrrigationGuidance(BaseModel):
    frequency: str
    duration: str
    method: str
    special_notes: str

class SoilAdvice(BaseModel):
    compatibility_score: float
    amendments: List[Amendment]
    irrigation_tips: IrrigationGuidance
    warnings: List[str]
    variety_recommendations: List[str]

# Extended prediction request model
class PredictionRequest(BaseModel):
    N: float = Field(..., example=90, description="Nitrogen content (kg/ha)")
    P: float = Field(..., example=42, description="Phosphorous content (kg/ha)")
    K: float = Field(..., example=43, description="Potassium content (kg/ha)")
    temperature: float = Field(..., example=22.4, description="Temperature (°C)")
    humidity: float = Field(..., example=82.0, description="Humidity (%)")
    ph: float = Field(..., example=6.5, description="pH value (0-14)")
    rainfall: float = Field(..., example=180.0, description="Rainfall (mm)")
    soil_type: Optional[str] = Field(None, example="loamy", description="Soil type (sandy, clay, loamy, silty, peaty, chalky)")

# Enhanced prediction response model
class CropPrediction(BaseModel):
    crop: str
    prob: float

class PredictionResponse(BaseModel):
    crop: str
    top3: List[CropPrediction]
    probs: dict
    model_version: str
    soil_specific_advice: Optional[SoilAdvice] = None

# Legacy Features model for backward compatibility
class Features(BaseModel):
    N: float = Field(...,example=90),
    P: float = Field(...,example=42),
    K: float = Field(...,example=43),
    temperature:float=Field(...,example=22.4),
    humidity:float=Field(...,example=82.0)
    ph: float=Field(...,example=6.5)
    rainfall:float=Field(...,example=180.0)

# Pest and Disease Identification Models
class ExpertResource(BaseModel):
    name: str
    contact: str
    type: str  # "extension_service", "consultant", "university"
    location: Optional[str] = None

class PestDiseaseMatch(BaseModel):
    name: str
    scientific_name: Optional[str] = None
    confidence: float
    category: str  # "pest", "disease", "deficiency", "healthy"
    description: str
    symptoms: List[str]
    images: List[str]

class TreatmentOption(BaseModel):
    method: str  # "organic", "chemical", "cultural"
    treatment: str
    application: str
    timing: str
    safety_notes: str

class IdentificationResult(BaseModel):
    matches: List[PestDiseaseMatch]
    treatments: List[TreatmentOption]
    prevention_tips: List[str]
    expert_resources: List[ExpertResource]
    confidence_level: str  # "high", "medium", "low"
    api_source: str

class ImageProcessingError(BaseModel):
    error_type: str
    message: str
    suggestions: List[str]
    fallback_available: bool
    expert_contacts: List[ExpertResource]



@app.post("/identify", response_model=IdentificationResult)
async def identify_pest_disease(
    image: UploadFile = File(..., description="Plant image for pest/disease identification"),
    crop_type: Optional[str] = Form(None, description="Type of crop (optional)"),
    location: Optional[str] = Form(None, description="Geographic location (optional)"),
    additional_info: Optional[str] = Form(None, description="Additional information about the plant condition")
):
    """
    Process uploaded plant image for pest and disease identification using Plant.id API.
    
    This endpoint handles image upload, validation, optimization, and integrates
    with the Plant.id API for accurate disease identification with comprehensive fallback mechanisms.
    """
    temp_file_path = None
    request_id = f"req_{int(time.time() * 1000)}"  # Simple request ID for logging
    
    try:
        logger.info(f"[{request_id}] Starting pest/disease identification request")
        
        # Validate the uploaded file
        validation_result = validate_image_file(image)
        if not validation_result["valid"]:
            logger.warning(f"[{request_id}] File validation failed: {validation_result['errors']}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "validation_error",
                    "message": "Invalid image file",
                    "suggestions": [
                        "Please upload a JPG or PNG image file",
                        "Ensure file size is less than 10MB",
                        "Check that the file is not corrupted",
                        "Try compressing the image if it's too large"
                    ],
                    "errors": validation_result["errors"],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        
        # Read image data with error handling
        try:
            image_data = await image.read()
            logger.info(f"[{request_id}] Image data read successfully, size: {len(image_data)} bytes")
        except asyncio.TimeoutError:
            logger.error(f"[{request_id}] Timeout reading image data")
            raise HTTPException(
                status_code=408,
                detail={
                    "error_type": "timeout_error",
                    "message": "Request timed out while reading image data",
                    "suggestions": [
                        "Try uploading a smaller image",
                        "Check your internet connection",
                        "Try again in a few moments"
                    ],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        except Exception as e:
            logger.error(f"[{request_id}] Failed to read image data: {e}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "file_read_error",
                    "message": "Failed to read uploaded image",
                    "suggestions": [
                        "Try uploading the image again",
                        "Check that the file is not corrupted",
                        "Ensure stable internet connection",
                        "Try a different image file"
                    ],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        
        # Additional validation on actual image data
        if len(image_data) == 0:
            logger.warning(f"[{request_id}] Empty image file uploaded")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "empty_file_error",
                    "message": "Uploaded file is empty",
                    "suggestions": [
                        "Please select a valid image file",
                        "Check that the file was uploaded completely",
                        "Try uploading a different image"
                    ],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        
        # Optimize image for processing with enhanced error handling
        try:
            optimized_data, optimization_info = optimize_image(image_data)
            logger.info(f"[{request_id}] Image optimization completed: {optimization_info}")
        except ValueError as e:
            logger.error(f"[{request_id}] Image processing failed: {e}")
            raise HTTPException(
                status_code=422,
                detail={
                    "error_type": "image_processing_error",
                    "message": f"Failed to process image: {str(e)}",
                    "suggestions": [
                        "Try uploading a different image",
                        "Ensure the image file is not corrupted",
                        "Use a standard image format (JPG or PNG)",
                        "Try reducing the image size or quality"
                    ],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        except Exception as e:
            logger.error(f"[{request_id}] Unexpected error during image optimization: {e}")
            raise HTTPException(
                status_code=500,
                detail={
                    "error_type": "processing_error",
                    "message": "Unexpected error during image processing",
                    "suggestions": [
                        "Try uploading the image again",
                        "Try a different image file",
                        "Contact support if the problem persists"
                    ],
                    "fallback_available": True,
                    "expert_contacts": get_fallback_expert_resources()
                }
            )
        
        # Get disease identification service
        disease_service = get_disease_identification_service()
        
        # Check service status before proceeding
        service_status = disease_service.get_service_status()
        logger.info(f"[{request_id}] Service status: {service_status}")
        
        # Perform disease identification with comprehensive error handling
        try:
            identification_result = await disease_service.identify_disease(
                optimized_data, 
                crop_type, 
                location, 
                additional_info
            )
            
            # Convert service result to API response format
            api_result = IdentificationResult(
                matches=[
                    PestDiseaseMatch(
                        name=match["name"],
                        scientific_name=match["scientific_name"],
                        confidence=match["confidence"],
                        category=match["category"],
                        description=match["description"],
                        symptoms=match["symptoms"],
                        images=match["images"]
                    )
                    for match in identification_result["matches"]
                ],
                treatments=[
                    TreatmentOption(
                        method=treatment["method"],
                        treatment=treatment["treatment"],
                        application=treatment["application"],
                        timing=treatment["timing"],
                        safety_notes=treatment["safety_notes"]
                    )
                    for treatment in identification_result["treatments"]
                ],
                prevention_tips=identification_result["prevention_tips"],
                expert_resources=[
                    ExpertResource(
                        name=resource["name"],
                        contact=resource["contact"],
                        type=resource["type"],
                        location=resource.get("location")
                    )
                    for resource in identification_result["expert_resources"]
                ],
                confidence_level=identification_result["confidence_level"],
                api_source=identification_result["api_source"]
            )
            
            logger.info(f"[{request_id}] Disease identification completed via {identification_result['api_source']}")
            return api_result
            
        except asyncio.TimeoutError:
            logger.error(f"[{request_id}] Identification service timeout")
            return await _create_timeout_fallback_result(request_id)
            
        except Exception as e:
            logger.error(f"[{request_id}] Error in disease identification: {e}")
            return await _create_service_error_fallback_result(request_id, str(e))
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except asyncio.TimeoutError:
        logger.error(f"[{request_id}] Request timeout")
        raise HTTPException(
            status_code=408,
            detail={
                "error_type": "request_timeout",
                "message": "Request timed out",
                "suggestions": [
                    "Try uploading a smaller image",
                    "Check your internet connection",
                    "Try again in a few moments"
                ],
                "fallback_available": True,
                "expert_contacts": get_fallback_expert_resources()
            }
        )
    except Exception as e:
        logger.error(f"[{request_id}] Unexpected error in image processing: {e}")
        
        # Return structured error response with fallback
        error_response = ImageProcessingError(
            error_type="internal_server_error",
            message="An unexpected error occurred while processing the image",
            suggestions=[
                "Try uploading the image again",
                "Check that the image file is valid",
                "Try a different image",
                "Contact support if the problem persists"
            ],
            fallback_available=True,
            expert_contacts=get_fallback_expert_resources()
        )
        
        raise HTTPException(
            status_code=500,
            detail=error_response.dict()
        )
    
    finally:
        # Clean up temporary file
        if temp_file_path:
            cleanup_temp_file(temp_file_path)
        logger.info(f"[{request_id}] Request processing completed")


async def _create_timeout_fallback_result(request_id: str) -> IdentificationResult:
    """Create a fallback result for timeout scenarios."""
    logger.info(f"[{request_id}] Creating timeout fallback result")
    
    return IdentificationResult(
        matches=[
            PestDiseaseMatch(
                name="Service Timeout",
                scientific_name=None,
                confidence=0.0,
                category="service_error",
                description="The identification service timed out. This may be due to high demand or network issues. Please try again or consult local experts.",
                symptoms=["Service timeout", "High demand or network issues"],
                images=[]
            )
        ],
        treatments=[
            TreatmentOption(
                method="consultation",
                treatment="Expert consultation recommended due to service timeout",
                application="Contact local agricultural extension or plant pathologist for immediate assistance",
                timing="As soon as possible for accurate diagnosis",
                safety_notes="Professional diagnosis is recommended when automated services are unavailable"
            ),
            TreatmentOption(
                method="cultural",
                treatment="General plant health maintenance",
                application="Maintain proper watering, lighting, and nutrition while seeking expert advice",
                timing="Ongoing until professional diagnosis",
                safety_notes="Monitor plant condition closely and isolate if symptoms worsen"
            )
        ],
        prevention_tips=[
            "Monitor plants regularly for early detection of issues",
            "Maintain good plant hygiene and proper spacing",
            "Ensure adequate but not excessive watering",
            "Provide appropriate lighting and nutrition",
            "Remove affected plant material promptly",
            "Keep detailed records of symptoms and changes",
            "Consider taking multiple photos from different angles for expert consultation"
        ],
        expert_resources=get_fallback_expert_resources(),
        confidence_level="low",
        api_source="timeout_fallback"
    )


async def _create_service_error_fallback_result(request_id: str, error_message: str) -> IdentificationResult:
    """Create a fallback result for service error scenarios."""
    logger.info(f"[{request_id}] Creating service error fallback result")
    
    return IdentificationResult(
        matches=[
            PestDiseaseMatch(
                name="Identification Service Unavailable",
                scientific_name=None,
                confidence=0.0,
                category="service_error",
                description="The disease identification service is temporarily unavailable. This could be due to maintenance, high demand, or technical issues. Please try again later or consult local experts.",
                symptoms=["Service temporarily unavailable", "Technical issues"],
                images=[]
            )
        ],
        treatments=[
            TreatmentOption(
                method="consultation",
                treatment="Expert consultation recommended",
                application="Contact local agricultural extension or plant pathologist for accurate diagnosis",
                timing="As soon as possible for accurate diagnosis",
                safety_notes="Professional diagnosis is recommended for proper treatment"
            ),
            TreatmentOption(
                method="cultural",
                treatment="General plant health maintenance",
                application="Maintain proper plant care practices while seeking expert advice",
                timing="Ongoing",
                safety_notes="Monitor plant condition and remove severely affected parts if necessary"
            ),
            TreatmentOption(
                method="organic",
                treatment="Preventive organic treatment",
                application="Apply neem oil or insecticidal soap as a general preventive measure",
                timing="Early morning or evening application",
                safety_notes="Test on small area first; follow product instructions"
            )
        ],
        prevention_tips=[
            "Monitor plants regularly for early detection of issues",
            "Maintain good plant hygiene and proper spacing",
            "Ensure adequate but not excessive watering",
            "Provide appropriate lighting and nutrition",
            "Remove affected plant material promptly",
            "Practice crop rotation when possible",
            "Keep detailed records of symptoms and environmental conditions",
            "Take multiple photos from different angles for expert consultation"
        ],
        expert_resources=get_fallback_expert_resources(),
        confidence_level="low",
        api_source="service_error_fallback"
    )

@app.post("/predict")
def predict_crop_enhanced(request: PredictionRequest):
    """Enhanced prediction endpoint with soil-specific recommendations."""
    try:
        # Validate input ranges
        if not (0 <= request.ph <= 14):
            raise HTTPException(status_code=422, detail="pH value must be between 0 and 14")
        
        if not (0 <= request.humidity <= 100):
            raise HTTPException(status_code=422, detail="Humidity must be between 0 and 100%")
        
        if request.temperature < -50 or request.temperature > 60:
            raise HTTPException(status_code=422, detail="Temperature must be between -50°C and 60°C")
        
        for field, value in [("N", request.N), ("P", request.P), ("K", request.K), ("rainfall", request.rainfall)]:
            if value < 0:
                raise HTTPException(status_code=422, detail=f"{field} value cannot be negative")

        # Extract features for ML model
        input_data = [
            request.N, request.P, request.K, 
            request.temperature, request.humidity, 
            request.ph, request.rainfall
        ]
        
        # Validate input data
        if any(np.isnan(input_data)) or any(np.isinf(input_data)):
            raise HTTPException(status_code=422, detail="Invalid numeric values provided")
        
        input_array = np.array(input_data).reshape(1, -1)

        # Get ML model predictions
        try:
            probs = model.predict_proba(input_array)[0]
        except Exception as model_error:
            print(f"Model prediction error: {model_error}")
            raise HTTPException(status_code=500, detail="Error occurred during crop prediction")
        
        top3_idx = np.argsort(probs)[::-1][:3]

        top3 = [
            {
                "crop": label_encoder.inverse_transform([idx])[0],
                "prob": round(float(probs[idx]), 4)
            }
            for idx in top3_idx
        ]

        # Base response
        response_data = {
            "crop": top3[0]["crop"],
            "top3": top3,
            "probs": {
                label_encoder.inverse_transform([i])[0]: round(float(p), 4) 
                for i, p in enumerate(probs)
            },
            "model_version": "1.0"
        }

        # Add soil-specific advice if soil type is provided and valid
        if request.soil_type:
            if not validate_soil_type(request.soil_type):
                # Don't fail the request, just log the warning
                print(f"Warning: Invalid soil type provided: {request.soil_type}")
            else:
                try:
                    soil_advice = generate_soil_advice(top3[0]["crop"], request.soil_type)
                    if soil_advice:
                        response_data["soil_specific_advice"] = {
                            "compatibility_score": soil_advice.compatibility_score,
                            "amendments": [
                                {
                                    "name": amendment.name,
                                    "purpose": amendment.purpose,
                                    "application_rate": amendment.application_rate,
                                    "timing": amendment.timing
                                }
                                for amendment in soil_advice.amendments
                            ],
                            "irrigation_tips": {
                                "frequency": soil_advice.irrigation_tips.frequency,
                                "duration": soil_advice.irrigation_tips.duration,
                                "method": soil_advice.irrigation_tips.method,
                                "special_notes": soil_advice.irrigation_tips.special_notes
                            },
                            "warnings": soil_advice.warnings,
                            "variety_recommendations": soil_advice.variety_recommendations
                        }
                except Exception as soil_error:
                    print(f"Error generating soil advice: {soil_error}")
                    # Continue without soil advice if there's an error

        return response_data
    
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Unexpected error in prediction endpoint: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred during prediction")

# Legacy endpoint for backward compatibility
@app.post("/predict-legacy")
def predict_crop_legacy(features: Features):
    """Legacy prediction endpoint for backward compatibility."""
    try:
        input_data = [getattr(features, col) for col in feature_order]
        input_array = np.array(input_data).reshape(1, -1)

        probs = model.predict_proba(input_array)[0]
        top3_idx = np.argsort(probs)[::-1][:3]

        top3 = [
            {"crop": label_encoder.inverse_transform([idx])[0], "prob": round(float(probs[idx]), 4)}
            for idx in top3_idx
        ]

        return {
            "crop": top3[0]["crop"],
            "top3": top3,
            "probs": {label_encoder.inverse_transform([i])[0]: round(float(p), 4) for i, p in enumerate(probs)},
            "model_version": "1.0"
        }
    
    except Exception as e:
        return {"error": str(e)}
    


@app.get("/health")
def health():
    # Get disease service status
    try:
        disease_service = get_disease_identification_service()
        disease_status = disease_service.get_service_status()
    except Exception as e:
        print(f"Error getting disease service status: {e}")
        disease_status = {"service_available": False, "error": str(e)}
    
    return {
        "status": "ok",
        "model_loaded": MODEL_PATH.exists(),
        "soil_data_loaded": bool(soil_types_data),
        "supported_soil_types": list(soil_types_data.get('soil_types', {}).keys()) if soil_types_data else [],
        "image_processing_available": True,
        "supported_image_formats": ["image/jpeg", "image/png"],
        "max_image_size_mb": MAX_IMAGE_SIZE / 1024 / 1024,
        "max_image_dimension": MAX_IMAGE_DIMENSION,
        "disease_identification": disease_status
    }

@app.get("/disease-service-status")
def get_disease_service_status():
    """Get detailed status of the disease identification service."""
    try:
        disease_service = get_disease_identification_service()
        return disease_service.get_service_status()
    except Exception as e:
        return {
            "service_available": False,
            "error": str(e),
            "primary_api_available": False,
            "fallback_available": True
        }

@app.get("/soil-types")
def get_soil_types():
    """Get all available soil types and their basic information."""
    if not soil_types_data or 'soil_types' not in soil_types_data:
        return {"error": "Soil types data not available"}
    
    soil_types = {}
    for soil_key, soil_data in soil_types_data['soil_types'].items():
        soil_types[soil_key] = {
            "name": soil_data.get('name', soil_key.title()),
            "characteristics": soil_data.get('characteristics', [])[:2],  # First 2 characteristics
            "water_retention": soil_data.get('water_retention', 'unknown'),
            "drainage": soil_data.get('drainage', 'unknown')
        }
    
    return {"soil_types": soil_types}


