"""
Task Model

Defines the Task data model.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Any, Dict, Optional


@dataclass
class Task:
    """Task model representing an agent execution task."""
    
    id: str
    project_id: str
    agent_id: str
    name: str
    status: str  # 'pending' | 'running' | 'completed' | 'failed'
    input: Dict[str, Any]
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    tokens_used: int = 0
    cost: float = 0.0
    execution_order: int = 0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "agent_id": self.agent_id,
            "name": self.name,
            "status": self.status,
            "input": self.input,
            "output": self.output,
            "error": self.error,
            "start_time": self.start_time,
            "end_time": self.end_time,
            "tokens_used": self.tokens_used,
            "cost": self.cost,
            "execution_order": self.execution_order,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Task":
        """Create from Firestore dictionary."""
        return cls(
            id=data["id"],
            project_id=data["project_id"],
            agent_id=data["agent_id"],
            name=data["name"],
            status=data["status"],
            input=data["input"],
            output=data.get("output"),
            error=data.get("error"),
            start_time=data.get("start_time"),
            end_time=data.get("end_time"),
            tokens_used=data.get("tokens_used", 0),
            cost=data.get("cost", 0.0),
            execution_order=data.get("execution_order", 0),
        )

# Made with Bob
