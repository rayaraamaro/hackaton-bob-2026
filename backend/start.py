"""
Simple server starter script.
Run this to start the backend server.
"""

import uvicorn

if __name__ == "__main__":
    print("=" * 60)
    print("Starting AI Agent Project Studio Backend")
    print("=" * 60)
    print("Server will be available at:")
    print("  - http://localhost:8000")
    print("  - http://127.0.0.1:8000")
    print("  - http://0.0.0.0:8000")
    print()
    print("API Documentation: http://localhost:8000/docs")
    print("Health Check: http://localhost:8000/health")
    print()
    print("Press CTRL+C to stop the server")
    print("=" * 60)
    print()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )

# Made with Bob
