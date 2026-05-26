"""
Real-time Service

Handles WebSocket connections and real-time event broadcasting.
"""

import json
from datetime import datetime
from typing import Any, Dict, Set

from fastapi import WebSocket

try:
    import redis.asyncio as redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False
    redis = None


class RealtimeService:
    """
    Manages WebSocket connections and real-time updates.
    """
    
    def __init__(self, redis_client: Any):
        self.redis = redis_client
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, project_id: str, websocket: WebSocket):
        """
        Connect client to project room.
        """
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        
        self.active_connections[project_id].add(websocket)
        
        # Replay recent events
        await self.replay_events(project_id, websocket)
    
    async def disconnect(self, project_id: str, websocket: WebSocket):
        """
        Disconnect client from project room.
        """
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
    
    async def emit_task_update(self, project_id: str, update: Dict[str, Any]):
        """
        Emit task status update to all connected clients.
        """
        event = {
            "type": "task:update",
            "data": update,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_token_update(self, project_id: str, usage: Dict[str, Any]):
        """
        Emit token usage update.
        """
        event = {
            "type": "token:update",
            "data": usage,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_progress_update(self, project_id: str, progress: Dict[str, Any]):
        """
        Emit progress update.
        """
        event = {
            "type": "progress:update",
            "data": progress,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_budget_alert(self, project_id: str, alert: Dict[str, Any]):
        """
        Emit budget alert.
        """
        event = {
            "type": "budget:alert",
            "data": alert,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_error(self, project_id: str, error: Dict[str, Any]):
        """
        Emit error notification.
        """
        event = {
            "type": "error:occurred",
            "data": error,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def broadcast(self, project_id: str, event: Dict[str, Any]):
        """
        Broadcast event to all connected clients in project room.
        """
        if project_id not in self.active_connections:
            return
        
        message = json.dumps(event)
        
        # Send to all connected clients
        disconnected = set()
        for websocket in self.active_connections[project_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                disconnected.add(websocket)
        
        # Remove disconnected clients
        for websocket in disconnected:
            self.active_connections[project_id].discard(websocket)
    
    async def cache_event(self, project_id: str, event: Dict[str, Any]):
        """
        Cache event in Redis for replay.
        """
        key = f"events:{project_id}"
        await self.redis.lpush(key, json.dumps(event))
        await self.redis.ltrim(key, 0, 99)  # Keep last 100 events
        await self.redis.expire(key, 3600)  # Expire after 1 hour
    
    async def replay_events(self, project_id: str, websocket: WebSocket):
        """
        Replay recent events to reconnected client.
        """
        key = f"events:{project_id}"
        events = await self.redis.lrange(key, 0, -1)
        
        for event_str in reversed(events):
            try:
                await websocket.send_text(event_str.decode() if isinstance(event_str, bytes) else event_str)
            except Exception:
                break

# Made with Bob
