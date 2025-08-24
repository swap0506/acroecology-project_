#!/usr/bin/env python3
"""Check if required dependencies are installed"""

try:
    import fastapi
    import uvicorn
    print("✅ FastAPI and uvicorn are available")
    print(f"FastAPI version: {fastapi.__version__}")
    print(f"Uvicorn version: {uvicorn.__version__}")
except ImportError as e:
    print("❌ Missing dependencies:", e)
    print("\nTo install required dependencies, run:")
    print("pip install fastapi uvicorn python-multipart")