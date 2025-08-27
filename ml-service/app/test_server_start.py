"""
Quick test to verify the server can start and the health endpoint works.
"""
import requests
import subprocess
import time
import sys
import os

def test_server_startup():
    """Test that the server starts and responds to health checks."""
    try:
        # Start the server in the background
        print("Starting FastAPI server...")
        process = subprocess.Popen([
            sys.executable, "-m", "uvicorn", "main:app", 
            "--host", "127.0.0.1", "--port", "8001"
        ], cwd=os.path.dirname(__file__))
        
        # Wait for server to start
        time.sleep(3)
        
        # Test health endpoint
        print("Testing health endpoint...")
        response = requests.get("http://127.0.0.1:8001/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print("✓ Health endpoint working")
            print(f"  Status: {data.get('status')}")
            print(f"  Image processing available: {data.get('image_processing_available')}")
            print(f"  Supported formats: {data.get('supported_image_formats')}")
            print(f"  Max image size: {data.get('max_image_size_mb')}MB")
            return True
        else:
            print(f"✗ Health endpoint failed with status {response.status_code}")
            return False
            
    except Exception as e:
        print(f"✗ Server test failed: {e}")
        return False
    finally:
        # Clean up
        try:
            process.terminate()
            process.wait(timeout=5)
        except:
            process.kill()

if __name__ == "__main__":
    success = test_server_startup()
    if success:
        print("\n✓ Server startup test passed!")
    else:
        print("\n✗ Server startup test failed!")
        sys.exit(1)