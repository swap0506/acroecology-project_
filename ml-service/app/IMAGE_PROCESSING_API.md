# Image Processing API Documentation

## Overview

The image processing endpoint provides plant image analysis capabilities for pest and disease identification. This endpoint handles image upload, validation, optimization, and prepares images for third-party API analysis.

## Endpoint

### POST /identify

Process uploaded plant image for pest and disease identification.

#### Request

**Content-Type:** `multipart/form-data`

**Parameters:**
- `image` (file, required): Plant image for pest/disease identification
  - Supported formats: JPG, JPEG, PNG
  - Maximum size: 10MB
  - Maximum dimensions: 4096x4096 pixels
- `crop_type` (string, optional): Type of crop (e.g., "tomato", "wheat")
- `location` (string, optional): Geographic location
- `additional_info` (string, optional): Additional information about plant condition

#### Response

**Success Response (200 OK):**
```json
{
  "matches": [
    {
      "name": "string",
      "scientific_name": "string",
      "confidence": 0.95,
      "category": "pest|disease|deficiency|healthy",
      "description": "string",
      "symptoms": ["string"],
      "images": ["string"]
    }
  ],
  "treatments": [
    {
      "method": "organic|chemical|cultural",
      "treatment": "string",
      "application": "string",
      "timing": "string",
      "safety_notes": "string"
    }
  ],
  "prevention_tips": ["string"],
  "expert_resources": [
    {
      "name": "string",
      "contact": "string",
      "type": "extension_service|consultant|university",
      "location": "string"
    }
  ],
  "confidence_level": "high|medium|low",
  "api_source": "string"
}
```

**Error Response (422 Unprocessable Entity):**
```json
{
  "detail": {
    "error_type": "validation_error|file_read_error|empty_file_error|image_processing_error",
    "message": "string",
    "suggestions": ["string"],
    "errors": ["string"]
  }
}
```

**Error Response (500 Internal Server Error):**
```json
{
  "detail": {
    "error_type": "internal_server_error|storage_error",
    "message": "string",
    "suggestions": ["string"],
    "fallback_available": true,
    "expert_contacts": [
      {
        "name": "string",
        "contact": "string",
        "type": "string",
        "location": "string"
      }
    ]
  }
}
```

## Features

### Image Validation
- File format validation (JPG, PNG only)
- File size limits (10MB maximum)
- Content type verification
- Image integrity checks

### Image Optimization
- Automatic image resizing for large images
- Quality optimization based on file size
- Format conversion to JPEG for processing
- Compression ratio reporting

### Security Features
- File type validation
- Size limits enforcement
- Temporary file management
- Safe image processing with PIL

### Error Handling
- Comprehensive error categorization
- User-friendly error messages
- Recovery suggestions
- Fallback expert resources

## Usage Examples

### cURL Example
```bash
curl -X POST "http://localhost:8000/identify" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "image=@plant_image.jpg;type=image/jpeg" \
  -F "crop_type=tomato" \
  -F "location=California"
```

### Python Example
```python
import requests

url = "http://localhost:8000/identify"
files = {"image": ("plant.jpg", open("plant.jpg", "rb"), "image/jpeg")}
data = {"crop_type": "tomato", "location": "California"}

response = requests.post(url, files=files, data=data)
result = response.json()
```

### JavaScript Example
```javascript
const formData = new FormData();
formData.append('image', imageFile);
formData.append('crop_type', 'tomato');
formData.append('location', 'California');

fetch('/identify', {
  method: 'POST',
  body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## Current Status

**Note:** This endpoint currently returns mock data for testing purposes. The actual third-party API integration for plant disease identification will be implemented in the next development phase (Task 4: Integrate third-party image recognition API).

The endpoint is fully functional for:
- Image upload and validation
- File processing and optimization
- Error handling and response formatting
- Security checks and temporary storage

## Health Check

The `/health` endpoint includes image processing status:

```bash
curl http://localhost:8000/health
```

Response includes:
- `image_processing_available`: Boolean indicating if image processing is enabled
- `supported_image_formats`: List of supported image MIME types
- `max_image_size_mb`: Maximum allowed image size in MB
- `max_image_dimension`: Maximum allowed image dimension in pixels

## Testing

Run the test suite to verify endpoint functionality:

```bash
# Unit tests
python test_image_processing.py

# Integration tests
python test_image_endpoint_integration.py

# Server startup test
python test_server_start.py
```

All tests should pass, confirming that the image processing endpoint is ready for third-party API integration.