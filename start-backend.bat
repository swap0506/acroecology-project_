@echo off
echo Starting backend API server...
echo Server will be available at: http://localhost:8001
echo.
echo API endpoints:
echo   - GET  /health - Health check
echo   - POST /api/identify - Pest/disease identification  
echo   - GET  /api/status - Service status
echo.
echo Press Ctrl+C to stop the server
echo --------------------------------------------------

cd ml-service
python -m uvicorn app.simple_main:app --host 0.0.0.0 --port 8001 --reload

if %ERRORLEVEL% neq 0 (
    echo.
    echo Error starting server. Trying alternative method...
    python app/simple_main.py
)

if %ERRORLEVEL% neq 0 (
    echo.
    echo Failed to start server. Please ensure you have FastAPI and uvicorn installed:
    echo pip install fastapi uvicorn
    pause
)