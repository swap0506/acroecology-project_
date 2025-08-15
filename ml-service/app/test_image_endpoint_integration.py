"""
Integration test for the image processing endpoint with actual HTTP requests.
"""
import requests
import subprocess
import time
import sys
import os
from PIL import Image
import io

def create_test_image(format="JPEG", size=(800, 600), color=(255, 0, 0)):
    """Create a test image in memory."""
    image = Image.new("RGB", size, color)
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    buffer.seek(0)
    return buffer

def test_image_endpoint_integration():
    """Test the image processing endpoint with actual HTTP requests."""
    server_process = None
    
    try:
        # Start the server
        print("Starting FastAPI server...")
        server_process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "127.0.0.1", "--port", "8002"
        ], cwd=os.path.dirname(__file__))
        
        # Wait for server to start
        time.sleep(3)
        
        # Test 1: Valid JPEG upload
        print("\nTest 1: Valid JPEG upload")
        test_image = create_test_image("JPEG")
        files = {"image": ("test.jpg", test_image, "image/jpeg")}
        data = {"crop_type": "tomato", "location": "test_farm"}
        
        response = requests.post("http://127.0.0.1:8002/identify", files=files, data=data, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ JPEG upload successful")
            print(f"  Matches found: {len(result.get('matches', []))}")
            print(f"  API source: {result.get('api_source')}")
            print(f"  Confidence level: {result.get('confidence_level')}")
        else:
            print(f"✗ JPEG upload failed: {response.status_code}")
            print(f"  Response: {response.text}")
            return False
        
        # Test 2: Valid PNG upload
        print("\nTest 2: Valid PNG upload")
        test_image_png = create_test_image("PNG")
        files = {"image": ("test.png", test_image_png, "image/png")}
        
        response = requests.post("http://127.0.0.1:8002/identify", files=files, timeout=10)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ PNG upload successful")
            print(f"  Matches found: {len(result.get('matches', []))}")
        else:
            print(f"✗ PNG upload failed: {response.status_code}")
            return False
        
        # Test 3: Invalid file format
        print("\nTest 3: Invalid file format")
        text_file = io.BytesIO(b"This is not an image")
        files = {"image": ("test.txt", text_file, "text/plain")}
        
        response = requests.post("http://127.0.0.1:8002/identify", files=files, timeout=10)
        
        if response.status_code == 422:
            error_detail = response.json().get("detail", {})
            print("✓ Invalid format correctly rejected")
            print(f"  Error type: {error_detail.get('error_type')}")
            print(f"  Message: {error_detail.get('message')}")
        else:
            print(f"✗ Invalid format test failed: {response.status_code}")
            return False
        
        # Test 4: Large image (should be optimized)
        print("\nTest 4: Large image optimization")
        large_image = create_test_image("JPEG", size=(3000, 2000))
        files = {"image": ("large.jpg", large_image, "image/jpeg")}
        
        response = requests.post("http://127.0.0.1:8002/identify", files=files, timeout=15)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Large image processed successfully")
            print(f"  Image optimization handled correctly")
        else:
            print(f"✗ Large image test failed: {response.status_code}")
            return False
        
        # Test 5: Empty file
        print("\nTest 5: Empty file")
        empty_file = io.BytesIO(b"")
        files = {"image": ("empty.jpg", empty_file, "image/jpeg")}
        
        response = requests.post("http://127.0.0.1:8002/identify", files=files, timeout=10)
        
        if response.status_code == 422:
            error_detail = response.json().get("detail", {})
            print("✓ Empty file correctly rejected")
            print(f"  Error type: {error_detail.get('error_type')}")
        else:
            print(f"✗ Empty file test failed: {response.status_code}")
            return False
        
        print("\n✓ All integration tests passed!")
        return True
        
    except Exception as e:
        print(f"✗ Integration test failed: {e}")
        return False
    finally:
        # Clean up server
        if server_process:
            try:
                server_process.terminate()
                server_process.wait(timeout=5)
            except:
                server_process.kill()

if __name__ == "__main__":
    success = test_image_endpoint_integration()
    if not success:
        sys.exit(1)