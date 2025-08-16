"""
Test script for Plant.id API integration.

This script tests the Plant.id API client and disease identification service
to ensure proper integration and error handling.
"""

import asyncio
import os
import sys
from pathlib import Path
import json

# Add the app directory to the Python path
sys.path.insert(0, str(Path(__file__).parent))

from plant_id_client import PlantIdClient, FallbackApiClient, create_plant_id_client, create_fallback_client
from disease_identification_service import DiseaseIdentificationService, get_disease_identification_service

async def test_plant_id_client():
    """Test the Plant.id API client functionality."""
    print("Testing Plant.id API Client...")
    
    try:
        # Try to create client
        client = create_plant_id_client()
        print("✓ Plant.id client created successfully")
        
        # Test rate limit status
        rate_status = client.get_rate_limit_status()
        print(f"✓ Rate limit status: {rate_status}")
        
        # Test with a small dummy image (1x1 pixel PNG)
        dummy_image = b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\x12IDATx\x9cc```bPPP\x00\x02\xac\x01\x00\x00\x05\x00\x01\r\n-\xdb\x00\x00\x00\x00IEND\xaeB`\x82'
        
        print("Testing API call with dummy image...")
        result = await client.identify_disease(dummy_image, "tomato", "test_location")
        
        if result["success"]:
            print("✓ API call successful")
            print(f"  Confidence level: {result['confidence_level']}")
            print(f"  API source: {result['api_source']}")
        else:
            print(f"⚠ API call failed: {result.get('error', 'Unknown error')}")
            print(f"  Error type: {result.get('error_type', 'Unknown')}")
        
    except ValueError as e:
        print(f"⚠ Plant.id client not available: {e}")
        print("  This is expected if PLANT_ID_API_KEY is not set")
    except Exception as e:
        print(f"✗ Error testing Plant.id client: {e}")

async def test_fallback_client():
    """Test the fallback client functionality."""
    print("\nTesting Fallback Client...")
    
    try:
        client = create_fallback_client()
        print("✓ Fallback client created successfully")
        
        # Test with dummy image
        dummy_image = b"dummy_image_data"
        result = await client.identify_disease(dummy_image, "tomato", "test_location")
        
        if result["success"]:
            print("✓ Fallback identification successful")
            print(f"  Fallback mode: {result.get('fallback_mode', False)}")
            print(f"  API source: {result['api_source']}")
        else:
            print(f"✗ Fallback identification failed: {result.get('error', 'Unknown error')}")
        
    except Exception as e:
        print(f"✗ Error testing fallback client: {e}")

async def test_disease_identification_service():
    """Test the disease identification service."""
    print("\nTesting Disease Identification Service...")
    
    try:
        service = get_disease_identification_service()
        print("✓ Disease identification service created successfully")
        
        # Test service status
        status = service.get_service_status()
        print(f"✓ Service status: {json.dumps(status, indent=2)}")
        
        # Test identification with dummy image
        dummy_image = b"dummy_image_data"
        result = await service.identify_disease(dummy_image, "tomato", "test_location", "test_info")
        
        print("✓ Disease identification completed")
        print(f"  Matches found: {len(result['matches'])}")
        print(f"  Treatments available: {len(result['treatments'])}")
        print(f"  Prevention tips: {len(result['prevention_tips'])}")
        print(f"  Confidence level: {result['confidence_level']}")
        print(f"  API source: {result['api_source']}")
        
        if result.get('fallback_mode'):
            print("  ⚠ Running in fallback mode")
        
    except Exception as e:
        print(f"✗ Error testing disease identification service: {e}")

def test_environment_setup():
    """Test environment setup and configuration."""
    print("Testing Environment Setup...")
    
    # Check for API key
    api_key = os.getenv('PLANT_ID_API_KEY')
    if api_key:
        print("✓ PLANT_ID_API_KEY environment variable is set")
        print(f"  Key length: {len(api_key)} characters")
    else:
        print("⚠ PLANT_ID_API_KEY environment variable not set")
        print("  The service will run in fallback mode only")
    
    # Check for .env file
    env_file = Path(__file__).parent.parent / ".env"
    if env_file.exists():
        print("✓ .env file found")
    else:
        print("⚠ .env file not found")
        print("  Create .env file from .env.example if needed")
    
    # Check for pest/disease data
    data_paths = [
        Path(__file__).parent.parent.parent / "src" / "data" / "pestsAndDiseases.json",
        Path(__file__).parent / "pestsAndDiseases.json"
    ]
    
    data_found = False
    for data_path in data_paths:
        if data_path.exists():
            print(f"✓ Pest/disease data found at: {data_path}")
            data_found = True
            break
    
    if not data_found:
        print("⚠ Pest/disease data file not found")
        print("  Service will use minimal fallback data")

async def main():
    """Run all tests."""
    print("Plant.id API Integration Test Suite")
    print("=" * 50)
    
    # Test environment setup
    test_environment_setup()
    print()
    
    # Test clients
    await test_plant_id_client()
    await test_fallback_client()
    
    # Test service
    await test_disease_identification_service()
    
    print("\n" + "=" * 50)
    print("Test suite completed!")
    print("\nNotes:")
    print("- If PLANT_ID_API_KEY is not set, only fallback mode will work")
    print("- Set up your .env file with a valid Plant.id API key for full functionality")
    print("- The service gracefully falls back when the primary API is unavailable")

if __name__ == "__main__":
    asyncio.run(main())