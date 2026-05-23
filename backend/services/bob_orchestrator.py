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
from agents.agent_loader import AGENT_DEFINITIONS, AGENT_SELECTION_RULES, get_specialist_persona


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
        
        # Rule-based agent selection for MVP
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
        
        return {
            "project_id": project_id,
            "selected_agents": selected_agents,
            "analysis": f"Based on requirements, selected {len(selected_agents)} agents",
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
        and generates appropriate outputs.
        """
        agent = AGENT_DEFINITIONS.get(agent_id)
        if not agent:
            raise ValueError(f"Agent {agent_id} not found")
        
        # BOB implements agent-specific logic here
        # For MVP, return placeholder output
        # In production, BOB would generate actual code/content
        
        output = {
            "agent_id": agent_id,
            "agent_name": agent["name"],
            "content": f"Generated output for {agent['name']}",
            "artifacts": [],
            "metadata": {
                "agent_type": agent["type"],
                "capabilities_used": agent["capabilities"]
            }
        }
        
        # Estimate tokens used (BOB would track actual usage)
        tokens_used = agent["estimated_tokens"]
        cost = self.token_monitor.calculate_cost(tokens_used)
        
        return {
            "output": output,
            "tokens_used": tokens_used,
            "cost": cost
        }
    
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
