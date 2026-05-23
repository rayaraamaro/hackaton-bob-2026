"""
Mock Firestore Database for Local Testing

This provides an in-memory database that mimics Firestore's interface
without requiring Google Cloud credentials.
"""

import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional


class MockFirestoreClient:
    """Mock Firestore database client for local testing."""
    
    def __init__(self):
        """Initialize mock database."""
        self.db = {
            "projects": {},
            "agents": {},
            "tasks": {},
            "tokenUsage": {},
            "executionPlans": {}
        }
    
    async def initialize(self):
        """Initialize mock connection."""
        print("Mock Firestore initialized (local testing mode)")
    
    async def close(self):
        """Close mock connection."""
        pass
    
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
            "token_limit": project_data.get("token_limit", 50000),
            "cost_limit": project_data.get("cost_limit", 5.0),
        }
        
        self.db["projects"][project_id] = project
        return project_id
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID."""
        return self.db["projects"].get(project_id)
    
    async def update_project(self, project_id: str, updates: Dict[str, Any]) -> bool:
        """Update project fields."""
        if project_id in self.db["projects"]:
            updates["updated_at"] = datetime.utcnow()
            self.db["projects"][project_id].update(updates)
            return True
        return False
    
    async def list_projects(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """List projects for a user."""
        projects = [
            p for p in self.db["projects"].values()
            if p["user_id"] == user_id
        ]
        projects.sort(key=lambda x: x["created_at"], reverse=True)
        return projects[:limit]
    
    # Agent Operations
    async def create_agent(self, agent_data: Dict[str, Any]) -> str:
        """Create a new agent."""
        agent_id = agent_data.get("id", str(uuid.uuid4()))
        self.db["agents"][agent_id] = agent_data
        return agent_id
    
    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """Get agent by ID."""
        return self.db["agents"].get(agent_id)
    
    async def list_agents(self) -> List[Dict[str, Any]]:
        """List all available agents."""
        return list(self.db["agents"].values())
    
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
        
        self.db["tasks"][task_id] = task
        return task_id
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID."""
        return self.db["tasks"].get(task_id)
    
    async def update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Update task fields."""
        if task_id in self.db["tasks"]:
            self.db["tasks"][task_id].update(updates)
            return True
        return False
    
    async def list_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """List tasks for a project."""
        tasks = [
            t for t in self.db["tasks"].values()
            if t["project_id"] == project_id
        ]
        tasks.sort(key=lambda x: x["execution_order"])
        return tasks
    
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
        
        self.db["tokenUsage"][usage_id] = usage
        return usage_id
    
    async def get_project_token_usage(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all token usage for a project."""
        usage = [
            u for u in self.db["tokenUsage"].values()
            if u["project_id"] == project_id
        ]
        usage.sort(key=lambda x: x["timestamp"], reverse=True)
        return usage
    
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
        
        self.db["executionPlans"][plan_id] = plan
        return plan_id
    
    async def get_execution_plan(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get execution plan for a project."""
        plans = [
            p for p in self.db["executionPlans"].values()
            if p["project_id"] == project_id
        ]
        if plans:
            plans.sort(key=lambda x: x["created_at"], reverse=True)
            return plans[0]
        return None


# Global mock client instance
mock_db_client = MockFirestoreClient()


async def init_mock_firestore():
    """Initialize mock Firestore connection."""
    await mock_db_client.initialize()


async def close_mock_firestore():
    """Close mock Firestore connection."""
    await mock_db_client.close()

# Made with Bob