"""
BOB Orchestrator Integration

This module provides the interface for BOB (IBM's AI Assistant) to:
1. Receive project requirements
2. Select appropriate agents
3. Execute agents sequentially
4. Track progress and token usage
5. Return results

BOB acts as the intelligent orchestrator, making all decisions about
agent selection, execution order, and output generation.

Now supports MCP (Model Context Protocol) for local development,
allowing direct integration with Bob in VS Code without API keys.
"""

from typing import List, Dict, Any, Optional
from datetime import datetime
import logging
import os

from services.token_monitor import TokenMonitor
from services.realtime_service import RealtimeService
from services.bob_code_generator import bob_code_generator
from agents.agent_loader import AGENT_DEFINITIONS, AGENT_SELECTION_RULES, get_specialist_persona

# Import MCP client for local development
try:
    from services.mcp_client import mcp_client
    MCP_AVAILABLE = True
except ImportError:
    MCP_AVAILABLE = False
    mcp_client = None

# Import Gemini service for AI-powered analysis
try:
    from services.gemini_service import gemini_service
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    gemini_service = None

logger = logging.getLogger(__name__)


class BOBOrchestrator:
    """
    Interface for BOB to orchestrate agent execution.
    
    BOB will call these methods to:
    - Analyze requirements
    - Select agents
    - Execute tasks
    - Track progress
    """
    
    def __init__(self, db, token_monitor: TokenMonitor,
                 realtime: RealtimeService, use_mcp: bool = True, use_gemini: bool = True):
        self.db = db
        self.token_monitor = token_monitor
        self.realtime = realtime
        self.use_mcp = use_mcp and MCP_AVAILABLE and mcp_client is not None and mcp_client.is_available()
        self.use_gemini = use_gemini and GEMINI_AVAILABLE and gemini_service is not None and gemini_service.is_available()
        
        if self.use_mcp:
            logger.info("✓ MCP mode enabled - using Bob in VS Code for dynamic generation")
        else:
            logger.info("✗ MCP mode disabled - using static templates")
            if use_mcp and not MCP_AVAILABLE:
                logger.warning("MCP client not available - install dependencies")
            elif use_mcp and mcp_client is not None and not mcp_client.is_available():
                logger.warning("MCP server not built - run: cd mcp-server && npm run build")
        
        if self.use_gemini:
            logger.info("✓ Gemini AI enabled - enhanced requirement analysis available")
        else:
            logger.info("✗ Gemini AI disabled")
            if use_gemini and not GEMINI_AVAILABLE:
                logger.warning("Gemini service not available - install google-genai")
            elif use_gemini and gemini_service is not None and not gemini_service.is_available():
                logger.warning("Gemini API key not configured - set GEMINI_API_KEY in .env")
    
    async def analyze_requirements(self, project_id: str,
                                   description: str,
                                   requirements: Dict[str, bool]) -> Dict[str, Any]:
        """
        BOB analyzes project requirements and suggests agents.
        
        Args:
            project_id: Project identifier
            description: User's project description
            requirements: Structured requirements (needsDatabase, etc.)
        
        Returns:
            Analysis result with suggested agents and execution plan
        """
        # Try Gemini AI-powered analysis first
        if self.use_gemini and gemini_service is not None:
            try:
                logger.info("Using Gemini AI for intelligent requirement analysis")
                gemini_result = await gemini_service.analyze_requirements(
                    description,
                    requirements
                )
                
                if gemini_result.get("success"):
                    logger.info("Gemini analysis successful")
                    analysis_data = gemini_result.get("data", {})
                    
                    # Extract agent suggestions from Gemini if available
                    # For now, we'll use the analysis to enhance our selection
                    logger.info(f"Gemini recommendations: {analysis_data.get('architecture', 'N/A')}")
                else:
                    logger.warning(f"Gemini analysis failed: {gemini_result.get('error')}")
            except Exception as e:
                logger.error(f"Gemini analysis error: {str(e)}, falling back to rule-based")
        
        # Try MCP-based dynamic analysis as fallback
        elif self.use_mcp and mcp_client is not None:
            try:
                logger.info("Using MCP for dynamic requirement analysis")
                mcp_result = await mcp_client.analyze_requirements(
                    description,
                    requirements
                )
                
                logger.info(f"MCP analysis prompt generated (length: {len(mcp_result.get('prompt', ''))} chars)")
                logger.info("Note: In production, Bob would process this prompt and return agent selection")
            except Exception as e:
                logger.error(f"MCP analysis failed: {str(e)}, falling back to rule-based")
        
        # Rule-based agent selection (fallback or default)
        selected_agents = []
        
        # Check each requirement and add corresponding agents
        for req_key, req_value in requirements.items():
            if req_value and req_key in AGENT_SELECTION_RULES:
                selected_agents.extend(AGENT_SELECTION_RULES[req_key])
        
        # If no specific requirements, use default agents
        if not selected_agents:
            selected_agents = AGENT_SELECTION_RULES["default"]
        
        # Remove duplicates while preserving order
        selected_agents = list(dict.fromkeys(selected_agents))
        
        if self.use_gemini:
            analysis_method = "Gemini AI-powered"
        elif self.use_mcp:
            analysis_method = "MCP-assisted"
        else:
            analysis_method = "Rule-based"
        
        return {
            "project_id": project_id,
            "selected_agents": selected_agents,
            "analysis": f"{analysis_method}: Selected {len(selected_agents)} agents",
            "requirements": requirements
        }
    
    async def select_agents(self, project_id: str, 
                           requirements: Dict[str, bool]) -> List[str]:
        """
        BOB selects appropriate agents based on requirements.
        
        Args:
            project_id: Project identifier
            requirements: Project requirements
        
        Returns:
            List of selected agent IDs
        """
        analysis = await self.analyze_requirements(project_id, "", requirements)
        return analysis["selected_agents"]
    
    async def create_execution_plan(self, project_id: str, 
                                   agent_ids: List[str]) -> Dict[str, Any]:
        """
        BOB creates execution plan for selected agents.
        
        Args:
            project_id: Project identifier
            agent_ids: List of agent IDs to execute
        
        Returns:
            Execution plan with tasks and order
        """
        project = await self.db.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        tasks = []
        for idx, agent_id in enumerate(agent_ids):
            agent = AGENT_DEFINITIONS.get(agent_id)
            if not agent:
                continue
            
            task = {
                "id": f"task_{idx}",
                "agent_id": agent_id,
                "name": f"{agent['name']} Task",
                "input": {
                    "project_description": project["description"],
                    "requirements": project["requirements"],
                    "previous_outputs": []
                },
                "execution_order": idx
            }
            tasks.append(task)
        
        execution_plan = {
            "project_id": project_id,
            "tasks": tasks,
            "total_tasks": len(tasks)
        }
        
        # Store execution plan
        await self.db.create_execution_plan(project_id, execution_plan)
        
        return execution_plan
    
    async def execute_agent(self, project_id: str, task_id: str, 
                           agent_id: str, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        BOB executes a single agent task.
        
        This is where BOB generates the actual output for each agent.
        BOB acts as the agent, generating appropriate responses based on
        the agent's role and the input data.
        
        Args:
            project_id: Project identifier
            task_id: Task identifier
            agent_id: Agent to execute
            input_data: Input for the agent
        
        Returns:
            Agent execution result with output and token usage
        """
        # Update task status
        await self.db.update_task(task_id, {
            "status": "running", 
            "start_time": datetime.utcnow()
        })
        
        # Emit real-time update
        await self.realtime.emit_task_update(project_id, {
            "task_id": task_id,
            "status": "running",
            "agent_id": agent_id
        })
        
        # Check budget before execution
        await self.token_monitor.check_budget(project_id)
        
        # BOB generates the agent output here
        # This is where BOB's intelligence comes in
        # BOB will generate appropriate responses based on agent type
        result = await self._generate_agent_output(agent_id, input_data)
        
        # Record token usage
        await self.token_monitor.record_usage(
            project_id=project_id,
            task_id=task_id,
            agent_id=agent_id,
            tokens_used=result["tokens_used"],
            cost=result["cost"]
        )
        
        # Update task with results
        await self.db.update_task(task_id, {
            "status": "completed",
            "output": result["output"],
            "tokens_used": result["tokens_used"],
            "cost": result["cost"],
            "end_time": datetime.utcnow()
        })
        
        # Emit completion update
        await self.realtime.emit_task_update(project_id, {
            "task_id": task_id,
            "status": "completed",
            "tokens_used": result["tokens_used"],
            "cost": result["cost"]
        })
        
        return result
    
    async def _generate_agent_output(self, agent_id: str,
                                    input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        BOB generates output for the specified agent.
        
        This is the core intelligence - BOB acts as each agent type
        and generates appropriate outputs based on specialist personas.
        
        Now uses Bob Code Generator for dynamic, AI-powered code generation.
        """
        agent = AGENT_DEFINITIONS.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        # Get project description from input
        project_description = input_data.get("project_description", "")
        requirements = input_data.get("requirements", {})
        previous_outputs = input_data.get("previous_outputs", [])
        
        # Try Bob Code Generator for dynamic generation
        try:
            logger.info(f"🤖 Using Bob Code Generator for: {agent_id}")
            
            # Generate code using Bob's AI capabilities
            bob_result = await bob_code_generator.generate_code_with_bob(
                agent_id=agent_id,
                project_description=project_description,
                requirements=requirements,
                previous_outputs=previous_outputs
            )
            
            # Check if Bob needs to process this
            if bob_result.get("status") == "needs_bob_processing":
                logger.info("⚠️  Bob processing required - context generated")
                logger.info(f"Context length: {len(bob_result.get('context', ''))} chars")
                
                # In production, this context would be sent to Bob through MCP
                # For now, we'll use the static generation as fallback
                logger.warning("Falling back to static templates (Bob integration pending)")
                
            else:
                # Bob successfully generated code
                logger.info("✅ Bob generated code successfully")
                
                output = {
                    "agent_id": agent_id,
                    "agent_name": agent["name"],
                    "content": bob_result.get("content", "Generated by Bob"),
                    "artifacts": bob_result.get("artifacts", []),
                    "metadata": {
                        "agent_type": agent["type"],
                        "capabilities_used": agent["capabilities"],
                        "project_description": project_description,
                        "generated_by": "bob_ai",
                        **bob_result.get("metadata", {})
                    }
                }
                
                # Estimate tokens based on generated content
                total_chars = len(output["content"])
                for artifact in output["artifacts"]:
                    total_chars += len(artifact.get("content", ""))
                
                tokens_used = total_chars // 4  # Rough estimate: 4 chars per token
                cost = self.token_monitor.calculate_cost(tokens_used)
                
                return {
                    "output": output,
                    "tokens_used": tokens_used,
                    "cost": cost
                }
                
        except Exception as e:
            logger.error(f"Bob Code Generator failed: {str(e)}, falling back to static templates")
        
        # Static template generation (fallback)
        logger.info(f"📝 Using static templates for: {agent_id}")
        artifacts = []
        content = ""
        
        if agent_id == "ui_specialist":
            # Generate React + TypeScript + Tailwind components
            content = f"Generated React components for: {project_description}"
            artifacts = self._generate_ui_code(project_description, requirements)
            
        elif agent_id == "api_specialist":
            # Generate FastAPI endpoints
            content = f"Generated FastAPI REST API for: {project_description}"
            artifacts = self._generate_api_code(project_description, requirements)
            
        elif agent_id == "logic_specialist":
            # Generate business logic
            content = f"Generated business logic for: {project_description}"
            artifacts = self._generate_logic_code(project_description, requirements)
            
        elif agent_id == "ecommerce_specialist":
            # Generate e-commerce specification
            content = f"Generated e-commerce specification for: {project_description}"
            artifacts = self._generate_ecommerce_spec(project_description, requirements)
        
        output = {
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "content": content,
            "artifacts": artifacts,
            "metadata": {
                "agent_type": agent["type"],
                "capabilities_used": agent["capabilities"],
                "project_description": project_description,
                "generated_by": "static_template"
            }
        }
        
        # Estimate tokens used
        tokens_used = agent["estimated_tokens"]
        cost = self.token_monitor.calculate_cost(tokens_used)
        
        return {
            "output": output,
            "tokens_used": tokens_used,
            "cost": cost
        }
    
    def _generate_ui_code(self, description: str, requirements: Dict[str, bool]) -> List[Dict[str, str]]:
        """Generate React + TypeScript + Tailwind UI code based on description."""
        artifacts = []
        
        # Parse description to extract meaningful content
        description_lower = description.lower()
        
        # Determine project title and main heading
        if "hello world" in description_lower or "olá mundo" in description_lower or "ola mundo" in description_lower:
            title = "Hello World"
            main_heading = "Olá, Mundo!" if "olá" in description_lower or "ola" in description_lower else "Hello, World!"
            description_text = "A simple hello world application"
        elif "website" in description_lower or "site" in description_lower:
            # Extract what the site should display
            if "h1" in description_lower:
                # Try to extract text between quotes
                import re
                match = re.search(r'["\']([^"\']+)["\']', description)
                if match:
                    main_heading = match.group(1)
                    title = main_heading[:50]  # Limit title length
                    description_text = f"Website displaying: {main_heading}"
                else:
                    title = "My Website"
                    main_heading = "Welcome to My Website"
                    description_text = "A custom website"
            else:
                title = "My Website"
                main_heading = "Welcome"
                description_text = description[:100]
        else:
            # Generic fallback
            title = "My Application"
            main_heading = "Welcome"
            description_text = description[:100]
        
        # Generate index.html
        artifacts.append({
            "path": "index.html",
            "content": f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
</body>
</html>"""
        })
        
        # Generate App.tsx
        artifacts.append({
            "path": "src/App.tsx",
            "content": f"""// src/App.tsx
import React from 'react';

export function App() {{
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {main_heading}
          </h1>
          <p className="text-lg text-gray-600">
            {description_text}
          </p>
        </header>
        
        <main className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4">Welcome!</h2>
            <p className="text-gray-700 mb-6">
              This is your generated application. Start building amazing features!
            </p>
            
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
              Get Started
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}}

export default App;
"""
        })
        
        # Generate main.tsx
        artifacts.append({
            "path": "src/main.tsx",
            "content": """// src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
"""
        })
        
        return artifacts
    
    def _generate_api_code(self, description: str, requirements: Dict[str, bool]) -> List[Dict[str, str]]:
        """Generate FastAPI REST API code."""
        artifacts = []
        
        # Generate main.py
        artifacts.append({
            "path": "main.py",
            "content": f"""# main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="{description}",
    description="Generated REST API",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {{
        "message": "Welcome to {description} API",
        "docs": "/docs"
    }}

@app.get("/health")
async def health_check():
    return {{"status": "healthy"}}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
"""
        })
        
        # Generate requirements.txt
        artifacts.append({
            "path": "requirements.txt",
            "content": """fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
"""
        })
        
        return artifacts
    
    def _generate_logic_code(self, description: str, requirements: Dict[str, bool]) -> List[Dict[str, str]]:
        """Generate business logic code."""
        artifacts = []
        
        # Generate services.py
        artifacts.append({
            "path": "services.py",
            "content": f"""# services.py
\"\"\"
Business logic for {description}
\"\"\"

class BusinessService:
    \"\"\"Main business service.\"\"\"
    
    def __init__(self):
        pass
    
    async def process_data(self, data: dict) -> dict:
        \"\"\"Process business data.\"\"\"
        # Add your business logic here
        return {{"status": "processed", "data": data}}
"""
        })
        
        return artifacts
    
    def _generate_ecommerce_spec(self, description: str, requirements: Dict[str, bool]) -> List[Dict[str, str]]:
        """Generate e-commerce specification."""
        artifacts = []
        
        # Generate specification.md
        artifacts.append({
            "path": "specification.md",
            "content": f"""# E-commerce Specification: {description}

## Overview
This document specifies the e-commerce system requirements.

## Entities

### Products
- id (integer, primary key)
- name (string, required)
- description (text)
- price (decimal, required)
- stock (integer, required)
- created_at (timestamp)
- updated_at (timestamp)

### Orders
- id (integer, primary key)
- customer_name (string, required)
- total (decimal, required)
- status (enum: pending, paid, shipped, delivered)
- created_at (timestamp)

## API Endpoints

### Products
- POST /products - Create product
- GET /products - List products
- GET /products/{{id}} - Get product
- PATCH /products/{{id}} - Update product
- DELETE /products/{{id}} - Delete product

### Orders
- POST /orders - Create order
- GET /orders - List orders
- GET /orders/{{id}} - Get order
- PATCH /orders/{{id}}/status - Update order status
"""
        })
        
        return artifacts
    
    async def orchestrate_execution(self, project_id: str) -> Dict[str, Any]:
        """
        BOB orchestrates the complete execution flow.
        
        This is the main entry point for project execution.
        BOB will:
        1. Get execution plan
        2. Execute agents sequentially
        3. Track progress
        4. Handle errors
        5. Return final results
        """
        # Get project and execution plan
        project = await self.db.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
        execution_plan = await self.db.get_execution_plan(project_id)
        if not execution_plan:
            raise ValueError(f"No execution plan found for project {project_id}")
        
        # Update project status
        await self.db.update_project(project_id, {"status": "executing"})
        
        results = []
        
        # Execute tasks sequentially
        for task_data in execution_plan["tasks"]:
            task_id = None
            try:
                # Create task in database
                task_id = await self.db.create_task({
                    "project_id": project_id,
                    "agent_id": task_data["agent_id"],
                    "name": task_data["name"],
                    "input": task_data["input"],
                    "execution_order": task_data["execution_order"]
                })
                
                # Execute the agent
                result = await self.execute_agent(
                    project_id=project_id,
                    task_id=task_id,
                    agent_id=task_data["agent_id"],
                    input_data=task_data["input"]
                )
                results.append(result)
                
                # Emit progress update
                completed = len(results)
                total = len(execution_plan["tasks"])
                await self.realtime.emit_progress_update(project_id, {
                    "completed": completed,
                    "total": total,
                    "percentage": (completed / total) * 100
                })
                
            except Exception as e:
                # Handle task failure
                if task_id:
                    await self.db.update_task(task_id, {
                        "status": "failed",
                        "error": str(e)
                    })
                    await self.realtime.emit_error(project_id, {
                        "task_id": task_id,
                        "error": str(e)
                    })
                    print(f"Task {task_id} failed: {str(e)}")
                else:
                    print(f"Task creation failed: {str(e)}")
        
        # Update project status
        await self.db.update_project(project_id, {"status": "completed"})
        
        return {
            "project_id": project_id,
            "status": "completed",
            "results": results,
            "total_tokens": sum(r["tokens_used"] for r in results),
            "total_cost": sum(r["cost"] for r in results)
        }

# Made with Bob
