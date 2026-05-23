"""
Configuration Settings

Manages application configuration using Pydantic Settings.
"""

from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application settings."""
    
    # Server Configuration
    PORT: int = 8000
    ENVIRONMENT: str = "development"
    
    # Google Cloud (Optional for local testing)
    GCP_PROJECT_ID: str = "local-dev-project"
    GCP_REGION: str = "us-central1"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""
    
    # Firestore
    FIRESTORE_DATABASE_ID: str = "(default)"
    
    # Redis
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
        env_file = ".env"
        case_sensitive = True


# Global settings instance
settings = Settings()

# Made with Bob
