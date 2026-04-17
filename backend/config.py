from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Groq LLM
    groq_api_key: str = ""
    groq_model_primary: str = "gemma2-9b-it"
    groq_model_large: str = "llama-3.3-70b-versatile"

    # Database
    database_url: str = "mysql+aiomysql://root:root@localhost:3306/thaagam_crm"

    # App
    app_secret_key: str = "dev-secret-key-change-in-production"
    app_env: str = "development"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        return [o.strip() for o in self.cors_origins.split(",")]

    class Config:
        env_file = ".env"
        extra = "ignore"


settings = Settings()
