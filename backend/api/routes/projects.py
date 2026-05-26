"""
Projects API Routes

Handles project-related endpoints.
"""

import logging
import traceback
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from database import db_client
from services.bob_orchestrator import BOBOrchestrator
from services.token_monitor import TokenMonitor
from services.realtime_service import RealtimeService

# Initialize logger
logger = logging.getLogger(__name__)


router = APIRouter()


# Mock realtime service for when Redis is not available
class MockRealtimeService:
    """Mock realtime service that does nothing."""
    
    async def emit_token_update(self, *args, **kwargs):
        """Mock token update emission."""
        pass
    
    async def emit_task_update(self, *args, **kwargs):
        """Mock task update emission."""
        pass
    
    async def emit_budget_alert(self, *args, **kwargs):
        """Mock budget alert emission."""
        pass
    
    async def emit_execution_complete(self, *args, **kwargs):
        """Mock execution complete emission."""
        pass
    
    async def emit_progress_update(self, *args, **kwargs):
        """Mock progress update emission."""
        pass
    
    async def emit_error(self, *args, **kwargs):
        """Mock error emission."""
        pass


class ProjectCreate(BaseModel):
    """Project creation request."""
    user_id: str
    name: str
    description: str
    requirements: Dict[str, bool]
    token_limit: int = 50000
    cost_limit: float = 5.0


class ProjectExecute(BaseModel):
    """Project execution request."""
    pass


@router.post("")
async def create_project(project: ProjectCreate):
    """
    Create a new project.
    """
    import logging
    import traceback
    
    logger = logging.getLogger(__name__)
    logger.info(f"Creating project: {project.name}")
    
    try:
        logger.info("Step 1: Creating project in database...")
        project_id = await db_client.create_project(project.dict())
        logger.info(f"Project created with ID: {project_id}")
        
        # Get BOB orchestrator (will be injected via dependency in production)
        # For now, create inline
        logger.info("Step 2: Initializing services...")
        from services.realtime_service import RealtimeService
        from services.token_monitor import TokenMonitor
        
        # Try to import and connect to Redis (optional dependency)
        redis_client = None
        try:
            import redis.asyncio as redis
            redis_client = redis.Redis(host='localhost', port=6379, decode_responses=True)
            await redis_client.ping()
            logger.info("Redis connection successful")
        except ImportError:
            logger.warning("Redis module not installed. Using mock services for real-time features.")
            redis_client = None
        except Exception as redis_error:
            logger.warning(f"Redis connection failed: {redis_error}. Using mock services.")
            redis_client = None
        
        # Create a mock realtime service for when Redis is not available
        class MockRealtimeService:
            async def emit_token_update(self, *args, **kwargs):
                pass
            async def emit_task_update(self, *args, **kwargs):
                pass
            async def emit_progress_update(self, *args, **kwargs):
                pass
            async def emit_error(self, *args, **kwargs):
                pass
        
        # Create services even without Redis (for local testing)
        if redis_client:
            realtime = RealtimeService(redis_client)
        else:
            logger.info("Using mock realtime service (Redis not available)")
            realtime = MockRealtimeService()
        
        token_monitor = TokenMonitor(db_client, realtime)
        orchestrator = BOBOrchestrator(db_client, token_monitor, realtime)
        logger.info("Services initialized successfully")
        
        # Analyze requirements and select agents
        logger.info(f"Step 3: Analyzing requirements: {project.requirements}")
        analysis = await orchestrator.analyze_requirements(
            project_id,
            project.description,
            project.requirements
        )
        logger.info(f"Analysis complete. Selected agents: {analysis['selected_agents']}")
        
        # Update project with selected agents
        logger.info("Step 4: Updating project with selected agents...")
        await db_client.update_project(project_id, {
            "selected_agents": analysis["selected_agents"]
        })
        logger.info("Project updated successfully")
        
        # Create execution plan
        logger.info("Step 5: Creating execution plan...")
        execution_plan = await orchestrator.create_execution_plan(
            project_id,
            analysis["selected_agents"]
        )
        logger.info(f"Execution plan created with {len(execution_plan.get('tasks', []))} tasks")
        
        logger.info("Project creation completed successfully")
        return {
            "project_id": project_id,
            "selected_agents": analysis["selected_agents"],
            "execution_plan": execution_plan,
            "status": "planning"
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}")


@router.get("/{project_id}")
async def get_project(project_id: str):
    """
    Get project details.
    """
    project = await db_client.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    return project


@router.get("/{project_id}/status")
async def get_project_status(project_id: str):
    """
    Get project execution status.
    """
    project = await db_client.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    tasks = await db_client.list_tasks(project_id)
    
    return {
        "project_id": project_id,
        "status": project["status"],
        "total_tokens": project["total_tokens"],
        "total_cost": project["total_cost"],
        "tasks": tasks
    }


@router.post("/{project_id}/execute")
async def execute_project(project_id: str):
    """
    Start project execution.
    """
    logger.info(f"=== EXECUTE PROJECT START for project: {project_id} ===")
    
    try:
        logger.info("Step 1: Fetching project...")
        project = await db_client.get_project(project_id)
        if not project:
            logger.error(f"Project not found: {project_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        logger.info(f"Project found: {project.get('name', 'Unknown')}")
        
        logger.info("Step 2: Checking project status...")
        if project["status"] != "planning":
            logger.error(f"Invalid project status: {project['status']}")
            raise HTTPException(
                status_code=400,
                detail=f"Project is in {project['status']} state, cannot execute"
            )
        logger.info("Project status is valid (planning)")
        
        logger.info("Step 3: Initializing services...")
        # Use mock realtime service (no Redis)
        logger.info("Using mock realtime service (Redis disabled)")
        realtime = MockRealtimeService()
        
        logger.info("Step 4: Creating token monitor and orchestrator...")
        token_monitor = TokenMonitor(db_client, realtime)
        orchestrator = BOBOrchestrator(db_client, token_monitor, realtime)
        logger.info("Services initialized successfully")
        
        logger.info("Step 5: Starting project execution...")
        # Execute project (this will run in background in production)
        result = await orchestrator.orchestrate_execution(project_id)
        logger.info(f"Execution started: {result}")
        
        logger.info("=== EXECUTE PROJECT COMPLETE ===")
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== EXECUTE PROJECT ERROR ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Execution failed: {str(e)}\n\nTraceback:\n{traceback.format_exc()}"
        )


@router.get("/{project_id}/tokens")
async def get_token_usage(project_id: str):
    """
    Get token usage for project.
    """
    project = await db_client.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    usage_records = await db_client.get_project_token_usage(project_id)
    
    return {
        "project_id": project_id,
        "total_tokens": project["total_tokens"],
        "total_cost": project["total_cost"],
        "token_limit": project["token_limit"],
        "cost_limit": project["cost_limit"],
        "usage_records": usage_records
    }


@router.post("/{project_id}/estimate")
async def estimate_cost(project_id: str):
    """
    Estimate cost before execution.
    """
    import traceback
    
    logger.info(f"=== ESTIMATE COST START for project: {project_id} ===")
    
    try:
        logger.info("Step 1: Fetching project...")
        project = await db_client.get_project(project_id)
        if not project:
            logger.error(f"Project not found: {project_id}")
            raise HTTPException(status_code=404, detail="Project not found")
        logger.info(f"Project found: {project.get('name', 'Unknown')}")
        
        logger.info("Step 2: Fetching execution plan...")
        execution_plan = await db_client.get_execution_plan(project_id)
        if not execution_plan:
            logger.error(f"Execution plan not found for project: {project_id}")
            raise HTTPException(status_code=404, detail="Execution plan not found")
        logger.info(f"Execution plan found with {len(execution_plan.get('tasks', []))} tasks")
        
        # Create mock realtime service
        # Get token monitor with mock service
        logger.info("Step 3: Initializing services...")
        # Use mock realtime service (no Redis)
        logger.info("Using mock realtime service (Redis disabled)")
        realtime = MockRealtimeService()
        
        logger.info("Step 4: Creating token monitor...")
        token_monitor = TokenMonitor(db_client, realtime)
        logger.info("Token monitor created successfully")
        
        logger.info("Step 5: Estimating cost...")
        estimate = await token_monitor.estimate_cost(execution_plan)
        logger.info(f"Estimate calculated: {estimate}")
        
        logger.info("=== ESTIMATE COST COMPLETE ===")
        return estimate
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"=== ESTIMATE COST ERROR ===")
        logger.error(f"Error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}\n\nTraceback:\n{traceback.format_exc()}")

@router.get("/{project_id}/output")
async def get_project_output(project_id: str):
    """
    Get all outputs generated for a project.
    Returns the generated project files and code.
    """
    logger.info(f"=== GET PROJECT OUTPUT for project: {project_id} ===")
    
    try:
        # Get project
        project = await db_client.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all tasks for this project
        tasks = await db_client.list_tasks(project_id)
        
        # Collect all generated files/artifacts
        generated_files = {}
        agent_outputs = []
        
        for task in tasks:
            task_output = task.get("output", {})
            
            # Extract artifacts (generated files)
            artifacts = task_output.get("artifacts", [])
            for artifact in artifacts:
                file_path = artifact.get("path", f"file_{len(generated_files)}.txt")
                file_content = artifact.get("content", "")
                generated_files[file_path] = file_content
            
            # Also include agent output for reference
            agent_outputs.append({
                "agent_id": task["agent_id"],
                "agent_name": task.get("name", "Unknown Agent"),
                "status": task["status"],
                "content": task_output.get("content", ""),
                "metadata": task_output.get("metadata", {})
            })
        
        # If no artifacts, create a sample project structure
        if not generated_files:
            generated_files = {
                "index.html": "<!DOCTYPE html>\n<html>\n<head>\n    <title>" + project["name"] + "</title>\n    <link rel=\"stylesheet\" href=\"styles.css\">\n</head>\n<body>\n    <h1>" + project["name"] + "</h1>\n    <p>" + project["description"] + "</p>\n    <script src=\"script.js\"></script>\n</body>\n</html>",
                "styles.css": "body {\n    font-family: Arial, sans-serif;\n    margin: 0;\n    padding: 20px;\n    background: #f5f5f5;\n}\n\nh1 {\n    color: #333;\n}",
                "script.js": "// " + project["name"] + "\nconsole.log('Project initialized');\n\n// Add your JavaScript code here",
                "README.md": f"# {project['name']}\n\n{project['description']}\n\n## Generated by AI Agent Project Studio\n\nThis project was created using BOB orchestration with the following agents:\n" + "\n".join([f"- {agent}" for agent in project.get('selected_agents', [])])
            }
        
        # Format outputs to match frontend expectations
        formatted_outputs = []
        for task in tasks:
            formatted_outputs.append({
                "task_id": task["id"],
                "task_name": task.get("name", "Unknown Task"),
                "agent_id": task["agent_id"],
                "status": task["status"],
                "output": task.get("output", {}),
                "result": task.get("result"),
                "created_at": task.get("created_at", ""),
                "completed_at": task.get("end_time", "")
            })
        
        return {
            "project_id": project_id,
            "project_name": project["name"],
            "project_description": project["description"],
            "project_status": project["status"],
            "total_tasks": len(tasks),
            "outputs": formatted_outputs,
            "generated_files": generated_files,
            "agent_outputs": agent_outputs,
            "total_files": len(generated_files),
            "total_agents": len(agent_outputs)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting project output: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get project output: {str(e)}"
        )

@router.get("/{project_id}/export")
async def export_project(project_id: str):
    """
    Export project as ZIP file.
    Returns a ZIP file containing project data, tasks, and outputs.
    """
    logger.info(f"=== EXPORT PROJECT as ZIP for project: {project_id} ===")
    
    try:
        from fastapi.responses import StreamingResponse
        from services.project_export_service import ProjectExportService
        
        # Get project
        project = await db_client.get_project(project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Get all tasks
        tasks = await db_client.list_tasks(project_id)
        
        # Generate ZIP
        zip_buffer = await ProjectExportService.export_project_as_zip(project, tasks)
        
        # Generate filename
        project_name = project.get('name', 'project').lower().replace(' ', '-')
        timestamp = datetime.now().strftime('%Y-%m-%d')
        filename = f"{project_name}-{timestamp}.zip"
        
        logger.info(f"ZIP export successful: {filename}")
        
        # Return as streaming response
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting project: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to export project: {str(e)}"
        )



# Made with Bob
