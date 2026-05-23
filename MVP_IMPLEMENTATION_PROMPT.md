# AI Agent Project Studio - MVP Implementation Prompt

## Project Overview

Build an AI Agent Project Studio MVP where users provide a project description, and **BOB (IBM's AI Assistant)** acts as the orchestrator to select and coordinate specialized agents to build the solution. The system must include infrastructure as code, database connectivity, frontend, backend (Python), token limitation, and real-time usage monitoring.

---

## MVP Requirements

### Core Features
1. ✅ Simple project input form with guided questions
2. ✅ 5 pre-built agents (the config files (.yaml) are already inside the "agents" directory)
3. ✅ Rule-based agent selection
4. ✅ Sequential execution only
5. ✅ Real-time progress tracking with WebSocket
6. ✅ Token usage monitoring and limits
7. ✅ Simple artifact generation (code files)
8. ✅ Cost estimation before execution

### Technical Stack
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Python 3.11+ + FastAPI
- **Database**: Firestore (Google Cloud)
- **Cache**: Redis (for real-time updates and session management)
- **LLM Orchestrator**: BOB (IBM's AI Assistant) - handles all agent coordination and execution
- **Infrastructure**: Google Cloud Platform (Terraform)
- **Real-time**: WebSocket (FastAPI WebSocket support)

---

## Key Architecture Concept

**BOB as the Orchestrator**: Instead of implementing custom LLM calls, BOB (IBM's AI Assistant) serves as the intelligent orchestrator. The backend provides the infrastructure, agent definitions, and execution framework, while BOB:
- Analyzes user requirements
- Selects appropriate agents
- Generates agent outputs
- Coordinates execution flow
- Tracks progress and token usage

---

## Implementation Tasks

### 1. Infrastructure as Code (Terraform)

**File**: `infrastructure/terraform/main.tf`

Create Terraform configuration to provision:

```hcl
# Required GCP Resources:
# - Firestore Database (Native mode)
# - Cloud Run (for Python FastAPI backend)
# - Cloud Storage Bucket (for frontend hosting and artifacts)
# - Cloud Load Balancer
# - Redis Instance (Memorystore)
# - IAM Service Accounts and permissions
# - API Gateway (optional for rate limiting)
# - Cloud Monitoring and Logging

# Variables to include:
# - project_id
# - region (default: us-central1)
# - environment (dev/staging/prod)
# - bob_api_endpoint (IBM BOB API endpoint)
```

**Requirements**:
- Use Terraform modules for reusability
- Enable Firestore in Native mode
- Configure Redis with 1GB memory for MVP
- Set up Cloud Storage bucket with public read for frontend
- Create service account with minimal required permissions
- Enable Cloud Monitoring API
- Configure backend URL as environment variable
- Store secrets in Google Secret Manager
- Deploy FastAPI backend to Cloud Run

**Files to create**:
- `infrastructure/terraform/main.tf` - Main configuration
- `infrastructure/terraform/variables.tf` - Input variables
- `infrastructure/terraform/outputs.tf` - Output values
- `infrastructure/terraform/modules/firestore/main.tf` - Firestore module
- `infrastructure/terraform/modules/redis/main.tf` - Redis module
- `infrastructure/terraform/modules/storage/main.tf` - Storage module
- `infrastructure/terraform/modules/cloudrun/main.tf` - Cloud Run module

---

### 2. Database Schema & Connection (Firestore)

**File**: `backend/database/firestore.py`

Implement Firestore connection and schema initialization:

```python
# Collections to create:
# - projects: Store project metadata and status
# - agents: Store agent definitions
# - tasks: Store individual task executions
# - executionPlans: Store execution plans
# - tokenUsage: Store token consumption logs
# - users: Store user data and limits

# Indexes to create:
# - projects: userId, status, createdAt
# - tasks: projectId, status, executionOrder
# - tokenUsage: projectId, timestamp
```

**Requirements**:
- Initialize Firestore Admin SDK
- Create helper functions for CRUD operations
- Implement connection pooling
- Add error handling and retry logic
- Create database initialization script
- Implement data validation before writes
- Add transaction support for critical operations

**Files to create**:
- `backend/database/firestore.py` - Connection and base operations
- `backend/database/models/project.py` - Project model
- `backend/database/models/agent.py` - Agent model
- `backend/database/models/task.py` - Task model
- `backend/database/models/token_usage.py` - Token usage model
- `backend/database/init.py` - Database initialization script

**Data Models**:

```python
from dataclasses import dataclass
from datetime import datetime
from typing import Optional, List, Dict, Any

@dataclass
class Project:
    id: str
    user_id: str
    name: str
    description: str
    requirements: Dict[str, bool]  # needsDatabase, needsAuth, etc.
    status: str  # 'planning' | 'executing' | 'completed' | 'failed'
    selected_agents: List[str]
    created_at: datetime
    updated_at: datetime
    total_tokens: int
    total_cost: float
    token_limit: int  # Per-project token limit
    cost_limit: float  # Per-project cost limit

@dataclass
class Agent:
    id: str
    name: str
    type: str  # 'database' | 'ui' | 'logic' | 'api' | 'faq'
    description: str
    capabilities: List[str]
    estimated_tokens: int
    estimated_time: int  # minutes
    system_prompt: str
    version: str

@dataclass
class Task:
    id: str
    project_id: str
    agent_id: str
    name: str
    status: str  # 'pending' | 'running' | 'completed' | 'failed'
    input: Dict[str, Any]
    output: Optional[Dict[str, Any]]
    error: Optional[str]
    start_time: Optional[datetime]
    end_time: Optional[datetime]
    tokens_used: int
    cost: float
    execution_order: int

@dataclass
class TokenUsage:
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
```

---

### 3. Backend Implementation (Python FastAPI)

**File**: `backend/main.py`

Create FastAPI server with the following endpoints:

```python
# API Endpoints:
# POST /api/projects - Create new project
# GET /api/projects/{id} - Get project details
# GET /api/projects/{id}/status - Get real-time status
# POST /api/projects/{id}/execute - Start execution (triggers BOB)
# GET /api/agents - List available agents
# GET /api/projects/{id}/tokens - Get token usage
# POST /api/projects/{id}/estimate - Estimate cost before execution
# WebSocket /ws/{project_id} - Real-time updates
```

**Requirements**:
- Implement FastAPI server with CORS
- Add request validation using Pydantic models
- Implement error handling middleware
- Add rate limiting (slowapi)
- Set up WebSocket for real-time updates
- Integrate with Firestore
- Integrate with Redis for caching
- Add logging (Python logging module)
- Implement health check endpoint
- Create BOB integration layer

**Files to create**:
- `backend/main.py` - Main FastAPI application
- `backend/api/routes/projects.py` - Project routes
- `backend/api/routes/agents.py` - Agent routes
- `backend/api/routes/websocket.py` - WebSocket routes
- `backend/api/middleware/validation.py` - Request validation
- `backend/api/middleware/error_handler.py` - Error handling
- `backend/api/middleware/rate_limiter.py` - Rate limiting
- `backend/config/settings.py` - Configuration management
- `backend/requirements.txt` - Dependencies

**Dependencies to include** (`requirements.txt`):
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
pydantic==2.5.0
python-dotenv==1.0.0
google-cloud-firestore==2.13.1
redis==5.0.1
slowapi==0.1.9
websockets==12.0
python-multipart==0.0.6
```

**Main Application Structure**:

```python
# backend/main.py
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from api.routes import projects, agents, websocket
from config.settings import settings
from database.firestore import init_firestore

# Initialize FastAPI app
app = FastAPI(
    title="AI Agent Project Studio",
    description="BOB-powered agent orchestration platform",
    version="1.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure rate limiting
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Initialize database
@app.on_event("startup")
async def startup_event():
    await init_firestore()

# Include routers
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(agents.router, prefix="/api/agents", tags=["agents"])
app.include_router(websocket.router, prefix="/ws", tags=["websocket"])

# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "orchestrator": "BOB"}
```

---

### 4. BOB Integration Layer

**File**: `backend/services/bob_orchestrator.py`

Create integration layer for BOB to orchestrate agents:

```python
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
"""

from typing import List, Dict, Any
from datetime import datetime
from database.firestore import FirestoreClient
from services.token_monitor import TokenMonitor
from services.realtime_service import RealtimeService

class BOBOrchestrator:
    """
    Interface for BOB to orchestrate agent execution.
    
    BOB will call these methods to:
    - Analyze requirements
    - Select agents
    - Execute tasks
    - Track progress
    """
    
    def __init__(self, db: FirestoreClient, token_monitor: TokenMonitor, 
                 realtime: RealtimeService):
        self.db = db
        self.token_monitor = token_monitor
        self.realtime = realtime
    
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
        # BOB will implement the logic here
        # This is a placeholder for BOB to fill in
        pass
    
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
        # BOB implements agent selection logic
        # Can use rule-based or intelligent selection
        pass
    
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
        # BOB creates the execution plan
        pass
    
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
        await self.db.update_task(task_id, {"status": "running", 
                                            "start_time": datetime.utcnow()})
        
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
        and generates appropriate outputs.
        """
        # BOB implements agent-specific logic here
        # BOB will generate different outputs based on agent type
        pass
    
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
        execution_plan = await self.db.get_execution_plan(project_id)
        
        # Update project status
        await self.db.update_project(project_id, {"status": "executing"})
        
        results = []
        
        # Execute tasks sequentially
        for task in execution_plan["tasks"]:
            try:
                result = await self.execute_agent(
                    project_id=project_id,
                    task_id=task["id"],
                    agent_id=task["agent_id"],
                    input_data=task["input"]
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
                await self.db.update_task(task["id"], {
                    "status": "failed",
                    "error": str(e)
                })
                await self.realtime.emit_error(project_id, {
                    "task_id": task["id"],
                    "error": str(e)
                })
                # Continue with next task or stop based on error severity
        
        # Update project status
        await self.db.update_project(project_id, {"status": "completed"})
        
        return {
            "project_id": project_id,
            "status": "completed",
            "results": results,
            "total_tokens": sum(r["tokens_used"] for r in results),
            "total_cost": sum(r["cost"] for r in results)
        }
```

**Key Points**:
- BOB is the intelligent orchestrator, not a separate LLM service
- The backend provides the framework and infrastructure
- BOB makes all decisions about agent selection and execution
- BOB generates all agent outputs based on context and requirements
- The backend tracks execution, tokens, and provides real-time updates

---

### 5. Token Limitation & Monitoring System

**File**: `backend/services/token_monitor.py`

Implement comprehensive token tracking and limitation:

```python
"""
Token Monitoring Service

Tracks token usage, enforces limits, and provides real-time updates.
"""

from typing import Dict, Any
from datetime import datetime
from database.firestore import FirestoreClient
from services.realtime_service import RealtimeService

class TokenMonitor:
    """
    Monitors and enforces token usage limits.
    """
    
    # Pricing for different models (example)
    PRICING = {
        "gpt-4-turbo": {
            "input": 0.01 / 1000,   # $0.01 per 1K tokens
            "output": 0.03 / 1000   # $0.03 per 1K tokens
        },
        "bob": {  # BOB's token pricing
            "input": 0.01 / 1000,
            "output": 0.03 / 1000
        }
    }
    
    def __init__(self, db: FirestoreClient, realtime: RealtimeService):
        self.db = db
        self.realtime = realtime
    
    async def check_budget(self, project_id: str) -> bool:
        """
        Check if project can proceed with execution.
        
        Raises:
            BudgetExceededError: If token or cost limit exceeded
        """
        project = await self.db.get_project(project_id)
        usage = await self.get_project_usage(project_id)
        
        if usage["total_tokens"] >= project["token_limit"]:
            raise BudgetExceededError("Token limit exceeded")
        
        if usage["total_cost"] >= project["cost_limit"]:
            raise BudgetExceededError("Cost limit exceeded")
        
        # Check alert thresholds
        token_percentage = usage["total_tokens"] / project["token_limit"]
        if token_percentage >= 0.95:
            await self.send_alert(project_id, "critical", token_percentage)
        elif token_percentage >= 0.80:
            await self.send_alert(project_id, "warning", token_percentage)
        
        return True
    
    async def record_usage(self, project_id: str, task_id: str, 
                          agent_id: str, tokens_used: int, cost: float):
        """
        Record token usage after agent execution.
        """
        # Create usage record
        usage_record = {
            "project_id": project_id,
            "task_id": task_id,
            "agent_id": agent_id,
            "total_tokens": tokens_used,
            "cost": cost,
            "model": "bob",
            "timestamp": datetime.utcnow()
        }
        
        # Store in Firestore
        await self.db.create_token_usage(usage_record)
        
        # Update project totals
        await self.update_project_totals(project_id, tokens_used, cost)
        
        # Emit real-time update
        total_usage = await self.get_project_usage(project_id)
        await self.realtime.emit_token_update(project_id, total_usage)
    
    async def estimate_cost(self, execution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """
        Estimate cost before execution.
        """
        total_tokens = 0
        total_cost = 0.0
        breakdown = []
        
        for task in execution_plan["tasks"]:
            agent = await self.db.get_agent(task["agent_id"])
            estimated_tokens = agent["estimated_tokens"]
            estimated_cost = self.calculate_cost(estimated_tokens, "bob")
            
            total_tokens += estimated_tokens
            total_cost += estimated_cost
            
            breakdown.append({
                "task_name": task["name"],
                "estimated_tokens": estimated_tokens,
                "estimated_cost": estimated_cost
            })
        
        return {
            "estimated_tokens": total_tokens,
            "estimated_cost": total_cost,
            "breakdown": breakdown,
            "confidence": 0.7  # Estimates are approximate
        }
    
    def calculate_cost(self, tokens: int, model: str = "bob") -> float:
        """
        Calculate cost for given token count.
        """
        pricing = self.PRICING.get(model, self.PRICING["bob"])
        # Simplified: assume 50/50 split between input/output
        return (tokens * 0.5 * pricing["input"]) + (tokens * 0.5 * pricing["output"])
    
    async def send_alert(self, project_id: str, level: str, percentage: float):
        """
        Send budget alert.
        """
        await self.realtime.emit_budget_alert(project_id, {
            "level": level,
            "percentage": percentage,
            "message": f"{level.upper()}: {percentage * 100:.1f}% of budget used"
        })
    
    async def get_project_usage(self, project_id: str) -> Dict[str, Any]:
        """
        Get current project token usage.
        """
        project = await self.db.get_project(project_id)
        return {
            "total_tokens": project["total_tokens"],
            "total_cost": project["total_cost"],
            "token_limit": project["token_limit"],
            "cost_limit": project["cost_limit"],
            "percentage": (project["total_tokens"] / project["token_limit"]) * 100
        }
    
    async def update_project_totals(self, project_id: str, 
                                   tokens: int, cost: float):
        """
        Update project token and cost totals.
        """
        project = await self.db.get_project(project_id)
        await self.db.update_project(project_id, {
            "total_tokens": project["total_tokens"] + tokens,
            "total_cost": project["total_cost"] + cost
        })


class BudgetExceededError(Exception):
    """Raised when budget limit is exceeded."""
    pass
```

---

### 6. Agent Library Implementation

**File**: `backend/agents/`

Define 5 core agents that BOB will use:

```python
# backend/agents/agent_definitions.py

"""
Agent Definitions

These define the agents that BOB can use.
BOB will act as each agent type and generate appropriate outputs.
"""

AGENT_DEFINITIONS = {
    "database": {
        "id": "database",
        "name": "Database Agent",
        "type": "database",
        "description": "Generates database schemas, migrations, and indexes",
        "capabilities": [
            "Schema design",
            "Migration scripts",
            "Index optimization",
            "Relationship modeling"
        ],
        "estimated_tokens": 2000,
        "estimated_time": 5,  # minutes
        "system_prompt": """You are a database design expert. Generate database schemas,
        migration scripts, and index recommendations based on project requirements.
        Output should include table definitions, relationships, and SQL scripts.""",
        "version": "1.0.0"
    },
    "ui": {
        "id": "ui",
        "name": "UI Agent",
        "type": "ui",
        "description": "Generates React components and page layouts",
        "capabilities": [
            "Component generation",
            "Page layouts",
            "Styling suggestions",
            "Responsive design"
        ],
        "estimated_tokens": 3000,
        "estimated_time": 7,
        "system_prompt": """You are a frontend development expert. Generate React
        components, page layouts, and styling code. Use modern React patterns with
        hooks and functional components. Include Tailwind CSS for styling.""",
        "version": "1.0.0"
    },
    "logic": {
        "id": "logic",
        "name": "Logic Agent",
        "type": "logic",
        "description": "Generates business logic and service functions",
        "capabilities": [
            "Business logic",
            "Service functions",
            "Algorithm implementation",
            "Data processing"
        ],
        "estimated_tokens": 2500,
        "estimated_time": 6,
        "system_prompt": """You are a software architecture expert. Generate business
        logic, service functions, and algorithms. Focus on clean, maintainable code
        with proper error handling and validation.""",
        "version": "1.0.0"
    },
    "api": {
        "id": "api",
        "name": "API Agent",
        "type": "api",
        "description": "Generates API endpoints and route handlers",
        "capabilities": [
            "REST API design",
            "Route handlers",
            "Request validation",
            "Response formatting"
        ],
        "estimated_tokens": 2000,
        "estimated_time": 5,
        "system_prompt": """You are an API design expert. Generate RESTful API
        endpoints, route handlers, and validation logic. Include proper error
        handling, status codes, and documentation.""",
        "version": "1.0.0"
    },
    "faq": {
        "id": "faq",
        "name": "FAQ Agent",
        "type": "faq",
        "description": "Generates FAQ content and chatbot responses",
        "capabilities": [
            "FAQ generation",
            "Chatbot responses",
            "Common questions",
            "Help documentation"
        ],
        "estimated_tokens": 1500,
        "estimated_time": 4,
        "system_prompt": """You are a technical writer and customer support expert.
        Generate FAQ content, chatbot responses, and help documentation. Focus on
        clarity, completeness, and user-friendly language.""",
        "version": "1.0.0"
    }
}


# Agent selection rules for BOB to use
AGENT_SELECTION_RULES = {
    "needsDatabase": ["database", "api"],
    "needsAuth": ["database", "api", "logic"],
    "needsPayment": ["database", "api", "logic"],
    "needsFAQ": ["faq", "ui"],
    "default": ["ui", "logic", "api"]
}
```

**Files to create**:
- `backend/agents/agent_definitions.py` - Agent definitions
- `backend/agents/base_agent.py` - Base agent interface (for structure)

---

### 7. Real-Time Updates System

**File**: `backend/services/realtime_service.py`

Implement WebSocket-based real-time updates:

```python
"""
Real-time Service

Handles WebSocket connections and real-time event broadcasting.
"""

from typing import Dict, Any, Set
from fastapi import WebSocket
import json
import redis.asyncio as redis

class RealtimeService:
    """
    Manages WebSocket connections and real-time updates.
    """
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.active_connections: Dict[str, Set[WebSocket]] = {}
    
    async def connect(self, project_id: str, websocket: WebSocket):
        """
        Connect client to project room.
        """
        await websocket.accept()
        
        if project_id not in self.active_connections:
            self.active_connections[project_id] = set()
        
        self.active_connections[project_id].add(websocket)
        
        # Replay recent events
        await self.replay_events(project_id, websocket)
    
    async def disconnect(self, project_id: str, websocket: WebSocket):
        """
        Disconnect client from project room.
        """
        if project_id in self.active_connections:
            self.active_connections[project_id].discard(websocket)
            
            if not self.active_connections[project_id]:
                del self.active_connections[project_id]
    
    async def emit_task_update(self, project_id: str, update: Dict[str, Any]):
        """
        Emit task status update to all connected clients.
        """
        event = {
            "type": "task:update",
            "data": update,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_token_update(self, project_id: str, usage: Dict[str, Any]):
        """
        Emit token usage update.
        """
        event = {
            "type": "token:update",
            "data": usage,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_progress_update(self, project_id: str, progress: Dict[str, Any]):
        """
        Emit progress update.
        """
        event = {
            "type": "progress:update",
            "data": progress,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_budget_alert(self, project_id: str, alert: Dict[str, Any]):
        """
        Emit budget alert.
        """
        event = {
            "type": "budget:alert",
            "data": alert,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def emit_error(self, project_id: str, error: Dict[str, Any]):
        """
        Emit error notification.
        """
        event = {
            "type": "error:occurred",
            "data": error,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        await self.broadcast(project_id, event)
        await self.cache_event(project_id, event)
    
    async def broadcast(self, project_id: str, event: Dict[str, Any]):
        """
        Broadcast event to all connected clients in project room.
        """
        if project_id not in self.active_connections:
            return
        
        message = json.dumps(event)
        
        # Send to all connected clients
        disconnected = set()
        for websocket in self.active_connections[project_id]:
            try:
                await websocket.send_text(message)
            except Exception:
                disconnected.add(websocket)
        
        # Remove disconnected clients
        for websocket in disconnected:
            self.active_connections[project_id].discard(websocket)
    
    async def cache_event(self, project_id: str, event: Dict[str, Any]):
        """
        Cache event in Redis for replay.
        """
        key = f"events:{project_id}"
        await self.redis.lpush(key, json.dumps(event))
        await self.redis.ltrim(key, 0, 99)  # Keep last 100 events
        await self.redis.expire(key, 3600)  # Expire after 1 hour
    
    async def replay_events(self, project_id: str, websocket: WebSocket):
        """
        Replay recent events to reconnected client.
        """
        key = f"events:{project_id}"
        events = await self.redis.lrange(key, 0, -1)
        
        for event_str in reversed(events):
            try:
                await websocket.send_text(event_str)
            except Exception:
                break
```

---

### 8. Frontend Implementation

**File**: `frontend/src/`

Create React application with real-time updates:

**Key Components**:

1. **Token Monitor Component** (`src/components/TokenMonitor.tsx`)
```typescript
import React from 'react';
import { useTokenMonitor } from '../hooks/useTokenMonitor';

export function TokenMonitor({ projectId }: { projectId: string }) {
  const { tokens, cost, limit, percentage, alerts } = useTokenMonitor(projectId);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Token Usage</h3>
      
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-2">
          <span>Tokens Used</span>
          <span>{tokens.toLocaleString()} / {limit.toLocaleString()}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              percentage > 95 ? 'bg-red-500' :
              percentage > 80 ? 'bg-yellow-500' :
              'bg-green-500'
            }`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Cost Display */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-600">Total Cost</p>
          <p className="text-2xl font-bold">${cost.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Percentage Used</p>
          <p className="text-2xl font-bold">{percentage.toFixed(1)}%</p>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div 
              key={idx}
              className={`p-3 rounded ${
                alert.level === 'critical' ? 'bg-red-100 text-red-800' :
                alert.level === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                'bg-blue-100 text-blue-800'
              }`}
            >
              {alert.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

2. **WebSocket Hook** (`src/hooks/useWebSocket.ts`)
```typescript
import { useEffect, useState } from 'react';

export function useWebSocket(projectId: string) {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const websocket = new WebSocket(`${import.meta.env.VITE_WS_URL}/ws/${projectId}`);

    websocket.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
    };

    websocket.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    websocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setWs(websocket);

    return () => {
      websocket.close();
    };
  }, [projectId]);

  return { ws, connected };
}
```

**Files to create**:
- `frontend/src/App.tsx` - Main app
- `frontend/src/pages/HomePage.tsx` - Home page
- `frontend/src/pages/ExecutionPage.tsx` - Execution page
- `frontend/src/components/TokenMonitor.tsx` - Token monitor
- `frontend/src/components/ProgressBar.tsx` - Progress bar
- `frontend/src/components/TaskList.tsx` - Task list
- `frontend/src/hooks/useWebSocket.ts` - WebSocket hook
- `frontend/src/hooks/useTokenMonitor.ts` - Token monitor hook
- `frontend/src/services/api.ts` - API client

---

### 9. Configuration & Environment

**Backend** (`backend/.env.example`):
```env
# Server Configuration
PORT=8000
ENVIRONMENT=development

# Google Cloud
GCP_PROJECT_ID=your-project-id
GCP_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json

# Firestore
FIRESTORE_DATABASE_ID=(default)

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Token Limits
DEFAULT_TOKEN_LIMIT=50000
DEFAULT_COST_LIMIT=5.00
ALERT_THRESHOLD_WARNING=0.80
ALERT_THRESHOLD_CRITICAL=0.95

# CORS
CORS_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_PER_MINUTE=60
```

**Frontend** (`frontend/.env.example`):
```env
VITE_API_URL=http://localhost:8000
VITE_WS_URL=ws://localhost:8000
```

---

### 10. Deployment

**Dockerfile** (`backend/Dockerfile`):
```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Deploy Script** (`scripts/deploy.sh`):
```bash
#!/bin/bash

echo "🚀 Deploying AI Agent Project Studio MVP..."

# Deploy infrastructure
cd infrastructure/terraform
terraform init
terraform apply -auto-approve
cd ../..

# Build and deploy backend
cd backend
gcloud run deploy bob-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
cd ..

# Build and deploy frontend
cd frontend
npm install
npm run build
gsutil -m rsync -r dist gs://your-bucket-name
cd ..

echo "✅ Deployment complete!"
```

---

## Success Criteria

✅ User can input project description
✅ BOB selects appropriate agents
✅ BOB executes agents sequentially
✅ Real-time progress updates via WebSocket
✅ Token usage tracked and displayed
✅ Budget limits enforced
✅ Alerts at 80% and 95% thresholds
✅ Cost estimation before execution
✅ Infrastructure provisioned via Terraform
✅ Backend deployed to Cloud Run
✅ Frontend deployed to Cloud Storage

---

## Timeline: 6 weeks

- Week 1: Infrastructure + Database
- Week 2: Backend API + BOB integration
- Week 3: Token monitoring + Agents
- Week 4: Frontend + Real-time updates
- Week 5: Integration + Testing
- Week 6: Deployment + Documentation

---

## Key Differences from Original

1. **Backend**: Python/FastAPI instead of Node.js/Express
2. **Orchestrator**: BOB (IBM's AI Assistant) instead of custom LLM calls
3. **Architecture**: BOB acts as the intelligent layer, backend provides infrastructure
4. **Deployment**: Cloud Run instead of Cloud Functions

---

**BOB is the orchestrator - the backend provides the framework for BOB to work within.**