"""
Project Model

Defines the Project data model.
"""

from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, List, Optional


@dataclass
class Project:
    """Project model representing a user's project."""
    
    id: str
    user_id: str
    name: str
    description: str
    requirements: Dict[str, bool]  # needsDatabase, needsAuth, etc.
    status: str  # 'planning' | 'executing' | 'completed' | 'failed'
    selected_agents: List[str]
    created_at: datetime
    updated_at: datetime
    total_tokens: int = 0
    total_cost: float = 0.0
    token_limit: int = 50000
    cost_limit: float = 5.0
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "name": self.name,
            "description": self.description,
            "requirements": self.requirements,
            "status": self.status,
            "selected_agents": self.selected_agents,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "total_tokens": self.total_tokens,
            "total_cost": self.total_cost,
            "token_limit": self.token_limit,
            "cost_limit": self.cost_limit,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Project":
        """Create from Firestore dictionary."""
        return cls(
            id=data["id"],
            user_id=data["user_id"],
            name=data["name"],
            description=data["description"],
            requirements=data["requirements"],
            status=data["status"],
            selected_agents=data["selected_agents"],
            created_at=data["created_at"],
            updated_at=data["updated_at"],
            total_tokens=data.get("total_tokens", 0),
            total_cost=data.get("total_cost", 0.0),
            token_limit=data.get("token_limit", 50000),
            cost_limit=data.get("cost_limit", 5.0),
        )

# Made with Bob
