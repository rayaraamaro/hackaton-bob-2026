"""
Bob Code Generator Service

This service integrates Bob's AI capabilities directly into the orchestrator.
When a project is executed, Bob generates real code based on agent personas.

Flow:
1. Orchestrator calls generate_code_with_bob()
2. Service loads agent persona and builds context
3. Service invokes Bob through MCP to generate code
4. Bob returns structured artifacts (files with content)
5. Service returns artifacts to orchestrator for storage
"""

import json
import logging
import asyncio
import subprocess
from typing import Dict, Any, List, Optional
from pathlib import Path

logger = logging.getLogger(__name__)


class BobCodeGenerator:
    """Service for generating code using Bob's AI capabilities."""
    
    def __init__(self, agents_dir: Optional[str] = None):
        """
        Initialize Bob code generator.
        
        Args:
            agents_dir: Path to agents directory with persona files
        """
        if agents_dir is None:
            backend_dir = Path(__file__).parent.parent
            self.agents_dir = backend_dir / "agents" / "specialists"
        else:
            self.agents_dir = Path(agents_dir)
    
    def load_agent_persona(self, agent_id: str) -> Optional[str]:
        """
        Load agent persona from markdown file.
        
        Args:
            agent_id: Agent identifier (e.g., 'ui_specialist')
            
        Returns:
            Full persona content or None if not found
        """
        try:
            persona_file = self.agents_dir / f"{agent_id}.md"
            if not persona_file.exists():
                logger.warning(f"Persona file not found: {persona_file}")
                return None
            
            return persona_file.read_text(encoding='utf-8')
        except Exception as e:
            logger.error(f"Error loading persona for {agent_id}: {str(e)}")
            return None
    
    def build_generation_context(
        self,
        agent_id: str,
        agent_persona: str,
        project_description: str,
        requirements: Dict[str, bool],
        previous_outputs: Optional[List[Dict[str, Any]]] = None
    ) -> str:
        """
        Build comprehensive context for Bob to generate code.
        
        Args:
            agent_id: Agent identifier
            agent_persona: Full agent persona from markdown
            project_description: Project description
            requirements: Project requirements
            previous_outputs: Outputs from previous agents
            
        Returns:
            Formatted context string for Bob
        """
        context = f"""# Code Generation Task for {agent_id}

## Project Description
{project_description}

## Requirements
{json.dumps(requirements, indent=2)}

## Your Role
You are acting as the **{agent_id}** agent. Your persona and guidelines are below.

## Agent Persona
{agent_persona}

## Previous Agent Outputs
"""
        
        if previous_outputs:
            for idx, output in enumerate(previous_outputs, 1):
                context += f"\n### Agent {idx}: {output.get('agent_id', 'Unknown')}\n"
                context += f"**Content:** {output.get('content', 'No content')}\n"
                
                # Include artifacts from previous agents
                artifacts = output.get('artifacts', [])
                if artifacts:
                    context += f"**Generated {len(artifacts)} files:**\n"
                    for artifact in artifacts[:3]:  # Show first 3 files
                        context += f"- {artifact.get('path', 'unknown')}\n"
        else:
            context += "No previous outputs (you are the first agent).\n"
        
        context += """

## Your Task

Generate **complete, production-ready code** for this project based on:
1. The project description above
2. Your agent persona and technology stack
3. The requirements specified
4. Any previous agent outputs (for context)

### Output Format

Return your response as a JSON object with this EXACT structure:

```json
{
  "content": "Brief description of what you generated",
  "artifacts": [
    {
      "path": "relative/file/path.ext",
      "content": "COMPLETE file content here - no placeholders!"
    }
  ],
  "metadata": {
    "technologies_used": ["tech1", "tech2"],
    "notes": "Any important notes about the implementation"
  }
}
```

### Critical Rules

1. **NO PLACEHOLDERS**: Every file must be complete and runnable
2. **NO TODOS**: Implement all features described in the project
3. **FOLLOW PERSONA**: Use the exact technology stack from your persona
4. **TYPE SAFETY**: Include all type definitions and imports
5. **BEST PRACTICES**: Follow coding standards from your persona
6. **COMPLETE FILES**: Include ALL necessary code, not just snippets

### Example Features to Implement

Based on the project description, identify and implement:
- All entities mentioned (e.g., "blog" → Post, Comment, User)
- All features mentioned (e.g., "authentication" → login, register, JWT)
- All relationships (e.g., User has many Posts, Post has many Comments)
- All CRUD operations needed
- All UI components needed
- All API endpoints needed

**Generate the code now!**
"""
        
        return context
    
    async def _invoke_bob_through_mcp(self, context: str) -> Optional[str]:
        """
        Invoke Bob through the MCP server to generate code.
        
        This method calls the MCP server with the generation context
        and expects Bob to return generated code as JSON.
        
        Args:
            context: The generation context for Bob
            
        Returns:
            Bob's response as a string, or None if invocation fails
        """
        try:
            # Path to MCP server
            backend_dir = Path(__file__).parent.parent
            project_dir = backend_dir.parent
            mcp_server_path = project_dir / "mcp-server" / "build" / "bob-code-generator.js"
            
            if not mcp_server_path.exists():
                logger.warning(f"MCP server not found at {mcp_server_path}")
                logger.warning("Run: cd mcp-server && npm run build")
                return None
            
            # Build MCP request
            request = {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "tools/call",
                "params": {
                    "name": "get_code_generation_context",
                    "arguments": {
                        "project_description": "Context provided",
                        "requirements": {}
                    }
                }
            }
            
            # Call MCP server
            logger.info("Calling MCP server to invoke Bob...")
            process = await asyncio.create_subprocess_exec(
                "node",
                str(mcp_server_path),
                stdin=asyncio.subprocess.PIPE,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            # Send request
            request_json = json.dumps(request)
            stdout, stderr = await process.communicate(input=request_json.encode())
            
            if stderr:
                logger.debug(f"MCP stderr: {stderr.decode()}")
            
            if process.returncode != 0:
                logger.error(f"MCP server exited with code {process.returncode}")
                return None
            
            # Parse response
            response_text = stdout.decode().strip()
            logger.info(f"MCP response received (length: {len(response_text)} chars)")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error invoking Bob through MCP: {str(e)}")
            return None
    
    async def _invoke_bob_directly(self, context: str) -> Optional[Dict[str, Any]]:
        """
        Direct invocation of IBM Bob API for code generation.
        
        Uses HTTP API calls to IBM Bob with API key authentication.
        
        Args:
            context: The generation context
            
        Returns:
            Structured response with generated code
        """
        import os
        import aiohttp
        from config.settings import settings
        
        logger.info("=" * 80)
        logger.info("STEP 1: Checking IBM Bob API configuration")
        logger.info("=" * 80)
        
        # Get API key and URL from settings
        api_key = settings.BOB_API_KEY or os.getenv("BOB_API_KEY")
        api_url = settings.BOB_API_URL or os.getenv("BOB_API_URL", "https://api.bob.ibm.com/v1")
        
        logger.info(f"API URL: {api_url}")
        logger.info(f"API Key present: {bool(api_key)}")
        if api_key:
            logger.info(f"API Key length: {len(api_key)} characters")
            logger.info(f"API Key prefix: {api_key[:20]}...")
        
        if not api_key:
            logger.error("IBM Bob API key not found!")
            logger.info("To enable: Set BOB_API_KEY in .env file")
            return None
        
        try:
            logger.info("=" * 80)
            logger.info("STEP 2: Preparing API request")
            logger.info("=" * 80)
            logger.info(f"Context length: {len(context)} characters")
            
            # Prepare API request
            headers = {
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            }
            
            payload = {
                "messages": [
                    {
                        "role": "user",
                        "content": context
                    }
                ],
                "model": "bob-code-generation",
                "max_tokens": 8000,
                "temperature": 0.7
            }
            
            logger.info(f"Request headers: Authorization=Bearer {api_key[:20]}..., Content-Type=application/json")
            logger.info(f"Request payload: model={payload['model']}, max_tokens={payload['max_tokens']}, temperature={payload['temperature']}")
            logger.info(f"Message content length: {len(payload['messages'][0]['content'])} chars")
            
            logger.info("=" * 80)
            logger.info("STEP 3: Making HTTP request to IBM Bob API")
            logger.info("=" * 80)
            
            endpoint = f"{api_url}/chat/completions"
            logger.info(f"Endpoint: {endpoint}")
            logger.info("Timeout: 120 seconds")
            
            # Make API call with timeout
            timeout = aiohttp.ClientTimeout(total=120)
            async with aiohttp.ClientSession(timeout=timeout) as session:
                logger.info("HTTP session created, sending POST request...")
                
                async with session.post(
                    endpoint,
                    headers=headers,
                    json=payload
                ) as response:
                    logger.info(f"Response status: {response.status}")
                    logger.info(f"Response headers: {dict(response.headers)}")
                    
                    if response.status != 200:
                        error_text = await response.text()
                        logger.error("=" * 80)
                        logger.error("STEP 4: API REQUEST FAILED")
                        logger.error("=" * 80)
                        logger.error(f"Status code: {response.status}")
                        logger.error(f"Error response: {error_text}")
                        return None
                    
                    logger.info("=" * 80)
                    logger.info("STEP 4: Processing API response")
                    logger.info("=" * 80)
                    
                    result = await response.json()
                    logger.info(f"Response JSON keys: {list(result.keys())}")
                    
                    # Extract generated content
                    if "choices" in result and len(result["choices"]) > 0:
                        generated_content = result["choices"][0]["message"]["content"]
                        logger.info(f"Generated content length: {len(generated_content)} characters")
                        logger.info(f"Generated content preview (first 200 chars): {generated_content[:200]}...")
                        
                        logger.info("=" * 80)
                        logger.info("STEP 5: Parsing Bob's response")
                        logger.info("=" * 80)
                        
                        # Parse the response
                        parsed = self.parse_bob_response(generated_content)
                        
                        if parsed:
                            logger.info(f"Parsing successful!")
                            logger.info(f"Artifacts found: {len(parsed.get('artifacts', []))}")
                            for i, artifact in enumerate(parsed.get('artifacts', [])):
                                logger.info(f"  Artifact {i+1}: {artifact.get('path', 'unknown')} ({len(artifact.get('content', ''))} chars)")
                        
                        logger.info("=" * 80)
                        logger.info("SUCCESS: Bob AI code generation complete!")
                        logger.info("=" * 80)
                        
                        return parsed
                    else:
                        logger.error("Unexpected API response format - no 'choices' in response")
                        logger.error(f"Response structure: {result}")
                        return None
                    
        except aiohttp.ClientError as e:
            logger.error("=" * 80)
            logger.error("ERROR: HTTP Client Error")
            logger.error("=" * 80)
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            logger.error("This usually means network connectivity issues or invalid URL")
            return None
        except asyncio.TimeoutError:
            logger.error("=" * 80)
            logger.error("ERROR: Request Timeout")
            logger.error("=" * 80)
            logger.error("IBM Bob API request timed out after 120 seconds")
            logger.error("The API took too long to respond")
            return None
        except Exception as e:
            logger.error("=" * 80)
            logger.error("ERROR: Unexpected Exception")
            logger.error("=" * 80)
            logger.error(f"Error type: {type(e).__name__}")
            logger.error(f"Error message: {str(e)}")
            import traceback
            logger.error(f"Traceback: {traceback.format_exc()}")
            return None
    
    async def generate_code_with_bob(
        self,
        agent_id: str,
        project_description: str,
        requirements: Dict[str, bool],
        previous_outputs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """
        Generate code using Bob's AI capabilities.
        
        This is the main entry point for code generation. It:
        1. Loads the agent persona
        2. Builds generation context
        3. Attempts to invoke Bob through available methods
        4. Falls back to returning context if invocation fails
        
        Args:
            agent_id: Agent identifier
            project_description: Project description
            requirements: Project requirements
            previous_outputs: Outputs from previous agents
            
        Returns:
            Generated code artifacts and metadata
        """
        logger.info("*" * 100)
        logger.info(f"*** STARTING CODE GENERATION FOR AGENT: {agent_id} ***")
        logger.info("*" * 100)
        logger.info(f"Project: {project_description}")
        logger.info(f"Requirements: {requirements}")
        logger.info(f"Previous outputs: {len(previous_outputs) if previous_outputs else 0}")
        
        logger.info("-" * 100)
        logger.info("PHASE 1: Loading agent persona")
        logger.info("-" * 100)
        
        # Load agent persona
        agent_persona = self.load_agent_persona(agent_id)
        if not agent_persona:
            logger.error(f"FAILED: Could not load persona for {agent_id}")
            return {
                "content": f"Error: Agent persona not found for {agent_id}",
                "artifacts": [],
                "metadata": {"error": "persona_not_found"}
            }
        
        logger.info(f"SUCCESS: Loaded persona for {agent_id} ({len(agent_persona)} chars)")
        
        logger.info("-" * 100)
        logger.info("PHASE 2: Building generation context")
        logger.info("-" * 100)
        
        # Build generation context
        context = self.build_generation_context(
            agent_id=agent_id,
            agent_persona=agent_persona,
            project_description=project_description,
            requirements=requirements,
            previous_outputs=previous_outputs
        )
        
        logger.info(f"SUCCESS: Generation context built ({len(context)} chars)")
        
        logger.info("-" * 100)
        logger.info("PHASE 3: Attempting Bob invocation")
        logger.info("-" * 100)
        
        # Try to invoke Bob through available methods
        bob_response = None
        
        # Method 1: Try MCP server
        logger.info("METHOD 1: Trying MCP server...")
        bob_response = await self._invoke_bob_through_mcp(context)
        
        if bob_response:
            logger.info("SUCCESS: MCP server returned response")
        else:
            logger.info("MCP server did not return response, trying direct API...")
        
        # Method 2: Try direct API call (if API key available)
        if not bob_response:
            logger.info("METHOD 2: Trying direct IBM Bob API...")
            bob_response_dict = await self._invoke_bob_directly(context)
            if bob_response_dict:
                logger.info("SUCCESS: Direct API call returned response")
                return bob_response_dict
            else:
                logger.warning("FAILED: Direct API call did not return response")
        
        # If Bob was successfully invoked, parse the response
        if bob_response:
            logger.info("-" * 100)
            logger.info("PHASE 4: Parsing Bob's response")
            logger.info("-" * 100)
            try:
                parsed = self.parse_bob_response(bob_response)
                if parsed.get("artifacts"):
                    logger.info(f"SUCCESS: Bob generated {len(parsed['artifacts'])} files")
                    logger.info("*" * 100)
                    logger.info("*** CODE GENERATION COMPLETE ***")
                    logger.info("*" * 100)
                    return parsed
                else:
                    logger.warning("WARNING: Parsed response has no artifacts")
            except Exception as e:
                logger.error(f"ERROR: Failed to parse Bob response: {str(e)}")
                import traceback
                logger.error(f"Traceback: {traceback.format_exc()}")
        
        # Fallback: Return context for manual processing
        logger.error("=" * 100)
        logger.error("FALLBACK: Bob invocation not available")
        logger.error("=" * 100)
        logger.error("Neither MCP server nor direct API call succeeded")
        logger.error("Returning context for manual processing")
        logger.error("To enable Bob invocation:")
        logger.error("  1. Check IBM Bob API key is set in .env")
        logger.error("  2. Verify API endpoint is correct")
        logger.error("  3. Check network connectivity")
        logger.error("  4. Review logs above for specific errors")
        
        return {
            "status": "needs_bob_processing",
            "context": context,
            "agent_id": agent_id,
            "message": "Bob invocation not available - context ready for manual processing"
        }
    
    def parse_bob_response(self, bob_output: str) -> Dict[str, Any]:
        """
        Parse Bob's generated code response.
        
        Args:
            bob_output: Raw output from Bob
            
        Returns:
            Structured response with artifacts
        """
        try:
            # Try to parse as JSON
            if bob_output.strip().startswith('{'):
                return json.loads(bob_output)
            
            # Try to extract JSON from markdown code blocks
            import re
            json_match = re.search(r'```json\s*(\{.*?\})\s*```', bob_output, re.DOTALL)
            if json_match:
                return json.loads(json_match.group(1))
            
            # Fallback: return as plain text
            return {
                "content": "Generated code (parsing failed)",
                "artifacts": [{
                    "path": "output.txt",
                    "content": bob_output
                }],
                "metadata": {"parse_error": True}
            }
        except Exception as e:
            logger.error(f"Error parsing Bob response: {str(e)}")
            return {
                "content": "Error parsing response",
                "artifacts": [],
                "metadata": {"error": str(e)}
            }


# Global instance
bob_code_generator = BobCodeGenerator()


async def generate_code_for_agent(
    agent_id: str,
    project_description: str,
    requirements: Dict[str, bool],
    previous_outputs: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Convenience function to generate code for an agent.
    
    Args:
        agent_id: Agent identifier
        project_description: Project description
        requirements: Project requirements
        previous_outputs: Outputs from previous agents
        
    Returns:
        Generated code artifacts
    """
    return await bob_code_generator.generate_code_with_bob(
        agent_id=agent_id,
        project_description=project_description,
        requirements=requirements,
        previous_outputs=previous_outputs
    )


# Made with Bob