import pytest
import json
import numpy as np
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app

client = TestClient(app)

class TestSoilTypeIntegration:
    """Integration tests for soil type functionality"""
    
    @patch('main.model')
    @patch('main.label_encoder')
    @patch('main.soil_types_data')
    def test_complete_prediction_flow_with_soil_type(self, mock_soil_data, mock_encoder, mock_model):
        """Test complete prediction flow with soil type integration"""
        
        # Setup mock data
        mock_soil_data.return_value = {
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
                }
            },
            "compatibility_matrix": {
                "wheat": {
                    "sandy": {"score": 0.6, "warnings": ["May need fertilization"]}
                }
            }
        }
        
        # Setup model mocks
        mock_model.predict_proba.return_value = np.array([[0.1, 0.8, 0.1]])
        mock_encoder.inverse_transform.side_effect = lambda x: ["wheat"] if x == [1] else ["corn", "wheat", "rice"]
        
        # Test payload
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
        
        # Make request
        response = client.post("/predict", json=payload)
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        
        # Check basic prediction
        assert "crop" in data
        assert "top3" in data
        assert len(data["top3"]) == 3
        
        # Check soil-specific advice
        assert "soil_specific_advice" in data
        soil_advice = data["soil_specific_advice"]
        
        assert soil_advice["compatibility_score"] == 0.6
        assert len(soil_advice["amendments"]) == 1
        assert soil_advice["amendments"][0]["name"] == "Organic compost"
        assert soil_advice["irrigation_tips"]["frequency"] == "Daily watering"
        assert "May need fertilization" in soil_advice["warnings"]
        assert len(soil_advice["variety_recommendations"]) > 0
    
    @patch('main.model')
    @patch('main.label_encoder')
    def test_prediction_without_soil_type(self, mock_encoder, mock_model):
        """Test prediction flow without soil type"""
        
        # Setup model mocks
        mock_model.predict_proba.return_value = np.array([[0.1, 0.8, 0.1]])
        mock_encoder.inverse_transform.side_effect = lambda x: ["wheat"] if x == [1] else ["corn", "wheat", "rice"]
        
        # Test payload without soil type
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 180.0
        }
        
        # Make request
        response = client.post("/predict", json=payload)
        
        # Verify response
        assert response.status_code == 200
        data = response.json()
        
        # Check basic prediction exists
        assert "crop" in data
        assert "top3" in data
        
        # Check no soil-specific advice
        assert "soil_specific_advice" not in data
    
    @patch('main.model')
    @patch('main.label_encoder')
    def test_prediction_with_invalid_soil_type(self, mock_encoder, mock_model):
        """Test prediction with invalid soil type"""
        
        # Setup model mocks
        mock_model.predict_proba.return_value = np.array([[0.1, 0.8, 0.1]])
        mock_encoder.inverse_transform.side_effect = lambda x: ["wheat"] if x == [1] else ["corn", "wheat", "rice"]
        
        # Test payload with invalid soil type
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 6.5,
            "rainfall": 180.0,
            "soil_type": "invalid_soil"
        }
        
        # Make request
        response = client.post("/predict", json=payload)
        
        # Verify response - should succeed but without soil advice
        assert response.status_code == 200
        data = response.json()
        
        assert "crop" in data
        assert "soil_specific_advice" not in data
    
    def test_input_validation_integration(self):
        """Test input validation across different scenarios"""
        
        # Test invalid pH
        payload = {
            "N": 90,
            "P": 42,
            "K": 43,
            "temperature": 22.4,
            "humidity": 82.0,
            "ph": 15.0,  # Invalid
            "rainfall": 180.0,
            "soil_type": "sandy"
        }
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "pH value must be between 0 and 14" in response.json()["detail"]
        
        # Test invalid humidity
        payload["ph"] = 6.5
        payload["humidity"] = 150.0  # Invalid
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "Humidity must be between 0 and 100%" in response.json()["detail"]
        
        # Test negative values
        payload["humidity"] = 82.0
        payload["N"] = -10  # Invalid
        
        response = client.post("/predict", json=payload)
        assert response.status_code == 422
        assert "cannot be negative" in response.json()["detail"]
    
    @patch('main.soil_types_data')
    def test_health_endpoint_integration(self, mock_soil_data):
        """Test health endpoint with soil data integration"""
        
        # Test with soil data loaded
        mock_soil_data.return_value = {
            "soil_types": {
                "sandy": {"name": "Sandy"},
                "clay": {"name": "Clay"}
            }
        }
        
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "ok"
        assert data["soil_data_loaded"] == True
        assert "sandy" in data["supported_soil_types"]
        assert "clay" in data["supported_soil_types"]
        
        # Test without soil data
        mock_soil_data.return_value = {}
        
        response = client.get("/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["soil_data_loaded"] == False
        assert data["supported_soil_types"] == []
    
    @patch('main.soil_types_data')
    def test_soil_types_endpoint_integration(self, mock_soil_data):
        """Test soil types information endpoint"""
        
        # Test with soil data
        mock_soil_data.return_value = {
            "soil_types": {
                "sandy": {
                    "name": "Sandy",
                    "characteristics": ["Large particles", "Good drainage", "Low retention"],
                    "water_retention": "low",
                    "drainage": "excellent"
                },
                "clay": {
                    "name": "Clay",
                    "characteristics": ["Small particles", "High retention", "Poor drainage"],
                    "water_retention": "high",
                    "drainage": "poor"
                }
            }
        }
        
        response = client.get("/soil-types")
        assert response.status_code == 200
        
        data = response.json()
        assert "soil_types" in data
        
        # Check sandy soil data
        sandy = data["soil_types"]["sandy"]
        assert sandy["name"] == "Sandy"
        assert sandy["water_retention"] == "low"
        assert sandy["drainage"] == "excellent"
        assert len(sandy["characteristics"]) == 2  # Should be truncated to first 2
        
        # Check clay soil data
        clay = data["soil_types"]["clay"]
        assert clay["name"] == "Clay"
        assert clay["water_retention"] == "high"
        assert clay["drainage"] == "poor"
    
    @patch('main.model')
    @patch('main.label_encoder')
    @patch('main.soil_types_data')
    def test_error_handling_integration(self, mock_soil_data, mock_encoder, mock_model):
        """Test error handling in integrated flow"""
        
        # Setup mocks
        mock_soil_data.return_value = {
            "soil_types": {
                "sandy": {
                    "name": "Sandy",
                    "amendments": [],  # Empty amendments
                    "irrigation_guidance": {
                        "frequency": "Daily",
                        "duration": "15 min",
                        "method": "Drip",
                        "special_notes": "Notes"
                    }
                }
            },
            "compatibility_matrix": {
                "wheat": {
                    "sandy": {"score": 0.6, "warnings": []}
                }
            }
        }
        
        # Test model error handling
        mock_model.predict_proba.side_effect = Exception("Model error")
        
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
        assert response.status_code == 500
        assert "Error occurred during crop prediction" in response.json()["detail"]
    
    @patch('main.model')
    @patch('main.label_encoder')
    @patch('main.soil_types_data')
    def test_soil_advice_generation_edge_cases(self, mock_soil_data, mock_encoder, mock_model):
        """Test soil advice generation with edge cases"""
        
        # Setup model mocks
        mock_model.predict_proba.return_value = np.array([[0.1, 0.8, 0.1]])
        mock_encoder.inverse_transform.side_effect = lambda x: ["wheat"] if x == [1] else ["corn", "wheat", "rice"]
        
        # Test with minimal soil data
        mock_soil_data.return_value = {
            "soil_types": {
                "sandy": {
                    "name": "Sandy",
                    "amendments": [],  # No amendments
                    "irrigation_guidance": {
                        "frequency": "Daily",
                        "duration": "15 min",
                        "method": "Drip",
                        "special_notes": "Notes"
                    }
                }
            },
            "compatibility_matrix": {
                "wheat": {
                    "sandy": {"score": 0.8, "warnings": []}  # No warnings
                }
            }
        }
        
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
        soil_advice = data["soil_specific_advice"]
        
        # Should handle empty amendments and warnings gracefully
        assert soil_advice["compatibility_score"] == 0.8
        assert soil_advice["amendments"] == []
        assert soil_advice["warnings"] == []
        assert len(soil_advice["variety_recommendations"]) > 0  # Should still have variety recommendations


class TestCORSIntegration:
    """Test CORS integration"""
    
    def test_cors_headers_present(self):
        """Test that CORS headers are properly set"""
        response = client.options("/predict")
        
        # Should allow CORS preflight
        assert response.status_code in [200, 204]
        
        # Test actual request with origin
        headers = {"Origin": "http://localhost:5173"}
        response = client.get("/health", headers=headers)
        
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v"])