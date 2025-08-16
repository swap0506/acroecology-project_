import pytest
import json
from unittest.mock import patch, mock_open
from fastapi.testclient import TestClient
from main import (
    app, 
    get_soil_type_data, 
    get_compatibility_score, 
    generate_variety_recommendations,
    generate_soil_advice,
    validate_soil_type,
    get_suitable_crops_for_soil,
    get_soil_characteristics
)

client = TestClient(app)

# Mock soil types data for testing
MOCK_SOIL_DATA = {
    "soil_types": {
        "sandy": {
            "name": "Sandy",
            "characteristics": ["Large particles", "Good drainage"],
            "water_retention": "low",
            "drainage": "excellent",
            "suitable_crops": ["carrots", "potatoes"],
            "amendments": [
                {
                    "name": "Organic compost",
                    "purpose": "Improve water retention",
                    "application_rate": "2-4 inches",
                    "timing": "Spring"
                }
            ],
            "irrigation_guidance": {
                "frequency": "Daily watering",
                "duration": "15-20 minutes",
                "method": "Drip irrigation",
                "special_notes": "Water frequently"
            }
        },
        "clay": {
            "name": "Clay",
            "characteristics": ["Small particles", "High retention"],
            "water_retention": "high",
            "drainage": "poor",
            "suitable_crops": ["rice", "wheat"],
            "amendments": [],
            "irrigation_guidance": {
                "frequency": "2-3 times per week",
                "duration": "30-45 minutes",
                "method": "Soaker hoses",
                "special_notes": "Deep watering"
            }
        }
    },
    "compatibility_matrix": {
        "wheat": {
            "sandy": {"score": 0.6, "warnings": ["May need fertilization"]},
            "clay": {"score": 0.8, "warnings": []}
        },
        "carrots": {
            "sandy": {"score": 0.9, "warnings": []},
            "clay": {"score": 0.3, "warnings": ["Heavy soil causes forked roots"]}
        }
    }
}

class TestSoilUtilityFunctions:
    """Test soil utility functions"""
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_soil_type_data_valid(self):
        """Test getting valid soil type data"""
        result = get_soil_type_data("sandy")
        assert result["name"] == "Sandy"
        assert result["water_retention"] == "low"
        assert "carrots" in result["suitable_crops"]
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_soil_type_data_invalid(self):
        """Test getting invalid soil type data"""
        result = get_soil_type_data("invalid")
        assert result == {}
    
    @patch('main.soil_types_data', {})
    def test_get_soil_type_data_no_data(self):
        """Test getting soil type data when no data is loaded"""
        result = get_soil_type_data("sandy")
        assert result == {}
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_validate_soil_type_valid(self):
        """Test validating valid soil types"""
        assert validate_soil_type("sandy") == True
        assert validate_soil_type("clay") == True
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_validate_soil_type_invalid(self):
        """Test validating invalid soil types"""
        assert validate_soil_type("invalid") == False
        assert validate_soil_type("") == False
    
    @patch('main.soil_types_data', {})
    def test_validate_soil_type_no_data(self):
        """Test validating soil type when no data is loaded"""
        assert validate_soil_type("sandy") == False
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_compatibility_score_valid(self):
        """Test getting compatibility score for valid combination"""
        result = get_compatibility_score("wheat", "sandy")
        assert result["score"] == 0.6
        assert "May need fertilization" in result["warnings"]
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_compatibility_score_no_warnings(self):
        """Test getting compatibility score with no warnings"""
        result = get_compatibility_score("wheat", "clay")
        assert result["score"] == 0.8
        assert result["warnings"] == []
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_compatibility_score_unknown_crop(self):
        """Test getting compatibility score for unknown crop"""
        result = get_compatibility_score("unknown", "sandy")
        assert result["score"] == 0.5
        assert "not available" in result["warnings"][0]
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_suitable_crops_for_soil(self):
        """Test getting suitable crops for soil type"""
        crops = get_suitable_crops_for_soil("sandy")
        assert "carrots" in crops
        assert "potatoes" in crops
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_get_soil_characteristics(self):
        """Test getting soil characteristics"""
        characteristics = get_soil_characteristics("sandy")
        assert "Large particles" in characteristics
        assert "Good drainage" in characteristics
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_generate_variety_recommendations(self):
        """Test generating variety recommendations"""
        recommendations = generate_variety_recommendations("wheat", "sandy")
        assert len(recommendations) > 0
        assert any("drought" in rec.lower() for rec in recommendations)
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_generate_soil_advice_complete(self):
        """Test generating complete soil advice"""
        advice = generate_soil_advice("wheat", "sandy")
        assert advice is not None
        assert advice.compatibility_score == 0.6
        assert len(advice.amendments) == 1
        assert advice.amendments[0].name == "Organic compost"
        assert advice.irrigation_tips.frequency == "Daily watering"
        assert "May need fertilization" in advice.warnings
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_generate_soil_advice_invalid_soil(self):
        """Test generating soil advice for invalid soil type"""
        advice = generate_soil_advice("wheat", "invalid")
        assert advice is None


class TestPredictionEndpoint:
    """Test the enhanced prediction endpoint"""
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    @patch('main.model')
    @patch('main.label_encoder')
    def test_prediction_with_soil_type(self, mock_encoder, mock_model):
        """Test prediction endpoint with soil type"""
        # Mock model predictions
        mock_model.predict_proba.return_value = [[0.1, 0.8, 0.1]]
        mock_encoder.inverse_transform.return_value = ["wheat"]
        
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 180.0,
            "soil_type": "sandy"
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "crop" in data
        assert "soil_specific_advice" in data
        assert data["soil_specific_advice"]["compatibility_score"] == 0.6
    
    @patch('main.model')
    @patch('main.label_encoder')
    def test_prediction_without_soil_type(self, mock_encoder, mock_model):
        """Test prediction endpoint without soil type"""
        # Mock model predictions
        mock_model.predict_proba.return_value = [[0.1, 0.8, 0.1]]
        mock_encoder.inverse_transform.return_value = ["wheat"]
        
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 180.0
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert "crop" in data
        assert "soil_specific_advice" not in data
    
    def test_prediction_invalid_ph(self):
        """Test prediction with invalid pH value"""
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 15.0,  # Invalid pH > 14
            "rainfall": 180.0
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "pH value must be between 0 and 14" in response.json()["detail"]
    
    def test_prediction_invalid_humidity(self):
        """Test prediction with invalid humidity value"""
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 150.0,  # Invalid humidity > 100
            "ph": 6.5,
            "rainfall": 180.0
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "Humidity must be between 0 and 100%" in response.json()["detail"]
    
    def test_prediction_negative_values(self):
        """Test prediction with negative values"""
        payload = {
            "N": -10,  # Negative value
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 180.0
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "cannot be negative" in response.json()["detail"]


class TestHealthEndpoints:
    """Test health and utility endpoints"""
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_health_endpoint_with_soil_data(self):
        """Test health endpoint when soil data is loaded"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert data["soil_data_loaded"] == True
        assert "sandy" in data["supported_soil_types"]
        assert "clay" in data["supported_soil_types"]
    
    @patch('main.soil_types_data', {})
    def test_health_endpoint_without_soil_data(self):
        """Test health endpoint when soil data is not loaded"""
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["soil_data_loaded"] == False
        assert data["supported_soil_types"] == []
    
    @patch('main.soil_types_data', MOCK_SOIL_DATA)
    def test_soil_types_endpoint(self):
        """Test soil types information endpoint"""
        response = client.get("/soil-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "soil_types" in data
        assert "sandy" in data["soil_types"]
        assert data["soil_types"]["sandy"]["name"] == "Sandy"
        assert data["soil_types"]["sandy"]["water_retention"] == "low"
    
    @patch('main.soil_types_data', {})
    def test_soil_types_endpoint_no_data(self):
        """Test soil types endpoint when no data is available"""
        response = client.get("/soil-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "error" in data
        assert "not available" in data["error"]


if __name__ == "__main__":
    pytest.main([__file__])