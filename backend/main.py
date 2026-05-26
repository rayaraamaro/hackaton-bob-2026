"""
AI Agent Project Studio - Main FastAPI Application

BOB-powered agent orchestration platform.
"""

import logging
import sys
from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler(sys.stdout)]
)

logger = logging.getLogger(__name__)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import projects, agents, websocket
from config.settings import settings
from database import init_db, close_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifespan."""
    # Startup
    logger.info("=" * 60)
    logger.info("Starting AI Agent Project Studio...")
    logger.info("=" * 60)
    
    try:
        from agents.agent_loader import AGENT_DEFINITIONS
        logger.info(f"✓ Loaded {len(AGENT_DEFINITIONS)} agents")
        logger.info(f"✓ Agents: {list(AGENT_DEFINITIONS.keys())}")
    except Exception as e:
        logger.error(f"✗ Failed to load agents: {e}")
    
    await init_db()
    logger.info("✓ Database initialized")
    logger.info("=" * 60)
    
    yield
    
    # Shutdown
    logger.info("Shutting down...")
    await close_db()
    logger.info("Cleanup complete")


# Initialize FastAPI app
app = FastAPI(
    title="AI Agent Project Studio",
    description="BOB-powered agent orchestration platform",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS - Allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
        host="0.0.0.0",
        port=settings.PORT,
        reload=False
    )

# Made with Bob
