"""
Firestore Database Connection

Handles Firestore initialization and CRUD operations.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

try:
    from google.cloud import firestore
    from google.cloud.firestore_v1 import AsyncClient
    FIRESTORE_AVAILABLE = True
except ImportError:
    FIRESTORE_AVAILABLE = False
    firestore = None
    AsyncClient = None

from config.settings import settings
from database.models.project import Project
from database.models.agent import Agent
from database.models.task import Task
from database.models.token_usage import TokenUsage


class FirestoreClient:
    """Firestore database client with CRUD operations."""
    
    def __init__(self):
        """Initialize Firestore client."""
        self.db: Optional[AsyncClient] = None
    
    async def initialize(self):
        """Initialize Firestore connection."""
        self.db = firestore.AsyncClient(
            project=settings.GCP_PROJECT_ID,
            database=settings.FIRESTORE_DATABASE_ID
        )
        print(f"✅ Firestore initialized for project: {settings.GCP_PROJECT_ID}")
    
    async def close(self):
        """Close Firestore connection."""
        if self.db:
            await self.db.close()
    
    # Project Operations
    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Create a new project."""
        project_id = str(uuid.uuid4())
        now = datetime.utcnow()
        
        project = {
            "id": project_id,
            "user_id": project_data["user_id"],
            "name": project_data["name"],
            "description": project_data["description"],
            "requirements": project_data["requirements"],
            "status": "planning",
            "selected_agents": project_data.get("selected_agents", []),
            "created_at": now,
            "updated_at": now,
            "total_tokens": 0,
            "total_cost": 0.0,
            "token_limit": project_data.get("token_limit", settings.DEFAULT_TOKEN_LIMIT),
            "cost_limit": project_data.get("cost_limit", settings.DEFAULT_COST_LIMIT),
        }
        
        await self.db.collection("projects").document(project_id).set(project)
        return project_id
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID."""
        doc = await self.db.collection("projects").document(project_id).get()
        return doc.to_dict() if doc.exists else None
    
    async def update_project(self, project_id: str, updates: Dict[str, Any]) -> bool:
        """Update project fields."""
        updates["updated_at"] = datetime.utcnow()
        await self.db.collection("projects").document(project_id).update(updates)
        return True
    
    async def list_projects(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """List projects for a user."""
        query = (
            self.db.collection("projects")
            .where("user_id", "==", user_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(limit)
        )
        docs = await query.get()
        return [doc.to_dict() for doc in docs]
    
    # Agent Operations
    async def create_agent(self, agent_data: Dict[str, Any]) -> str:
        """Create a new agent."""
        agent_id = agent_data.get("id", str(uuid.uuid4()))
        await self.db.collection("agents").document(agent_id).set(agent_data)
        return agent_id
    
    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent by ID."""
        doc = await self.db.collection("agents").document(agent_id).get()
        return doc.to_dict() if doc.exists else None
    
    async def list_agents(self) -> List[Dict[str, Any]]:
        """List all available agents."""
        docs = await self.db.collection("agents").get()
        return [doc.to_dict() for doc in docs]
    
    # Task Operations
    async def create_task(self, task_data: Dict[str, Any]) -> str:
        """Create a new task."""
        task_id = str(uuid.uuid4())
        task = {
            "id": task_id,
            "project_id": task_data["project_id"],
            "agent_id": task_data["agent_id"],
            "name": task_data["name"],
            "status": "pending",
            "input": task_data["input"],
            "output": None,
            "error": None,
            "start_time": None,
            "end_time": None,
            "tokens_used": 0,
            "cost": 0.0,
            "execution_order": task_data.get("execution_order", 0),
        }
        
        await self.db.collection("tasks").document(task_id).set(task)
        return task_id
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID."""
        doc = await self.db.collection("tasks").document(task_id).get()
        return doc.to_dict() if doc.exists else None
    
    async def update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Update task fields."""
        await self.db.collection("tasks").document(task_id).update(updates)
        return True
    
    async def list_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """List tasks for a project."""
        query = (
            self.db.collection("tasks")
            .where("project_id", "==", project_id)
            .order_by("execution_order")
        )
        docs = await query.get()
        return [doc.to_dict() for doc in docs]
    
    # Token Usage Operations
    async def create_token_usage(self, usage_data: Dict[str, Any]) -> str:
        """Create a token usage record."""
        usage_id = str(uuid.uuid4())
        usage = {
            "id": usage_id,
            "project_id": usage_data["project_id"],
            "task_id": usage_data["task_id"],
            "agent_id": usage_data["agent_id"],
            "prompt_tokens": usage_data.get("prompt_tokens", 0),
            "completion_tokens": usage_data.get("completion_tokens", 0),
            "total_tokens": usage_data["total_tokens"],
            "cost": usage_data["cost"],
            "model": usage_data["model"],
            "timestamp": usage_data.get("timestamp", datetime.utcnow()),
        }
        
        await self.db.collection("tokenUsage").document(usage_id).set(usage)
        return usage_id
    
    async def get_project_token_usage(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all token usage for a project."""
        query = (
            self.db.collection("tokenUsage")
            .where("project_id", "==", project_id)
            .order_by("timestamp", direction=firestore.Query.DESCENDING)
        )
        docs = await query.get()
        return [doc.to_dict() for doc in docs]
    
    # Execution Plan Operations
    async def create_execution_plan(self, project_id: str, plan_data: Dict[str, Any]) -> str:
        """Create an execution plan."""
        plan_id = str(uuid.uuid4())
        plan = {
            "id": plan_id,
            "project_id": project_id,
            "tasks": plan_data["tasks"],
            "created_at": datetime.utcnow(),
        }
        
        await self.db.collection("executionPlans").document(plan_id).set(plan)
        return plan_id
    
    async def get_execution_plan(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get execution plan for a project."""
        query = (
            self.db.collection("executionPlans")
            .where("project_id", "==", project_id)
            .order_by("created_at", direction=firestore.Query.DESCENDING)
            .limit(1)
        )
        docs = await query.get()
        return docs[0].to_dict() if docs else None


# Global Firestore client instance
db_client = FirestoreClient()


async def init_firestore():
    """Initialize Firestore connection."""
    await db_client.initialize()


async def close_firestore():
    """Close Firestore connection."""
    await db_client.close()

# Made with Bob
