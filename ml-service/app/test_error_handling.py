"""
Test error handling and fallback mechanisms for the pest identification service.
"""

import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from fastapi.testclient import TestClient
from fastapi import UploadFile
import io
from PIL import Image

from main import app
from disease_identification_service import DiseaseIdentificationService
from plant_id_client import PlantIdApiError

# Create test client
client = TestClient(app)

def create_test_image() -> bytes:
    """Create a simple test image for testing."""
    img = Image.new('RGB', (100, 100), color='green')
    img_bytes = io.BytesIO()
    img.save(img_bytes, format='JPEG')
    return img_bytes.getvalue()

def create_invalid_file() -> bytes:
    """Create an invalid file for testing."""
    return b"This is not an image file"

class TestErrorHandling:
    """Test comprehensive error handling and fallback mechanisms."""

    def test_invalid_file_format_error(self):
        """Test handling of invalid file format."""
        # Create a text file instead of image
        invalid_file = io.BytesIO(b"This is not an image")
        
        response = client.post(
            "/identify",
            files={"image": ("test.txt", invalid_file, "text/plain")},
            data={"crop_type": "tomato"}
        )
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert error_detail["error_type"] == "validation_error"
        assert "Invalid image file" in error_detail["message"]
        assert error_detail["fallback_available"] is True
        assert len(error_detail["suggestions"]) > 0

    def test_empty_file_error(self):
        """Test handling of empty file upload."""
        empty_file = io.BytesIO(b"")
        
        response = client.post(
            "/identify",
            files={"image": ("empty.jpg", empty_file, "image/jpeg")},
            data={"crop_type": "tomato"}
        )
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert error_detail["error_type"] == "empty_file_error"
        assert "empty" in error_detail["message"].lower()

    def test_oversized_file_error(self):
        """Test handling of oversized file upload."""
        # Create a large image (this is simulated since we can't easily create a 10MB+ image)
        large_image = create_test_image()
        
        # Mock the file size validation
        with patch('main.validate_image_file') as mock_validate:
            mock_validate.return_value = {
                "valid": False,
                "errors": ["File size (15.0MB) exceeds maximum allowed size (10MB)"]
            }
            
            response = client.post(
                "/identify",
                files={"image": ("large.jpg", io.BytesIO(large_image), "image/jpeg")},
                data={"crop_type": "tomato"}
            )
            
            assert response.status_code == 422
            error_detail = response.json()["detail"]
            assert error_detail["error_type"] == "validation_error"
            assert "10MB" in str(error_detail["errors"])

    @patch('main.get_disease_identification_service')
    def test_service_unavailable_fallback(self, mock_get_service):
        """Test fallback when disease identification service is unavailable."""
        # Mock service to raise an exception
        mock_service = Mock()
        mock_service.identify_disease = AsyncMock(side_effect=Exception("Service unavailable"))
        mock_service.get_service_status.return_value = {"service_available": False}
        mock_get_service.return_value = mock_service
        
        test_image = create_test_image()
        
        response = client.post(
            "/identify",
            files={"image": ("test.jpg", io.BytesIO(test_image), "image/jpeg")},
            data={"crop_type": "tomato"}
        )
        
        # Should return 200 with fallback result
        assert response.status_code == 200
        result = response.json()
        assert result["confidence_level"] == "low"
        assert result["api_source"] == "service_error_fallback"
        assert len(result["expert_resources"]) > 0
        assert len(result["treatments"]) > 0

    @patch('main.get_disease_identification_service')
    def test_timeout_fallback(self, mock_get_service):
        """Test fallback when service times out."""
        # Mock service to raise timeout
        mock_service = Mock()
        mock_service.identify_disease = AsyncMock(side_effect=asyncio.TimeoutError("Request timeout"))
        mock_service.get_service_status.return_value = {"service_available": True}
        mock_get_service.return_value = mock_service
        
        test_image = create_test_image()
        
        response = client.post(
            "/identify",
            files={"image": ("test.jpg", io.BytesIO(test_image), "image/jpeg")},
            data={"crop_type": "tomato"}
        )
        
        # Should return 200 with timeout fallback result
        assert response.status_code == 200
        result = response.json()
        assert result["confidence_level"] == "low"
        assert result["api_source"] == "timeout_fallback"
        assert "timeout" in result["matches"][0]["name"].lower()

    def test_image_processing_error(self):
        """Test handling of image processing errors."""
        # Create corrupted image data
        corrupted_data = b"JPEG\x00\x00\x00corrupted"
        
        response = client.post(
            "/identify",
            files={"image": ("corrupted.jpg", io.BytesIO(corrupted_data), "image/jpeg")},
            data={"crop_type": "tomato"}
        )
        
        assert response.status_code == 422
        error_detail = response.json()["detail"]
        assert error_detail["error_type"] == "image_processing_error"
        assert error_detail["fallback_available"] is True

    @patch('main.get_disease_identification_service')
    def test_successful_identification_with_low_confidence(self, mock_get_service):
        """Test successful identification but with low confidence."""
        # Mock service to return low confidence result
        mock_service = Mock()
        mock_service.identify_disease = AsyncMock(return_value={
            "matches": [{
                "name": "Possible Plant Issue",
                "scientific_name": None,
                "confidence": 0.2,
                "category": "unknown",
                "description": "Low confidence identification",
                "symptoms": ["Unclear symptoms"],
                "images": []
            }],
            "treatments": [{
                "method": "consultation",
                "treatment": "Expert consultation recommended",
                "application": "Contact local experts",
                "timing": "As soon as possible",
                "safety_notes": "Professional diagnosis recommended"
            }],
            "prevention_tips": ["Monitor plants regularly"],
            "expert_resources": [{
                "name": "Local Extension",
                "contact": "Contact local office",
                "type": "extension_service",
                "location": "Local"
            }],
            "confidence_level": "low",
            "api_source": "plant_id"
        })
        mock_service.get_service_status.return_value = {"service_available": True}
        mock_get_service.return_value = mock_service
        
        test_image = create_test_image()
        
        response = client.post(
            "/identify",
            files={"image": ("test.jpg", io.BytesIO(test_image), "image/jpeg")},
            data={"crop_type": "tomato"}
        )
        
        assert response.status_code == 200
        result = response.json()
        assert result["confidence_level"] == "low"
        assert len(result["expert_resources"]) > 0
        # Low confidence should still provide expert resources

    def test_health_endpoint(self):
        """Test the health endpoint for service status."""
        response = client.get("/health")
        assert response.status_code == 200
        health_data = response.json()
        assert "status" in health_data
        assert "timestamp" in health_data

class TestPlantIdClientErrorHandling:
    """Test Plant.id client error handling."""

    @pytest.mark.asyncio
    async def test_rate_limit_handling(self):
        """Test handling of rate limit errors."""
        from plant_id_client import PlantIdClient, PlantIdApiError
        
        # Mock the API key
        with patch.dict('os.environ', {'PLANT_ID_API_KEY': 'test_key'}):
            client = PlantIdClient()
            
            # Mock rate limit exceeded
            client.rate_limit.requests_made = client.rate_limit.max_requests_per_minute
            
            test_image = create_test_image()
            
            result = await client.identify_disease(test_image)
            
            assert result["success"] is False
            assert result["error_type"] == "rate_limit_exceeded"

    @pytest.mark.asyncio
    async def test_network_error_handling(self):
        """Test handling of network errors."""
        from plant_id_client import PlantIdClient
        
        with patch.dict('os.environ', {'PLANT_ID_API_KEY': 'test_key'}):
            client = PlantIdClient()
            
            # Mock network error
            with patch('httpx.AsyncClient.post', side_effect=Exception("Network error")):
                test_image = create_test_image()
                
                result = await client.identify_disease(test_image)
                
                assert result["success"] is False
                assert "error" in result

class TestFallbackClient:
    """Test fallback client functionality."""

    @pytest.mark.asyncio
    async def test_fallback_client_response(self):
        """Test that fallback client provides comprehensive guidance."""
        from plant_id_client import FallbackApiClient
        
        client = FallbackApiClient()
        test_image = create_test_image()
        
        result = await client.identify_disease(test_image, "tomato", "test_location")
        
        assert result["success"] is True
        assert result["fallback_mode"] is True
        assert result["confidence_level"] == "low"
        assert len(result["suggestions"]) > 0
        assert "additional_guidance" in result
        assert "immediate_actions" in result["additional_guidance"]
        assert "monitoring_tips" in result["additional_guidance"]
        assert "when_to_seek_help" in result["additional_guidance"]

if __name__ == "__main__":
    pytest.main([__file__, "-v"])