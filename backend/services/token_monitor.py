"""
Token Monitoring Service

Tracks token usage, enforces limits, and provides real-time updates.
"""

from typing import Dict, Any
from datetime import datetime

from services.realtime_service import RealtimeService


class BudgetExceededError(Exception):
    """Raised when budget limit is exceeded."""
    pass


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
    
    def __init__(self, db, realtime: RealtimeService):
        self.db = db
        self.realtime = realtime
    
    async def check_budget(self, project_id: str) -> bool:
        """
        Check if project can proceed with execution.
        
        Raises:
            BudgetExceededError: If token or cost limit exceeded
        """
        project = await self.db.get_project(project_id)
        if not project:
            raise ValueError(f"Project {project_id} not found")
        
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
            "prompt_tokens": int(tokens_used * 0.5),  # Simplified split
            "completion_tokens": int(tokens_used * 0.5),
            "total_tokens": tokens_used,
            "cost": cost,
            "model": "bob",
            "timestamp": datetime.utcnow()
        }
        
        # Store in database
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
            if not agent:
                continue
                
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
        if not project:
            return {
                "total_tokens": 0,
                "total_cost": 0.0,
                "token_limit": 50000,
                "cost_limit": 5.0,
                "percentage": 0.0
            }
        
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
        if not project:
            return
            
        await self.db.update_project(project_id, {
            "total_tokens": project["total_tokens"] + tokens,
            "total_cost": project["total_cost"] + cost
        })

# Made with Bob
