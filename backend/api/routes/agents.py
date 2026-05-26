"""
Agents API Routes

Handles agent-related endpoints.
"""

from fastapi import APIRouter, HTTPException

from agents.agent_loader import AGENT_DEFINITIONS


router = APIRouter()


@router.get("")
async def list_agents():
    """
    List all available agents.
    """
    try:
        # Return agent definitions
        agents = list(AGENT_DEFINITIONS.values())
        return {
            "agents": agents,
            "total": len(agents)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{agent_id}")
async def get_agent(agent_id: str):
    """
    Get agent details.
    """
    agent = AGENT_DEFINITIONS.get(agent_id)
    if not agent:
        raise HTTPException(status_code=404, detail="Agent not found")
    
    return agent

# Made with Bob
