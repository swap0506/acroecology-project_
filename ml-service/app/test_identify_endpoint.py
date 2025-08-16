"""
Test script for the /identify endpoint integration.

This script tests the complete integration of the Plant.id API
with the FastAPI endpoint to ensure everything works together.
"""

import asyncio
import sys
from pathlib import Path
import io
from PIL import Image
import httpx
import pytest

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

def create_test_image() -> bytes:
    """Create a simple test image for testing."""
    # Create a simple 100x100 green image
    image = Image.new('RGB', (100, 100), color='green')
    
    # Save to bytes
    img_bytes = io.BytesIO()
    image.save(img_bytes, format='JPEG', quality=95)
    img_bytes.seek(0)
    
    return img_bytes.getvalue()

@pytest.mark.asyncio
async def test_identify_endpoint():
    """Test the /identify endpoint with a test image."""
    print("Testing /identify endpoint...")
    
    # Create test image
    test_image_data = create_test_image()
    print(f"✓ Created test image ({len(test_image_data)} bytes)")
    
    # Test the endpoint
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # Prepare multipart form data
            files = {
                'image': ('test_plant.jpg', test_image_data, 'image/jpeg')
            }
            data = {
                'crop_type': 'tomato',
                'location': 'test_location',
                'additional_info': 'Test image for API integration'
            }
            
            print("Making request to /identify endpoint...")
            response = await client.post(
                "http://localhost:8000/identify",
                files=files,
                data=data
            )
            
            if response.status_code == 200:
                result = response.json()
                print("✓ Endpoint responded successfully")
                print(f"  Status code: {response.status_code}")
                print(f"  Matches found: {len(result.get('matches', []))}")
                print(f"  Treatments available: {len(result.get('treatments', []))}")
                print(f"  Prevention tips: {len(result.get('prevention_tips', []))}")
                print(f"  Confidence level: {result.get('confidence_level', 'unknown')}")
                print(f"  API source: {result.get('api_source', 'unknown')}")
                
                # Show first match details
                if result.get('matches'):
                    first_match = result['matches'][0]
                    print(f"  First match: {first_match.get('name', 'Unknown')}")
                    print(f"  Category: {first_match.get('category', 'Unknown')}")
                    print(f"  Confidence: {first_match.get('confidence', 0.0)}")
                
                return True
            else:
                print(f"✗ Endpoint returned error: {response.status_code}")
                print(f"  Response: {response.text}")
                return False
                
    except httpx.ConnectError:
        print("✗ Could not connect to server")
        print("  Make sure the FastAPI server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"✗ Error testing endpoint: {e}")
        return False

@pytest.mark.asyncio
async def test_health_endpoint():
    """Test the /health endpoint to check service status."""
    print("\nTesting /health endpoint...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:8000/health")
            
            if response.status_code == 200:
                result = response.json()
                print("✓ Health endpoint responded successfully")
                print(f"  Status: {result.get('status', 'unknown')}")
                print(f"  Image processing available: {result.get('image_processing_available', False)}")
                
                disease_status = result.get('disease_identification', {})
                print(f"  Disease service available: {disease_status.get('service_available', False)}")
                print(f"  Primary API available: {disease_status.get('primary_api_available', False)}")
                print(f"  Fallback available: {disease_status.get('fallback_available', False)}")
                print(f"  Local database loaded: {disease_status.get('local_database_loaded', False)}")
                print(f"  Pest/disease count: {disease_status.get('pest_disease_count', 0)}")
                
                return True
            else:
                print(f"✗ Health endpoint returned error: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("✗ Could not connect to server")
        print("  Make sure the FastAPI server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"✗ Error testing health endpoint: {e}")
        return False

@pytest.mark.asyncio
async def test_disease_service_status_endpoint():
    """Test the /disease-service-status endpoint."""
    print("\nTesting /disease-service-status endpoint...")
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:8000/disease-service-status")
            
            if response.status_code == 200:
                result = response.json()
                print("✓ Disease service status endpoint responded successfully")
                print(f"  Service available: {result.get('service_available', False)}")
                print(f"  Primary API available: {result.get('primary_api_available', False)}")
                print(f"  Fallback available: {result.get('fallback_available', False)}")
                print(f"  Local database loaded: {result.get('local_database_loaded', False)}")
                print(f"  Pest/disease count: {result.get('pest_disease_count', 0)}")
                
                if 'rate_limit_status' in result:
                    rate_status = result['rate_limit_status']
                    print(f"  Rate limit - Requests this minute: {rate_status.get('requests_made_this_minute', 0)}")
                    print(f"  Rate limit - Daily requests: {rate_status.get('daily_requests', 0)}")
                    print(f"  Rate limit - Can make request: {rate_status.get('can_make_request', False)}")
                
                return True
            else:
                print(f"✗ Disease service status endpoint returned error: {response.status_code}")
                return False
                
    except httpx.ConnectError:
        print("✗ Could not connect to server")
        print("  Make sure the FastAPI server is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"✗ Error testing disease service status endpoint: {e}")
        return False

async def main():
    """Run all endpoint tests."""
    print("Plant.id API Endpoint Integration Test")
    print("=" * 50)
    
    # Test health endpoint first
    health_ok = await test_health_endpoint()
    
    # Test disease service status
    status_ok = await test_disease_service_status_endpoint()
    
    # Test main identify endpoint
    identify_ok = await test_identify_endpoint()
    
    print("\n" + "=" * 50)
    print("Endpoint Test Results:")
    print(f"  Health endpoint: {'✓ PASS' if health_ok else '✗ FAIL'}")
    print(f"  Disease status endpoint: {'✓ PASS' if status_ok else '✗ FAIL'}")
    print(f"  Identify endpoint: {'✓ PASS' if identify_ok else '✗ FAIL'}")
    
    if all([health_ok, status_ok, identify_ok]):
        print("\n🎉 All tests passed! The Plant.id API integration is working correctly.")
    else:
        print("\n⚠ Some tests failed. Check the server is running and try again.")
    
    print("\nTo start the server, run:")
    print("  cd ml-service")
    print("  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000")

if __name__ == "__main__":
    asyncio.run(main())