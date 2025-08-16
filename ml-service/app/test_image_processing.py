"""
Test script for the image processing endpoint.
"""
import pytest
import tempfile
import os
from PIL import Image
import io
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def create_test_image(format="JPEG", size=(800, 600), color=(255, 0, 0)):
    """Create a test image in memory."""
    image = Image.new("RGB", size, color)
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return buffer

def test_health_endpoint_includes_image_processing():
    """Test that health endpoint includes image processing information."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    
    assert "image_processing_available" in data
    assert data["image_processing_available"] is True
    assert "supported_image_formats" in data
    assert "max_image_size_mb" in data
    assert "max_image_dimension" in data

def test_identify_endpoint_with_valid_jpeg():
    """Test image identification endpoint with valid JPEG image."""
    test_image = create_test_image("JPEG")
    
    response = client.post(
        "/identify",
        files={"image": ("test.jpg", test_image, "image/jpeg")},
        data={"crop_type": "tomato", "location": "test_location"}
    )
    
    assert response.status_code == 200
    data = response.json()
    
    # Verify response structure
    assert "matches" in data
    assert "treatments" in data
    assert "prevention_tips" in data
    assert "expert_resources" in data
    assert "confidence_level" in data
    assert "api_source" in data
    
    # Verify mock data content
    assert len(data["matches"]) > 0
    assert data["matches"][0]["name"] == "Processing Complete"
    assert data["api_source"] == "mock_endpoint_test"

def test_identify_endpoint_with_valid_png():
    """Test image identification endpoint with valid PNG image."""
    test_image = create_test_image("PNG")
    
    response = client.post(
        "/identify",
        files={"image": ("test.png", test_image, "image/png")}
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data

def test_identify_endpoint_with_invalid_format():
    """Test image identification endpoint with invalid file format."""
    # Create a text file instead of an image
    text_content = b"This is not an image file"
    
    response = client.post(
        "/identify",
        files={"image": ("test.txt", io.BytesIO(text_content), "text/plain")}
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "error_type" in data["detail"]
    assert data["detail"]["error_type"] == "validation_error"

def test_identify_endpoint_with_empty_file():
    """Test image identification endpoint with empty file."""
    empty_file = io.BytesIO(b"")
    
    response = client.post(
        "/identify",
        files={"image": ("empty.jpg", empty_file, "image/jpeg")}
    )
    
    assert response.status_code == 422
    data = response.json()
    assert "error_type" in data["detail"]
    assert data["detail"]["error_type"] == "empty_file_error"

def test_identify_endpoint_with_large_image():
    """Test image identification endpoint with large image (should be resized)."""
    # Create a large test image
    large_image = create_test_image("JPEG", size=(5000, 4000))
    
    response = client.post(
        "/identify",
        files={"image": ("large.jpg", large_image, "image/jpeg")}
    )
    
    # Should still work due to image optimization
    assert response.status_code == 200
    data = response.json()
    assert "matches" in data

def test_image_validation_function():
    """Test the image validation utility function."""
    from main import validate_image_file
    from fastapi import UploadFile
    
    # Mock valid file
    class MockFile:
        def __init__(self, content_type, filename, size=1000):
            self.content_type = content_type
            self.filename = filename
            self.size = size
    
    # Test valid JPEG
    valid_jpeg = MockFile("image/jpeg", "test.jpg")
    result = validate_image_file(valid_jpeg)
    assert result["valid"] is True
    assert len(result["errors"]) == 0
    
    # Test invalid format
    invalid_file = MockFile("text/plain", "test.txt")
    result = validate_image_file(invalid_file)
    assert result["valid"] is False
    assert len(result["errors"]) > 0

def test_image_optimization_function():
    """Test the image optimization utility function."""
    from main import optimize_image
    
    # Create test image
    test_image = create_test_image("JPEG", size=(2000, 1500))
    image_data = test_image.getvalue()
    
    # Test optimization
    optimized_data, info = optimize_image(image_data)
    
    assert len(optimized_data) > 0
    assert "original_size" in info
    assert "optimized_size" in info
    assert "compression_ratio" in info
    assert info["original_size"] >= info["optimized_size"]

if __name__ == "__main__":
    # Run basic tests
    print("Running image processing endpoint tests...")
    
    try:
        test_health_endpoint_includes_image_processing()
        print("✓ Health endpoint test passed")
        
        test_identify_endpoint_with_valid_jpeg()
        print("✓ Valid JPEG test passed")
        
        test_identify_endpoint_with_invalid_format()
        print("✓ Invalid format test passed")
        
        test_identify_endpoint_with_empty_file()
        print("✓ Empty file test passed")
        
        test_image_validation_function()
        print("✓ Image validation test passed")
        
        test_image_optimization_function()
        print("✓ Image optimization test passed")
        
        print("\nAll tests passed! ✓")
        
    except Exception as e:
        print(f"Test failed: {e}")
        raise