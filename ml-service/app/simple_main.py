"""
Simple FastAPI server for testing the pest identification API
"""

from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from pathlib import Path
import json

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Pest Disease Identification API",
    description="API for identifying plant pests and diseases",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load sample data
APP_DIR = Path(__file__).resolve().parent

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Pest Disease Identification API", "status": "running"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "pest-disease-identification",
        "version": "1.0.0"
    }

@app.post("/api/identify")
async def identify_pest_disease(
    image: UploadFile = File(...),
    crop_type: str = Form(default="general"),
    location: str = Form(default=""),
    additional_info: str = Form(default="")
):
    """
    Identify pest or disease from uploaded image
    """
    try:
        logger.info(f"Received identification request for crop: {crop_type}")
        
        # Validate image file
        if not image.content_type or not image.content_type.startswith('image/'):
            raise HTTPException(status_code=422, detail="Invalid image file format")
        
        # Read image data
        image_data = await image.read()
        
        if len(image_data) == 0:
            raise HTTPException(status_code=422, detail="Empty image file")
        
        # For now, return a mock response
        # In production, this would call the actual ML model
        mock_response = {
            "matches": [
                {
                    "name": "Common Plant Issue",
                    "scientific_name": "Plantus problematicus",
                    "confidence": 0.75,
                    "category": "disease",
                    "description": "This appears to be a common plant health issue. The identification service is working correctly.",
                    "symptoms": [
                        "Visible discoloration on leaves",
                        "Possible stress indicators",
                        "General plant health concerns"
                    ],
                    "images": []
                }
            ],
            "treatments": [
                {
                    "method": "organic",
                    "treatment": "Neem oil spray",
                    "application": "Spray on affected areas in early morning or evening",
                    "timing": "Apply every 7-10 days until improvement is seen",
                    "safety_notes": "Test on a small area first. Avoid spraying in direct sunlight."
                },
                {
                    "method": "cultural",
                    "treatment": "Improve plant care",
                    "application": "Ensure proper watering, lighting, and nutrition",
                    "timing": "Ongoing maintenance",
                    "safety_notes": "Monitor plant response to changes in care routine."
                }
            ],
            "prevention_tips": [
                "Monitor plants regularly for early detection",
                "Maintain proper plant spacing for air circulation",
                "Water at soil level to avoid wetting leaves",
                "Remove affected plant material promptly",
                "Practice good garden hygiene"
            ],
            "expert_resources": [
                {
                    "name": "Local Agricultural Extension Service",
                    "contact": "Contact your local county extension office",
                    "type": "extension_service",
                    "location": "Local"
                },
                {
                    "name": "Plant Disease Diagnostic Lab",
                    "contact": "Submit samples to your state's diagnostic laboratory",
                    "type": "university",
                    "location": "State University"
                }
            ],
            "confidence_level": "medium",
            "api_source": "test_service",
            "fallback_mode": False,
            "message": "Test identification completed successfully"
        }
        
        logger.info("Identification completed successfully")
        return mock_response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error during identification: {str(e)}")
        raise HTTPException(
            status_code=500, 
            detail={
                "message": "Internal server error during identification",
                "error_type": "server_error"
            }
        )

@app.get("/api/status")
async def get_service_status():
    """Get service status and statistics"""
    return {
        "service_available": True,
        "primary_api_available": False,  # Mock service
        "fallback_available": True,
        "local_database_loaded": True,
        "pest_disease_count": 50  # Mock count
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)