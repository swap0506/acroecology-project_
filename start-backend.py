#!/usr/bin/env python3
"""
Script to start the backend API server for development
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    # Change to the ml-service directory
    ml_service_dir = Path(__file__).parent / "ml-service"
    
    if not ml_service_dir.exists():
        print("Error: ml-service directory not found!")
        sys.exit(1)
    
    # Change to ml-service directory
    os.chdir(ml_service_dir)
    
    print("Starting backend API server...")
    print("Server will be available at: http://localhost:8001")
    print("API endpoints:")
    print("  - GET  /health - Health check")
    print("  - POST /api/identify - Pest/disease identification")
    print("  - GET  /api/status - Service status")
    print("\nPress Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Start the simple FastAPI server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "app.simple_main:app", 
            "--host", "0.0.0.0", 
            "--port", "8001", 
            "--reload"
        ], check=True)
    except KeyboardInterrupt:
        print("\nServer stopped by user")
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        print("\nTrying alternative method...")
        try:
            subprocess.run([
                sys.executable, "app/simple_main.py"
            ], check=True)
        except Exception as e2:
            print(f"Failed to start server: {e2}")
            print("\nPlease ensure you have FastAPI and uvicorn installed:")
            print("pip install fastapi uvicorn")
            sys.exit(1)

if __name__ == "__main__":
    main()