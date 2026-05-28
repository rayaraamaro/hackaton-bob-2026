"""
MCP Proxy Routes

These routes expose MCP (Model Context Protocol) capabilities to the frontend,
allowing Bob to assist users in real-time as they input project details.
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
import logging

from services.mcp_client import mcp_client

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/mcp", tags=["mcp"])


class EnhanceDescriptionRequest(BaseModel):
    """Request to enhance a project description."""
    description: str
    requirements: Dict[str, bool]


class AnalyzeInputRequest(BaseModel):
    """Request to analyze user input and suggest improvements."""
    description: str
    requirements: Optional[Dict[str, bool]] = None


class SuggestRequirementsRequest(BaseModel):
    """Request to suggest requirements based on description."""
    description: str


@router.post("/enhance-description")
async def enhance_description(request: EnhanceDescriptionRequest):
    """
    Use Bob to enhance and clarify a project description.
    
    Bob will analyze the description and suggest improvements,
    clarifications, or additional details that would help
    generate better code.
    """
    try:
        if not mcp_client.is_available():
            raise HTTPException(
                status_code=503,
                detail="MCP server not available. Please build it: cd mcp-server && npm run build"
            )
        
        logger.info(f"Enhancing description via MCP: {request.description[:50]}...")
        
        # Use MCP to analyze and enhance the description
        result = await mcp_client.analyze_requirements(
            request.description,
            request.requirements
        )
        
        return {
            "success": True,
            "original_description": request.description,
            "analysis": result,
            "message": "Description analyzed by Bob"
        }
        
    except Exception as e:
        logger.error(f"Failed to enhance description: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to enhance description: {str(e)}"
        )


@router.post("/suggest-requirements")
async def suggest_requirements(request: SuggestRequirementsRequest):
    """
    Use Bob to suggest requirements based on the project description.
    
    Bob will analyze the description and suggest which requirements
    (database, auth, payment, etc.) would be needed.
    """
    try:
        if not mcp_client.is_available():
            raise HTTPException(
                status_code=503,
                detail="MCP server not available"
            )
        
        logger.info(f"Suggesting requirements for: {request.description[:50]}...")
        
        # Analyze with empty requirements to get suggestions
        result = await mcp_client.analyze_requirements(
            request.description,
            {}
        )
        
        # Parse the result to extract suggested requirements
        # In a real implementation, Bob would return structured data
        suggested_requirements = {
            "needsDatabase": "database" in request.description.lower() or "data" in request.description.lower(),
            "needsAuth": "auth" in request.description.lower() or "login" in request.description.lower() or "user" in request.description.lower(),
            "needsPayment": "payment" in request.description.lower() or "checkout" in request.description.lower() or "ecommerce" in request.description.lower(),
            "needsAPI": "api" in request.description.lower() or "backend" in request.description.lower(),
            "needsUI": "ui" in request.description.lower() or "frontend" in request.description.lower() or "website" in request.description.lower() or "app" in request.description.lower(),
        }
        
        return {
            "success": True,
            "suggested_requirements": suggested_requirements,
            "analysis": result,
            "message": "Requirements suggested by Bob"
        }
        
    except Exception as e:
        logger.error(f"Failed to suggest requirements: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to suggest requirements: {str(e)}"
        )


@router.post("/analyze-input")
async def analyze_input(request: AnalyzeInputRequest):
    """
    Use Bob to analyze user input and provide real-time feedback.
    
    Bob will check if the description is clear enough,
    suggest improvements, and validate the requirements.
    """
    try:
        if not mcp_client.is_available():
            raise HTTPException(
                status_code=503,
                detail="MCP server not available"
            )
        
        logger.info(f"Analyzing input via MCP: {request.description[:50]}...")
        
        requirements = request.requirements or {}
        
        # Use MCP to analyze the input
        result = await mcp_client.analyze_requirements(
            request.description,
            requirements
        )
        
        # Provide feedback on the input quality
        feedback = []
        
        if len(request.description) < 20:
            feedback.append({
                "type": "warning",
                "message": "Description is quite short. Consider adding more details about what you want to build."
            })
        
        if not any(requirements.values()):
            feedback.append({
                "type": "info",
                "message": "No requirements selected. Bob can suggest requirements based on your description."
            })
        
        return {
            "success": True,
            "feedback": feedback,
            "analysis": result,
            "message": "Input analyzed by Bob"
        }
        
    except Exception as e:
        logger.error(f"Failed to analyze input: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to analyze input: {str(e)}"
        )


@router.get("/status")
async def mcp_status():
    """Check if MCP server is available."""
    is_available = mcp_client.is_available()
    
    return {
        "available": is_available,
        "message": "MCP server is ready" if is_available else "MCP server not available",
        "server_path": mcp_client.mcp_server_path if hasattr(mcp_client, 'mcp_server_path') else None
    }


# Made with Bob