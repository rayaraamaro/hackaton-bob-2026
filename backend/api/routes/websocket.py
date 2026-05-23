"""
WebSocket API Routes

Handles WebSocket connections for real-time updates.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


# Mock realtime service for when Redis is not available
class MockRealtimeService:
    async def connect(self, project_id: str, websocket: WebSocket):
        await websocket.accept()
        logger.info(f"WebSocket connected (mock mode): {project_id}")
    
    async def disconnect(self, project_id: str, websocket: WebSocket):
        logger.info(f"WebSocket disconnected (mock mode): {project_id}")


@router.websocket("/{project_id}")
async def websocket_endpoint(websocket: WebSocket, project_id: str):
    """
    WebSocket endpoint for real-time project updates.
    
    Note: Uses mock service (Redis disabled for local testing).
    """
    # Use mock service only (no Redis)
    logger.info(f"Using mock WebSocket service (Redis disabled): {project_id}")
    realtime = MockRealtimeService()
    
    await realtime.connect(project_id, websocket)
    
    try:
        while True:
            # Keep connection alive and listen for messages
            data = await websocket.receive_text()
            # Echo back for heartbeat
            await websocket.send_text(f"Received: {data}")
    except WebSocketDisconnect:
        await realtime.disconnect(project_id, websocket)

# Made with Bob
