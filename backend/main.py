"""
AI Agent Project Studio - Main FastAPI Application

BOB-powered agent orchestration platform.
"""

import logging
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.routes import projects, agents, websocket
from config.settings import settings

# Import database module (uses SQLite)
from database import db_client, init_db, close_db


# Initialize FastAPI app
app = FastAPI(
    title="AI Agent Project Studio",
    description="BOB-powered agent orchestration platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup."""
    logger.info("=" * 60)
    logger.info("Starting AI Agent Project Studio...")
    logger.info("=" * 60)
    
    # Log agent system status
    try:
        from agents.agent_loader import AGENT_DEFINITIONS, AGENT_SELECTION_RULES
        logger.info(f"Agent system loaded: {len(AGENT_DEFINITIONS)} specialists available")
        logger.info(f"Available specialists: {list(AGENT_DEFINITIONS.keys())}")
        logger.info(f"Default agent selection: {AGENT_SELECTION_RULES.get('default', [])}")
    except Exception as e:
        logger.error(f"Failed to load agent system: {e}")
    
    await init_db()
    logger.info("All services initialized")
    logger.info("=" * 60)


# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown."""
    print("Shutting down...")
    await close_db()
    print("Cleanup complete")


# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])


# Health check
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "orchestrator": "BOB",
        "version": "1.0.0"
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "AI Agent Project Studio API",
        "orchestrator": "BOB (IBM's AI Assistant)",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=settings.PORT,
        reload=True if settings.ENVIRONMENT == "development" else False
    )

# Made with Bob
