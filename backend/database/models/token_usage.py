"""
Token Usage Model

Defines the TokenUsage data model.
"""

from dataclasses import dataclass
from datetime import datetime
from typing import Dict


@dataclass
class TokenUsage:
    """Token usage model for tracking token consumption."""
    
    id: str
    project_id: str
    task_id: str
    agent_id: str
    prompt_tokens: int
    completion_tokens: int
    total_tokens: int
    cost: float
    model: str
    timestamp: datetime
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "project_id": self.project_id,
            "task_id": self.task_id,
            "agent_id": self.agent_id,
            "prompt_tokens": self.prompt_tokens,
            "completion_tokens": self.completion_tokens,
            "total_tokens": self.total_tokens,
            "cost": self.cost,
            "model": self.model,
            "timestamp": self.timestamp,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "TokenUsage":
        """Create from Firestore dictionary."""
        return cls(
            id=data["id"],
            project_id=data["project_id"],
            task_id=data["task_id"],
            agent_id=data["agent_id"],
            prompt_tokens=data["prompt_tokens"],
            completion_tokens=data["completion_tokens"],
            total_tokens=data["total_tokens"],
            cost=data["cost"],
            model=data["model"],
            timestamp=data["timestamp"],
        )

# Made with Bob
