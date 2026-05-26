"""
MCP Client for BOB Orchestrator

This client connects to the MCP server to communicate with Bob in VS Code.
It allows the backend to use Bob for dynamic code generation without an API key.
"""

import json
import subprocess
import asyncio
import logging
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)


class MCPClient:
    """Client for communicating with the MCP server."""
    
    def __init__(self, mcp_server_path: Optional[str] = None):
        """
        Initialize MCP client.
        
        Args:
            mcp_server_path: Path to the MCP server executable.
                           Defaults to ../mcp-server/build/index.js
        """
        if mcp_server_path is None:
            # Default to the mcp-server in the project
            backend_dir = Path(__file__).parent.parent
            project_dir = backend_dir.parent
            mcp_server_path = str(project_dir / "mcp-server" / "build" / "index.js")
        
        self.mcp_server_path = mcp_server_path
        self.request_id = 0
        
        # Verify MCP server exists
        if not Path(self.mcp_server_path).exists():
            logger.warning(f"MCP server not found at {self.mcp_server_path}")
            logger.warning("Run 'cd mcp-server && npm run build' to build the server")
    
    def _get_next_id(self) -> int:
        """Get next request ID."""
        self.request_id += 1
        return self.request_id
    
    async def _call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Dict[str, Any]:
        """
        Call an MCP tool.
        
        Args:
            tool_name: Name of the tool to call
            arguments: Tool arguments
            
        Returns:
            Tool response
        """
        try:
            # Build JSON-RPC request
            request = {
                "jsonrpc": "2.0",
                "id": self._get_next_id(),
                "method": "tools/call",
                "params": {
                    "name": tool_name,
                    "arguments": arguments
                }
            }
            
            # Convert to JSON
            request_json = json.dumps(request)
            logger.info(f"Calling MCP tool: {tool_name}")
            logger.debug(f"Request: {request_json}")
            
            # Call MCP server via subprocess
            process = await asyncio.create_subprocess_exec(
                "node",
                self.mcp_server_path,
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Send request and get response
            stdout, stderr = await process.communicate(input=request_json.encode())
            
            if stderr:
                logger.warning(f"MCP server stderr: {stderr.decode()}")
            
            if process.returncode != 0:
                raise Exception(f"MCP server exited with code {process.returncode}")
            
            # Parse response
            response_text = stdout.decode().strip()
            logger.debug(f"Response: {response_text}")
            
            # Handle multiple JSON objects (server may send multiple messages)
            lines = response_text.split('\n')
            for line in lines:
                if line.strip():
                    try:
                        response = json.loads(line)
                        if "result" in response:
                            return response["result"]
                        elif "error" in response:
                            raise Exception(f"MCP error: {response['error']}")
                    except json.JSONDecodeError:
                        continue
            
            raise Exception("No valid response from MCP server")
            
        except Exception as e:
            logger.error(f"Error calling MCP tool {tool_name}: {str(e)}")
            raise
    
    async def generate_code(
        self,
        agent_id: str,
        agent_persona: str,
        project_description: str,
        requirements: Dict[str, bool],
        previous_outputs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate code using Bob through MCP.
        
        Args:
            agent_id: Agent identifier (e.g., 'ui_specialist')
            agent_persona: Full agent persona from markdown
            project_description: Project description
            requirements: Project requirements
            previous_outputs: Outputs from previous agents
            
        Returns:
            Generated code and artifacts
        """
        logger.info(f"Generating code with agent: {agent_id}")
        
        arguments = {
            "agent_id": agent_id,
            "agent_persona": agent_persona,
            "project_description": project_description,
            "requirements": requirements,
            "previous_outputs": previous_outputs or []
        }
        
        result = await self._call_tool("generate_code", arguments)
        
        # Extract the prompt that was sent to Bob
        if result.get("content") and len(result["content"]) > 0:
            prompt = result["content"][0].get("text", "")
            logger.info(f"MCP returned prompt for Bob (length: {len(prompt)} chars)")
            
            # In a real implementation, Bob would process this prompt
            # For now, we return a structured response indicating Bob should handle it
            return {
                "status": "prompt_ready",
                "prompt": prompt,
                "message": "This prompt should be processed by Bob in VS Code",
                "note": "In production, Bob would generate the actual code here"
            }
        
        return result
    
    async def analyze_requirements(
        self,
        project_description: str,
        requirements: Dict[str, bool]
    ) -> Dict[str, Any]:
        """
        Analyze project requirements and suggest agents.
        
        Args:
            project_description: Project description
            requirements: Project requirements
            
        Returns:
            Analysis with suggested agents
        """
        logger.info("Analyzing requirements with Bob")
        
        arguments = {
            "project_description": project_description,
            "requirements": requirements
        }
        
        result = await self._call_tool("analyze_requirements", arguments)
        
        # Extract the prompt
        if result.get("content") and len(result["content"]) > 0:
            prompt = result["content"][0].get("text", "")
            logger.info(f"MCP returned analysis prompt (length: {len(prompt)} chars)")
            
            return {
                "status": "prompt_ready",
                "prompt": prompt,
                "message": "This prompt should be processed by Bob in VS Code"
            }
        
        return result
    
    def is_available(self) -> bool:
        """Check if MCP server is available."""
        return Path(self.mcp_server_path).exists()


# Global MCP client instance
mcp_client = MCPClient()


async def test_mcp_connection():
    """Test MCP connection."""
    try:
        logger.info("Testing MCP connection...")
        
        if not mcp_client.is_available():
            logger.error("MCP server not found. Build it first with: cd mcp-server && npm run build")
            return False
        
        # Try a simple call
        result = await mcp_client.analyze_requirements(
            "Test project",
            {"needsDatabase": True}
        )
        
        logger.info(f"MCP test successful: {result.get('status')}")
        return True
        
    except Exception as e:
        logger.error(f"MCP test failed: {str(e)}")
        return False


if __name__ == "__main__":
    # Test the MCP client
    logging.basicConfig(level=logging.INFO)
    asyncio.run(test_mcp_connection())

# Made with Bob
