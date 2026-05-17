from functools import lru_cache
from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    MONGO_URI: str
    MONGO_DB: str = "PFE"
    MONGO_VECTOR_INDEX: str = "vector_index"

    GENERATION_BACKEND: str = "GROQ"
    EMBEDDING_BACKEND: str = "LOCAL"
    VECTOR_DB_BACKEND: str = "MONGODB_ATLAS"

    GROQ_API_KEY: Optional[str] = None
    COHERE_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    VOYAGE_API_KEY: Optional[str] = None

    GENERATION_MODEL_ID: str = "llama-3.3-70b-versatile"
    GEMINI_MODEL_ID: str = "gemini-2.0-flash"
    COHERE_MODEL_ID: str = "command-r-plus"
    EMBEDDING_MODEL_ID: str = "intfloat/multilingual-e5-small"
    EMBEDDING_MODEL_SIZE: int = 384

    GENERATION_DEFAULT_MAX_TOKENS: int = 1024
    GENERATION_DEFAULT_TEMPERATURE: float = 0.3

    model_config = SettingsConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache(maxsize=1)
def get_settings():
    return Settings()
