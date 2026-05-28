"""
Gemini AI API Routes

Provides REST API endpoints for Gemini AI integration.
Supports text generation, code analysis, and structured output.
"""

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
import logging
import json

from services.gemini_service import gemini_service
from agents.agent_loader import AgentLoader

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/gemini", tags=["gemini"])


# ---------------------------------------------------------------------------
# Request/Response Models
# ---------------------------------------------------------------------------

class GenerateTextRequest(BaseModel):
    """Request model for text generation."""
    prompt: str = Field(..., description="The prompt for text generation")
    temperature: float = Field(0.7, ge=0.0, le=1.0, description="Creativity level")
    max_tokens: int = Field(8000, ge=1, le=32000, description="Maximum tokens")
    system_instruction: Optional[str] = Field(None, description="System instruction")


class GenerateTextResponse(BaseModel):
    """Response model for text generation."""
    success: bool
    text: str
    tokens_used: int
    model: str
    error: Optional[str] = None


class AnalyzeCodeRequest(BaseModel):
    """Request model for code analysis."""
    code: str = Field(..., description="Source code to analyze")
    language: str = Field(..., description="Programming language")
    task: str = Field("analyze and improve", description="Analysis task")


class GenerateCodeRequest(BaseModel):
    """Request model for code generation."""
    description: str = Field(..., description="What the code should do")
    language: str = Field(..., description="Target programming language")
    requirements: Optional[List[str]] = Field(None, description="Additional requirements")


class StructuredOutputRequest(BaseModel):
    """Request model for structured output."""
    prompt: str = Field(..., description="The prompt")
    schema: Dict[str, Any] = Field(..., description="JSON schema for output")
    temperature: float = Field(0.3, ge=0.0, le=1.0, description="Creativity level")


class AnalyzeProjectRequest(BaseModel):
    """Request model for project analysis."""
    description: str = Field(..., description="Project description")
    requirements: Dict[str, bool] = Field(..., description="Project requirements flags")


class AgentSuggestion(BaseModel):
    """Agent suggestion model."""
    agent_id: str
    agent_name: str
    reason: str
    estimated_tokens: int


class AnalyzeProjectResponse(BaseModel):
    """Response model for project analysis."""
    success: bool
    suggested_agents: List[AgentSuggestion]
    total_estimated_tokens: int
    total_estimated_cost: float
    analysis: str
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    gemini_available: bool
    model: str
    message: str


# ---------------------------------------------------------------------------
# API Endpoints
# ---------------------------------------------------------------------------

@router.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Check Gemini service health and availability.
    
    Returns:
        Health status information
    """
    is_available = gemini_service.is_available()
    
    return HealthResponse(
        status="healthy" if is_available else "unavailable",
        gemini_available=is_available,
        model=gemini_service.model_name if is_available else "N/A",
        message="Gemini AI service is operational" if is_available else 
                "Gemini AI service not available. Check API key and SDK installation."
    )


@router.post("/generate", response_model=GenerateTextResponse)
async def generate_text(request: GenerateTextRequest):
    """
    Generate text using Gemini AI.
    
    Args:
        request: Text generation parameters
    
    Returns:
        Generated text and metadata
    
    Raises:
        HTTPException: If service unavailable or generation fails
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available. Check configuration."
        )
    
    logger.info(f"Generating text with prompt length: {len(request.prompt)}")
    
    try:
        result = await gemini_service.generate_content(
            prompt=request.prompt,
            temperature=request.temperature,
            max_tokens=request.max_tokens,
            system_instruction=request.system_instruction
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Generation failed")
            )
        
        return GenerateTextResponse(**result)
        
    except Exception as e:
        logger.error(f"Text generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Generation failed: {str(e)}"
        )


@router.post("/analyze-code")
async def analyze_code(request: AnalyzeCodeRequest):
    """
    Analyze code and provide suggestions.
    
    Args:
        request: Code analysis parameters
    
    Returns:
        Analysis results and recommendations
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available"
        )
    
    logger.info(f"Analyzing {request.language} code ({len(request.code)} chars)")
    
    try:
        result = await gemini_service.analyze_code(
            code=request.code,
            language=request.language,
            task=request.task
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Analysis failed")
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Code analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )


@router.post("/generate-code")
async def generate_code(request: GenerateCodeRequest):
    """
    Generate code based on description.
    
    Args:
        request: Code generation parameters
    
    Returns:
        Generated code and explanations
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available"
        )
    
    logger.info(f"Generating {request.language} code: {request.description[:50]}...")
    
    try:
        result = await gemini_service.generate_code(
            description=request.description,
            language=request.language,
            requirements=request.requirements
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Code generation failed")
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Code generation error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Code generation failed: {str(e)}"
        )


@router.post("/structured-output")
async def generate_structured_output(request: StructuredOutputRequest):
    """
    Generate structured JSON output conforming to a schema.
    
    Args:
        request: Structured output parameters
    
    Returns:
        Structured data matching the provided schema
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available"
        )
    
    logger.info(f"Generating structured output with schema: {list(request.schema.keys())}")
    
    try:
        result = await gemini_service.generate_structured_output(
            prompt=request.prompt,
            schema=request.schema,
            temperature=request.temperature
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Structured output generation failed")
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Structured output error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Structured output generation failed: {str(e)}"
        )

@router.post("/analyze-project", response_model=AnalyzeProjectResponse)
async def analyze_project(request: AnalyzeProjectRequest):
    """
    Analyze project requirements and suggest which agents are needed using Gemini AI.
    
    This endpoint:
    1. Takes project description and requirements
    2. Uses Gemini to analyze what needs to be built
    3. Reads available agent personas from the agents/ folder
    4. Suggests which agents should be used
    5. Estimates token usage and cost
    
    Args:
        request: Project analysis parameters
    
    Returns:
        Suggested agents with reasoning and cost estimates
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available"
        )
    
    logger.info(f"Analyzing project: {request.description[:50]}...")
    
    try:
        # Load available agents
        from agents.agent_loader import AGENT_DEFINITIONS
        
        # Build agent descriptions for Gemini
        agent_descriptions = []
        for agent_id, agent_info in AGENT_DEFINITIONS.items():
            agent_descriptions.append(
                f"- **{agent_id}** ({agent_info['name']}): {agent_info['description']}\n"
                f"  Type: {agent_info['type']}\n"
                f"  Capabilities: {', '.join(agent_info['capabilities'][:3])}"
            )
        
        agents_text = "\n".join(agent_descriptions)
        
        # Build requirements text
        req_list = [k.replace('needs', '') for k, v in request.requirements.items() if v]
        requirements_text = ", ".join(req_list) if req_list else "basic functionality"
        
        # Create prompt for Gemini
        prompt = f"""You are an expert software architect analyzing project requirements.

PROJECT DESCRIPTION:
{request.description}

PROJECT REQUIREMENTS:
The project needs: {requirements_text}

AVAILABLE SPECIALIST AGENTS:
{agents_text}

TASK:
Analyze the project and determine which specialist agents are needed to build it successfully.
Consider the project description, requirements, and each agent's capabilities.

Respond with a JSON object in this exact format:
{{
  "suggested_agents": [
    {{
      "agent_id": "agent_id_here",
      "agent_name": "Agent Name",
      "reason": "Brief explanation why this agent is needed",
      "estimated_tokens": 2000
    }}
  ],
  "analysis": "Brief overall analysis of the project and agent selection strategy"
}}

Rules:
- Select 2-5 agents that best match the project needs
- Always include ui_specialist if there's any user interface
- Always include api_specialist if there's any backend/API work
- Include database specialists only if data persistence is needed
- Be concise but specific in your reasoning
- Estimate 2000-4000 tokens per agent based on complexity
"""
        
        # Call Gemini
        result = await gemini_service.generate_content(
            prompt=prompt,
            temperature=0.3,  # Lower temperature for more consistent analysis
            max_tokens=2000
        )
        
        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Analysis failed")
            )
        
        # Parse Gemini's response
        response_text = result["text"].strip()
        
        # Extract JSON from response (handle markdown code blocks)
        if "```json" in response_text:
            json_start = response_text.find("```json") + 7
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        elif "```" in response_text:
            json_start = response_text.find("```") + 3
            json_end = response_text.find("```", json_start)
            response_text = response_text[json_start:json_end].strip()
        
        try:
            analysis_data = json.loads(response_text)
        except json.JSONDecodeError:
            # Fallback: try to extract JSON object
            import re
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            if json_match:
                analysis_data = json.loads(json_match.group())
            else:
                raise ValueError("Could not parse Gemini response as JSON")
        
        # Build response
        suggested_agents = []
        total_tokens = 0
        
        for agent in analysis_data.get("suggested_agents", []):
            agent_id = agent.get("agent_id")
            
            # Validate agent exists
            if agent_id not in AGENT_DEFINITIONS:
                logger.warning(f"Gemini suggested unknown agent: {agent_id}")
                continue
            
            agent_info = AGENT_DEFINITIONS[agent_id]
            estimated_tokens = agent.get("estimated_tokens", 2000)
            
            suggested_agents.append(AgentSuggestion(
                agent_id=agent_id,
                agent_name=agent_info["name"],
                reason=agent.get("reason", "Required for project"),
                estimated_tokens=estimated_tokens
            ))
            
            total_tokens += estimated_tokens
        
        # Calculate cost (assuming $0.02 per 1000 tokens)
        total_cost = (total_tokens / 1000) * 0.02
        
        return AnalyzeProjectResponse(
            success=True,
            suggested_agents=suggested_agents,
            total_estimated_tokens=total_tokens,
            total_estimated_cost=round(total_cost, 2),
            analysis=analysis_data.get("analysis", "Project analyzed successfully"),
            error=None
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON parsing error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to parse Gemini response: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Project analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}"
        )



@router.post("/analyze-requirements")
async def analyze_requirements(
    description: str,
    requirements: Dict[str, bool]
):
    """
    Analyze project requirements using Gemini AI.
    
    Args:
        description: Project description
        requirements: Feature flags
    
    Returns:
        AI-powered analysis with recommendations
    """
    if not gemini_service.is_available():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Gemini AI service not available"
        )
    
    logger.info(f"Analyzing requirements for: {description[:50]}...")
    
    try:
        from services.gemini_service import analyze_requirements as analyze_req
        
        result = await analyze_req(description, requirements)
        
        if not result.get("success"):
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=result.get("error", "Requirements analysis failed")
            )
        
        return result
        
    except Exception as e:
        logger.error(f"Requirements analysis error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Requirements analysis failed: {str(e)}"
        )

# Made with Bob
