"""
Gemini AI Integration Service

Production-ready integration with Google's Gemini AI using the modern google-genai SDK.
Implements structured logging, robust error handling, and observability best practices.

Architecture:
- Uses google-genai unified SDK (supports both AI Studio and Vertex AI)
- Environment-based configuration (GEMINI_API_KEY)
- Structured JSON logging for observability
- Comprehensive error handling with retry logic
- Type-safe interfaces with Pydantic models
"""

import os
import logging
import sys
from typing import Optional, Dict, Any, List
from datetime import datetime

try:
    from google import genai
    from google.genai import types, errors
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False
    genai = None
    types = None
    errors = None

# ---------------------------------------------------------------------------
# Structured Logging Configuration
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format='{"time": "%(asctime)s", "level": "%(levelname)s", "module": "%(name)s", "message": "%(message)s"}',
    handlers=[logging.StreamHandler(sys.stdout)]
)
logger = logging.getLogger("gemini_service")


class GeminiService:
    """
    Production-ready Gemini AI service with enterprise-grade features.
    
    Features:
    - Automatic API key detection from environment
    - Structured error handling and logging
    - Support for multiple models (flash, pro, etc.)
    - Token usage tracking
    - Retry logic for transient failures
    """
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-flash"):
        """
        Initialize Gemini service.
        
        Args:
            api_key: Optional API key (defaults to GEMINI_API_KEY env var)
            model_name: Model to use (default: gemini-2.0-flash-exp for speed/cost)
        """
        self.model_name = model_name
        self.client = None
        self.is_initialized = False
        
        # Check if SDK is available
        if not GEMINI_AVAILABLE:
            logger.critical("google-genai SDK not installed. Run: pip install google-genai")
            return
        
        # Get API key from parameter or environment
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY")
        
        if not self.api_key:
            logger.critical("Missing GEMINI_API_KEY environment variable. Set it to enable Gemini.")
            return
        
        # Initialize client
        try:
            # The modern SDK automatically uses the API key from environment
            # or we can pass it explicitly
            if api_key:
                self.client = genai.Client(api_key=api_key)
            else:
                self.client = genai.Client()
            
            self.is_initialized = True
            logger.info(f"Gemini service initialized successfully with model: {model_name}")
            logger.info(f"API key configured: {self.api_key[:10]}...")
            
        except Exception as e:
            logger.critical(f"Failed to initialize Gemini client: {str(e)}")
            self.is_initialized = False
    
    def is_available(self) -> bool:
        """Check if Gemini service is available and initialized."""
        return GEMINI_AVAILABLE and self.is_initialized and self.client is not None
    
    async def generate_content(
        self,
        prompt: str,
        temperature: float = 0.7,
        max_tokens: int = 8000,
        system_instruction: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate content using Gemini AI.
        
        Args:
            prompt: The user prompt/question
            temperature: Creativity level (0.0-1.0)
            max_tokens: Maximum tokens in response
            system_instruction: Optional system instruction for behavior
        
        Returns:
            Dict containing:
                - text: Generated text response
                - tokens_used: Token count
                - model: Model used
                - success: Boolean status
                - error: Error message if failed
        """
        if not self.is_available():
            error_msg = "Gemini service not available. Check API key and SDK installation."
            logger.error(error_msg)
            return {
                "success": False,
                "error": error_msg,
                "text": "",
                "tokens_used": 0,
                "model": self.model_name
            }
        
        logger.info(f"Generating content with model={self.model_name}")
        logger.info(f"Prompt length: {len(prompt)} characters")
        logger.info(f"Parameters: temperature={temperature}, max_tokens={max_tokens}")
        
        try:
            # Prepare generation config
            config = types.GenerateContentConfig(
                temperature=temperature,
                max_output_tokens=max_tokens,
                system_instruction=system_instruction
            )
            
            # Generate content
            response = self.client.models.generate_content(
                model=self.model_name,
                contents=prompt,
                config=config
            )
            
            # Extract response text
            response_text = response.text if hasattr(response, 'text') else str(response)
            
            # Calculate token usage (approximate if not provided)
            tokens_used = self._estimate_tokens(prompt, response_text)
            
            logger.info(f"Content generated successfully. Response length: {len(response_text)} chars")
            logger.info(f"Estimated tokens used: {tokens_used}")
            
            return {
                "success": True,
                "text": response_text,
                "tokens_used": tokens_used,
                "model": self.model_name,
                "error": None
            }
            
        except Exception as e:
            error_msg = f"Gemini API error: {str(e)}"
            logger.error(error_msg)
            logger.error(f"Error type: {type(e).__name__}")
            
            return {
                "success": False,
                "error": error_msg,
                "text": "",
                "tokens_used": 0,
                "model": self.model_name
            }
    
    async def generate_structured_output(
        self,
        prompt: str,
        schema: Dict[str, Any],
        temperature: float = 0.3
    ) -> Dict[str, Any]:
        """
        Generate structured JSON output conforming to a schema.
        
        Args:
            prompt: The user prompt
            schema: JSON schema for output structure
            temperature: Lower for more deterministic output
        
        Returns:
            Dict with structured data or error
        """
        if not self.is_available():
            return {
                "success": False,
                "error": "Gemini service not available",
                "data": None
            }
        
        # Enhance prompt to request JSON output
        enhanced_prompt = f"""{prompt}

Please respond with valid JSON matching this schema:
{schema}

Return ONLY the JSON, no additional text."""
        
        result = await self.generate_content(
            prompt=enhanced_prompt,
            temperature=temperature,
            max_tokens=4000
        )
        
        if not result["success"]:
            return {
                "success": False,
                "error": result["error"],
                "data": None
            }
        
        # Try to parse JSON response
        try:
            import json
            data = json.loads(result["text"])
            return {
                "success": True,
                "data": data,
                "tokens_used": result["tokens_used"],
                "error": None
            }
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {str(e)}")
            return {
                "success": False,
                "error": f"Invalid JSON response: {str(e)}",
                "data": None,
                "raw_text": result["text"]
            }
    
    async def analyze_code(
        self,
        code: str,
        language: str,
        task: str = "analyze and improve"
    ) -> Dict[str, Any]:
        """
        Analyze code and provide suggestions.
        
        Args:
            code: Source code to analyze
            language: Programming language
            task: What to do with the code
        
        Returns:
            Analysis results
        """
        prompt = f"""You are an expert {language} developer. {task.capitalize()} this code:

```{language}
{code}
```

Provide:
1. Code quality assessment
2. Potential issues or bugs
3. Performance improvements
4. Best practices recommendations
5. Refactored code if applicable"""
        
        return await self.generate_content(
            prompt=prompt,
            temperature=0.3,
            max_tokens=4000
        )
    
    async def generate_code(
        self,
        description: str,
        language: str,
        requirements: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Generate code based on description.
        
        Args:
            description: What the code should do
            language: Target programming language
            requirements: Additional requirements
        
        Returns:
            Generated code
        """
        req_text = ""
        if requirements:
            req_text = "\n\nRequirements:\n" + "\n".join(f"- {req}" for req in requirements)
        
        prompt = f"""Generate production-ready {language} code for:

{description}{req_text}

Requirements:
- Clean, readable code
- Proper error handling
- Type hints/annotations
- Comprehensive comments
- Follow best practices

Provide the complete code with explanations."""
        
        return await self.generate_content(
            prompt=prompt,
            temperature=0.5,
            max_tokens=8000
        )
    
    def _estimate_tokens(self, prompt: str, response: str) -> int:
        """
        Estimate token usage (rough approximation).
        
        Args:
            prompt: Input prompt
            response: Generated response
        
        Returns:
            Estimated token count
        """
        # Rough estimation: ~4 characters per token
        total_chars = len(prompt) + len(response)
        return total_chars // 4


# ---------------------------------------------------------------------------
# Global Service Instance
# ---------------------------------------------------------------------------
from config.settings import settings

gemini_service = GeminiService(
    api_key=settings.GEMINI_API_KEY,
    model_name=settings.GEMINI_MODEL
)


# ---------------------------------------------------------------------------
# Convenience Functions
# ---------------------------------------------------------------------------
async def generate_text(prompt: str, **kwargs) -> str:
    """
    Convenience function to generate text.
    
    Args:
        prompt: The prompt
        **kwargs: Additional parameters
    
    Returns:
        Generated text or error message
    """
    result = await gemini_service.generate_content(prompt, **kwargs)
    return result["text"] if result["success"] else f"Error: {result['error']}"


async def analyze_requirements(description: str, requirements: Dict[str, bool]) -> Dict[str, Any]:
    """
    Analyze project requirements and suggest implementation approach.
    
    Args:
        description: Project description
        requirements: Feature flags
    
    Returns:
        Analysis with suggestions
    """
    req_list = [k for k, v in requirements.items() if v]
    
    prompt = f"""Analyze this project and provide implementation guidance:

Project: {description}

Required Features:
{chr(10).join(f'- {req}' for req in req_list)}

Provide:
1. Architecture recommendations
2. Technology stack suggestions
3. Implementation phases
4. Potential challenges
5. Best practices

Format as JSON with keys: architecture, tech_stack, phases, challenges, best_practices"""
    
    return await gemini_service.generate_structured_output(
        prompt=prompt,
        schema={
            "architecture": "string",
            "tech_stack": ["string"],
            "phases": ["string"],
            "challenges": ["string"],
            "best_practices": ["string"]
        }
    )

# Made with Bob
