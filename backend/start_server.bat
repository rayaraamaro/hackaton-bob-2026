@echo off
echo ============================================================
echo Starting AI Agent Project Studio Backend
echo ============================================================
echo.
echo Server will be available at:
echo   - http://localhost:8000
echo   - http://127.0.0.1:8000
echo.
echo API Documentation: http://localhost:8000/docs
echo Health Check: http://localhost:8000/health
echo.
echo Press CTRL+C to stop the server
echo ============================================================
echo.

python -m uvicorn main:app --host 0.0.0.0 --port 8000

pause

@REM Made with Bob
