"""
Configuration Settings

Manages application configuration using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # IBM Bob API Configuration
    BOB_API_KEY: Optional[str] = None
    BOBSHELL_API_KEY: Optional[str] = None
    BOB_API_URL: str = "https://api.bob.ibm.com/v1"
    
    # Gemini AI Configuration
    GEMINI_API_KEY: Optional[str] = None
    GEMINI_MODEL: str = "gemini-2.5-flash"  # Working model verified with API key
    GEMINI_TEMPERATURE: float = 0.7
    GEMINI_MAX_TOKENS: int = 8000
    
    # Server Configuration
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Redis (Optional for real-time features)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_PASSWORD: str = ""
    
    # Token Limits
    DEFAULT_TOKEN_LIMIT: int = 50000
    DEFAULT_COST_LIMIT: float = 5.00
    ALERT_THRESHOLD_WARNING: float = 0.80
    ALERT_THRESHOLD_CRITICAL: float = 0.95
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    
    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    class Config:
        env_file = "../.env"
        case_sensitive = True
        env_file_encoding = 'utf-8'


# Global settings instance
settings = Settings()

# Made with Bob
