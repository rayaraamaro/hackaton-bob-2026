"""
Agent Model

Defines the Agent data model.
"""

from dataclasses import dataclass
from typing import Dict, List


@dataclass
class Agent:
    """Agent model representing an AI agent."""
    
    id: str
    name: str
    type: str  # 'database' | 'ui' | 'logic' | 'api' | 'faq'
    description: str
    capabilities: List[str]
    estimated_tokens: int
    estimated_time: int  # minutes
    system_prompt: str
    version: str
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for Firestore."""
        return {
            "id": self.id,
            "name": self.name,
            "type": self.type,
            "description": self.description,
            "capabilities": self.capabilities,
            "estimated_tokens": self.estimated_tokens,
            "estimated_time": self.estimated_time,
            "system_prompt": self.system_prompt,
            "version": self.version,
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> "Agent":
        """Create from Firestore dictionary."""
        return cls(
            id=data["id"],
            name=data["name"],
            type=data["type"],
            description=data["description"],
            capabilities=data["capabilities"],
            estimated_tokens=data["estimated_tokens"],
            estimated_time=data["estimated_time"],
            system_prompt=data["system_prompt"],
            version=data["version"],
        )

# Made with Bob
