"""
SQLite Database for Local Testing

Simple SQLite-based storage for local development and testing.
"""

import sqlite3
import json
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional
from pathlib import Path
import asyncio


class SQLiteClient:
    """SQLite database client for local testing."""
    
    def __init__(self, db_path: str = "local_db.sqlite"):
        """Initialize SQLite client."""
        self.db_path = Path(db_path)
        self.conn: Optional[sqlite3.Connection] = None
    
    async def initialize(self):
        """Initialize SQLite connection and create tables."""
        # Run in thread pool since sqlite3 is synchronous
        await asyncio.to_thread(self._init_sync)
    
    def _init_sync(self):
        """Synchronous initialization."""
        self.conn = sqlite3.connect(self.db_path, check_same_thread=False)
        self.conn.row_factory = sqlite3.Row
        
        # Create tables
        cursor = self.conn.cursor()
        
        # Projects table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                requirements TEXT,
                status TEXT DEFAULT 'planning',
                selected_agents TEXT,
                created_at TEXT,
                updated_at TEXT,
                total_tokens INTEGER DEFAULT 0,
                total_cost REAL DEFAULT 0.0,
                token_limit INTEGER DEFAULT 50000,
                cost_limit REAL DEFAULT 5.0
            )
        """)
        
        # Tasks table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tasks (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                name TEXT NOT NULL,
                status TEXT DEFAULT 'pending',
                input TEXT,
                output TEXT,
                error TEXT,
                start_time TEXT,
                end_time TEXT,
                tokens_used INTEGER DEFAULT 0,
                cost REAL DEFAULT 0.0,
                execution_order INTEGER DEFAULT 0,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)
        
        # Token usage table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS token_usage (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                task_id TEXT NOT NULL,
                agent_id TEXT NOT NULL,
                prompt_tokens INTEGER DEFAULT 0,
                completion_tokens INTEGER DEFAULT 0,
                total_tokens INTEGER NOT NULL,
                cost REAL NOT NULL,
                model TEXT NOT NULL,
                timestamp TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id),
                FOREIGN KEY (task_id) REFERENCES tasks(id)
            )
        """)
        
        # Execution plans table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS execution_plans (
                id TEXT PRIMARY KEY,
                project_id TEXT NOT NULL,
                tasks TEXT NOT NULL,
                created_at TEXT,
                FOREIGN KEY (project_id) REFERENCES projects(id)
            )
        """)
        
        self.conn.commit()
        print(f"✅ SQLite database initialized: {self.db_path}")
    
    async def close(self):
        """Close SQLite connection."""
        if self.conn:
            await asyncio.to_thread(self.conn.close)
    
    # Project Operations
    async def create_project(self, project_data: Dict[str, Any]) -> str:
        """Create a new project."""
        return await asyncio.to_thread(self._create_project_sync, project_data)
    
    def _create_project_sync(self, project_data: Dict[str, Any]) -> str:
        """Synchronous project creation."""
        project_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO projects (
                id, user_id, name, description, requirements, status,
                selected_agents, created_at, updated_at, total_tokens,
                total_cost, token_limit, cost_limit
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            project_id,
            project_data["user_id"],
            project_data["name"],
            project_data["description"],
            json.dumps(project_data["requirements"]),
            "planning",
            json.dumps(project_data.get("selected_agents", [])),
            now,
            now,
            0,
            0.0,
            project_data.get("token_limit", 50000),
            project_data.get("cost_limit", 5.0)
        ))
        self.conn.commit()
        return project_id
    
    async def get_project(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get project by ID."""
        return await asyncio.to_thread(self._get_project_sync, project_id)
    
    def _get_project_sync(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Synchronous project retrieval."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM projects WHERE id = ?", (project_id,))
        row = cursor.fetchone()
        
        if row:
            project = dict(row)
            project["requirements"] = json.loads(project["requirements"])
            project["selected_agents"] = json.loads(project["selected_agents"])
            project["created_at"] = datetime.fromisoformat(project["created_at"])
            project["updated_at"] = datetime.fromisoformat(project["updated_at"])
            return project
        return None
    
    async def update_project(self, project_id: str, updates: Dict[str, Any]) -> bool:
        """Update project fields."""
        return await asyncio.to_thread(self._update_project_sync, project_id, updates)
    
    def _update_project_sync(self, project_id: str, updates: Dict[str, Any]) -> bool:
        """Synchronous project update."""
        updates["updated_at"] = datetime.utcnow().isoformat()
        
        # Convert lists/dicts to JSON
        if "selected_agents" in updates:
            updates["selected_agents"] = json.dumps(updates["selected_agents"])
        if "requirements" in updates:
            updates["requirements"] = json.dumps(updates["requirements"])
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [project_id]
        
        cursor = self.conn.cursor()
        cursor.execute(f"UPDATE projects SET {set_clause} WHERE id = ?", values)
        self.conn.commit()
        return cursor.rowcount > 0
    
    async def list_projects(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """List projects for a user."""
        return await asyncio.to_thread(self._list_projects_sync, user_id, limit)
    
    def _list_projects_sync(self, user_id: str, limit: int) -> List[Dict[str, Any]]:
        """Synchronous project listing."""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM projects WHERE user_id = ? ORDER BY created_at DESC LIMIT ?",
            (user_id, limit)
        )
        
        projects = []
        for row in cursor.fetchall():
            project = dict(row)
            project["requirements"] = json.loads(project["requirements"])
            project["selected_agents"] = json.loads(project["selected_agents"])
            project["created_at"] = datetime.fromisoformat(project["created_at"])
            project["updated_at"] = datetime.fromisoformat(project["updated_at"])
            projects.append(project)
        
        return projects
    
    # Task Operations
    async def create_task(self, task_data: Dict[str, Any]) -> str:
        """Create a new task."""
        return await asyncio.to_thread(self._create_task_sync, task_data)
    
    def _create_task_sync(self, task_data: Dict[str, Any]) -> str:
        """Synchronous task creation."""
        task_id = str(uuid.uuid4())
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO tasks (
                id, project_id, agent_id, name, status, input,
                execution_order
            ) VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            task_id,
            task_data["project_id"],
            task_data["agent_id"],
            task_data["name"],
            "pending",
            json.dumps(task_data["input"]),
            task_data.get("execution_order", 0)
        ))
        self.conn.commit()
        return task_id
    
    async def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Get task by ID."""
        return await asyncio.to_thread(self._get_task_sync, task_id)
    
    def _get_task_sync(self, task_id: str) -> Optional[Dict[str, Any]]:
        """Synchronous task retrieval."""
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM tasks WHERE id = ?", (task_id,))
        row = cursor.fetchone()
        
        if row:
            task = dict(row)
            task["input"] = json.loads(task["input"]) if task["input"] else None
            task["output"] = json.loads(task["output"]) if task["output"] else None
            if task["start_time"]:
                task["start_time"] = datetime.fromisoformat(task["start_time"])
            if task["end_time"]:
                task["end_time"] = datetime.fromisoformat(task["end_time"])
            return task
        return None
    
    async def update_task(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Update task fields."""
        return await asyncio.to_thread(self._update_task_sync, task_id, updates)
    
    def _update_task_sync(self, task_id: str, updates: Dict[str, Any]) -> bool:
        """Synchronous task update."""
        # Convert datetime objects to ISO format
        for key in ["start_time", "end_time"]:
            if key in updates and isinstance(updates[key], datetime):
                updates[key] = updates[key].isoformat()
        
        # Convert dicts to JSON
        if "output" in updates and updates["output"]:
            updates["output"] = json.dumps(updates["output"])
        
        set_clause = ", ".join([f"{k} = ?" for k in updates.keys()])
        values = list(updates.values()) + [task_id]
        
        cursor = self.conn.cursor()
        cursor.execute(f"UPDATE tasks SET {set_clause} WHERE id = ?", values)
        self.conn.commit()
        return cursor.rowcount > 0
    
    async def list_tasks(self, project_id: str) -> List[Dict[str, Any]]:
        """List tasks for a project."""
        return await asyncio.to_thread(self._list_tasks_sync, project_id)
    
    def _list_tasks_sync(self, project_id: str) -> List[Dict[str, Any]]:
        """Synchronous task listing."""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM tasks WHERE project_id = ? ORDER BY execution_order",
            (project_id,)
        )
        
        tasks = []
        for row in cursor.fetchall():
            task = dict(row)
            task["input"] = json.loads(task["input"]) if task["input"] else None
            task["output"] = json.loads(task["output"]) if task["output"] else None
            if task["start_time"]:
                task["start_time"] = datetime.fromisoformat(task["start_time"])
            if task["end_time"]:
                task["end_time"] = datetime.fromisoformat(task["end_time"])
            tasks.append(task)
        
        return tasks
    
    # Token Usage Operations
    async def create_token_usage(self, usage_data: Dict[str, Any]) -> str:
        """Create a token usage record."""
        return await asyncio.to_thread(self._create_token_usage_sync, usage_data)
    
    def _create_token_usage_sync(self, usage_data: Dict[str, Any]) -> str:
        """Synchronous token usage creation."""
        usage_id = str(uuid.uuid4())
        timestamp = usage_data.get("timestamp", datetime.utcnow()).isoformat()
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO token_usage (
                id, project_id, task_id, agent_id, prompt_tokens,
                completion_tokens, total_tokens, cost, model, timestamp
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            usage_id,
            usage_data["project_id"],
            usage_data["task_id"],
            usage_data["agent_id"],
            usage_data.get("prompt_tokens", 0),
            usage_data.get("completion_tokens", 0),
            usage_data["total_tokens"],
            usage_data["cost"],
            usage_data["model"],
            timestamp
        ))
        self.conn.commit()
        return usage_id
    
    async def get_project_token_usage(self, project_id: str) -> List[Dict[str, Any]]:
        """Get all token usage for a project."""
        return await asyncio.to_thread(self._get_project_token_usage_sync, project_id)
    
    def _get_project_token_usage_sync(self, project_id: str) -> List[Dict[str, Any]]:
        """Synchronous token usage retrieval."""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM token_usage WHERE project_id = ? ORDER BY timestamp DESC",
            (project_id,)
        )
        
        usage_list = []
        for row in cursor.fetchall():
            usage = dict(row)
            usage["timestamp"] = datetime.fromisoformat(usage["timestamp"])
            usage_list.append(usage)
        
        return usage_list
    
    # Execution Plan Operations
    async def create_execution_plan(self, project_id: str, plan_data: Dict[str, Any]) -> str:
        """Create an execution plan."""
        return await asyncio.to_thread(self._create_execution_plan_sync, project_id, plan_data)
    
    def _create_execution_plan_sync(self, project_id: str, plan_data: Dict[str, Any]) -> str:
        """Synchronous execution plan creation."""
        plan_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO execution_plans (id, project_id, tasks, created_at)
            VALUES (?, ?, ?, ?)
        """, (
            plan_id,
            project_id,
            json.dumps(plan_data["tasks"]),
            created_at
        ))
        self.conn.commit()
        return plan_id
    
    async def get_execution_plan(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Get execution plan for a project."""
        return await asyncio.to_thread(self._get_execution_plan_sync, project_id)
    
    def _get_execution_plan_sync(self, project_id: str) -> Optional[Dict[str, Any]]:
        """Synchronous execution plan retrieval."""
        cursor = self.conn.cursor()
        cursor.execute(
            "SELECT * FROM execution_plans WHERE project_id = ? ORDER BY created_at DESC LIMIT 1",
            (project_id,)
        )
        row = cursor.fetchone()
        
        if row:
            plan = dict(row)
            plan["tasks"] = json.loads(plan["tasks"])
            plan["created_at"] = datetime.fromisoformat(plan["created_at"])
            return plan
        return None
    
    async def create_agent(self, agent_data: Dict[str, Any]) -> str:
        """
        Create a new agent.
        Note: Agents are now defined in Markdown files, so this is a no-op.
        Returns the agent_id for compatibility.
        """
        agent_id = agent_data.get("id", str(uuid.uuid4()))
        return agent_id
    
    async def get_agent(self, agent_id: str) -> Optional[Dict[str, Any]]:
        """
        Get agent by ID from AGENT_DEFINITIONS.
        Agents are loaded from Markdown files, not stored in database.
        """
        from agents.agent_loader import AGENT_DEFINITIONS
        return AGENT_DEFINITIONS.get(agent_id)
    
    async def list_agents(self) -> List[Dict[str, Any]]:
        """
        List all agents from AGENT_DEFINITIONS.
        Agents are loaded from Markdown files, not stored in database.
        """
        from agents.agent_loader import AGENT_DEFINITIONS
        return list(AGENT_DEFINITIONS.values())


# Global SQLite client instance
sqlite_client = SQLiteClient()


async def init_sqlite():
    """Initialize SQLite connection."""
    await sqlite_client.initialize()


async def close_sqlite():
    """Close SQLite connection."""
    await sqlite_client.close()

# Made with Bob
