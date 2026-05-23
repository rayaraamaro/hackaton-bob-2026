"""
Agent Loader - Markdown-based Agent System

This module loads agent personas from Markdown files in the agents/ directory.
Each specialist is defined by a .md file that BOB reads to assume that persona.
"""

import os
from pathlib import Path
from typing import Dict, List, Optional
import re


class AgentLoader:
    """Loads agent personas from Markdown files."""
    
    def __init__(self, agents_dir: Optional[str] = None):
        """
        Initialize the agent loader.
        
        Args:
            agents_dir: Path to agents directory. Defaults to current file's parent.
        """
        if agents_dir is None:
            self.agents_dir = Path(__file__).parent
        else:
            self.agents_dir = Path(agents_dir)
        self.specialists_dir = self.agents_dir / "specialists"
        self.orchestrator_dir = self.agents_dir / "orchestrator"
        
    def load_specialist(self, specialist_id: str) -> Optional[Dict]:
        """
        Load a specialist persona from its .md file.
        
        Args:
            specialist_id: ID of the specialist (e.g., 'ui_specialist', 'api_specialist')
            
        Returns:
            Dictionary with specialist information or None if not found
        """
        md_file = self.specialists_dir / f"{specialist_id}.md"
        
        if not md_file.exists():
            return None
            
        content = md_file.read_text(encoding='utf-8')
        
        # Extract persona name from first heading
        name_match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
        name = name_match.group(1).strip() if name_match else specialist_id.replace('_', ' ').title()
        
        # Extract role/description from "Persona Name and Role" section
        role_match = re.search(r'##\s+1\.\s+Persona Name and Role\s+\*\*(.+?)\*\*\s+—\s+(.+?)(?=\n\n|\n#)', 
                              content, re.DOTALL)
        description = role_match.group(2).strip() if role_match else ""
        
        # Extract technology stack
        tech_stack = self._extract_tech_stack(content)
        
        # Extract capabilities from various sections
        capabilities = self._extract_capabilities(content)
        
        return {
            "id": specialist_id,
            "name": name,
            "type": self._get_specialist_type(specialist_id),
            "description": description,
            "capabilities": capabilities,
            "tech_stack": tech_stack,
            "persona_content": content,
            "estimated_tokens": 2000,  # Default estimate
            "estimated_time": 5,  # Default estimate in minutes
        }
    
    def _extract_tech_stack(self, content: str) -> List[str]:
        """Extract technology stack from the markdown content."""
        tech_stack = []
        
        # Look for Technology Stack section
        stack_match = re.search(r'##\s+\d+\.\s+Technology Stack.*?\n(.*?)(?=\n##|\Z)', 
                               content, re.DOTALL)
        if stack_match:
            stack_section = stack_match.group(1)
            # Extract items that start with - **
            tech_items = re.findall(r'-\s+\*\*(.+?)\*\*', stack_section)
            tech_stack.extend(tech_items)
        
        return tech_stack
    
    def _extract_capabilities(self, content: str) -> List[str]:
        """Extract capabilities from the markdown content."""
        capabilities = []
        
        # Look for Core Responsibilities or similar sections
        resp_match = re.search(r'##\s+\d+\.\s+Core Responsibilities.*?\n(.*?)(?=\n##|\Z)', 
                              content, re.DOTALL)
        if resp_match:
            resp_section = resp_match.group(1)
            # Extract bullet points
            cap_items = re.findall(r'-\s+(.+?)(?=\n-|\n\n|\Z)', resp_section, re.DOTALL)
            capabilities.extend([cap.strip() for cap in cap_items if cap.strip()])
        
        return capabilities[:5]  # Limit to top 5 capabilities
    
    def _get_specialist_type(self, specialist_id: str) -> str:
        """Map specialist ID to type."""
        type_mapping = {
            'ui_specialist': 'frontend',
            'api_specialist': 'backend',
            'database_specialist': 'database',
            'logic_specialist': 'backend',
            'ecommerce_specialist': 'domain',
            'analytics_specialist': 'analytics',
            'auth_specialist': 'backend',
        }
        return type_mapping.get(specialist_id, 'general')
    
    def load_all_specialists(self) -> Dict[str, Dict]:
        """
        Load all available specialists.
        
        Returns:
            Dictionary mapping specialist IDs to their information
        """
        specialists = {}
        
        if not self.specialists_dir.exists():
            return specialists
        
        for md_file in self.specialists_dir.glob("*.md"):
            specialist_id = md_file.stem
            specialist = self.load_specialist(specialist_id)
            if specialist:
                specialists[specialist_id] = specialist
        
        return specialists
    
    def load_orchestrator(self) -> Optional[str]:
        """
        Load the orchestrator persona content.
        
        Returns:
            Orchestrator markdown content or None if not found
        """
        orchestrator_file = self.orchestrator_dir / "orchestrator.md"
        
        if not orchestrator_file.exists():
            return None
            
        return orchestrator_file.read_text(encoding='utf-8')
    
    def load_decision_matrix(self) -> Optional[str]:
        """
        Load the decision matrix content.
        
        Returns:
            Decision matrix markdown content or None if not found
        """
        decision_file = self.orchestrator_dir / "decision_matrix.md"
        
        if not decision_file.exists():
            return None
            
        return decision_file.read_text(encoding='utf-8')
    
    def get_specialist_persona(self, specialist_id: str) -> Optional[str]:
        """
        Get the full persona content for a specialist.
        
        Args:
            specialist_id: ID of the specialist
            
        Returns:
            Full markdown content of the specialist's persona
        """
        specialist = self.load_specialist(specialist_id)
        return specialist.get("persona_content") if specialist else None


# Global agent loader instance
agent_loader = AgentLoader()

# Load all specialists at module import
AGENT_DEFINITIONS = agent_loader.load_all_specialists()

# Agent selection rules based on decision matrix
# Only include agents that have corresponding .md files
_available_agents = set(AGENT_DEFINITIONS.keys())

def _filter_available(agents: list) -> list:
    """Filter agent list to only include available agents."""
    return [agent for agent in agents if agent in _available_agents]

AGENT_SELECTION_RULES = {
    "needsDatabase": _filter_available(["database_specialist"]),
    "needsAPI": _filter_available(["api_specialist"]),
    "needsUI": _filter_available(["ui_specialist"]),
    "needsAuth": _filter_available(["auth_specialist"]),
    "needsEcommerce": _filter_available(["ecommerce_specialist", "auth_specialist", "database_specialist",
                       "logic_specialist", "api_specialist", "ui_specialist"]),
    "needsAnalytics": _filter_available(["analytics_specialist", "database_specialist", "api_specialist"]),
    "default": _filter_available(["database_specialist", "api_specialist", "ui_specialist"])
}

# Fallback to available agents if filtered list is empty
for key in AGENT_SELECTION_RULES:
    if not AGENT_SELECTION_RULES[key] and _available_agents:
        # Use any available agents as fallback
        AGENT_SELECTION_RULES[key] = list(_available_agents)[:3]  # Limit to 3 agents


def get_specialist_persona(specialist_id: str) -> Optional[str]:
    """
    Get the full persona content for a specialist.
    
    This is the main function BOB uses to load and assume a specialist persona.
    
    Args:
        specialist_id: ID of the specialist (e.g., 'ui_specialist')
        
    Returns:
        Full markdown content of the specialist's persona
    """
    return agent_loader.get_specialist_persona(specialist_id)


def get_orchestrator_persona() -> Optional[str]:
    """
    Get the orchestrator persona content.
    
    Returns:
        Full markdown content of the orchestrator persona
    """
    return agent_loader.load_orchestrator()


def get_decision_matrix() -> Optional[str]:
    """
    Get the decision matrix content.
    
    Returns:
        Full markdown content of the decision matrix
    """
    return agent_loader.load_decision_matrix()

# Made with Bob
