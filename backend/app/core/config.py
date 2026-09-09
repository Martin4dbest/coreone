from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "PreSense"
    API_V1_STR: str = "/api/v1"

    DATABASE_URL: str
    SECRET_KEY: str

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    ALGORITHM: str = "HS256"

    RESEND_API_KEY: str = ""

    EMAIL_FROM: str = "PreSense <onboarding@resend.dev>"
    FRONTEND_URL: str = "http://localhost:3000"

    # CoreOne AI
    GEMINI_API_KEY: str = ""
    GEMINI_AI_MODEL: str = "gemini-3.8-flash"
    GEMINI_AI_FALLBACK_MODELS: str = (
        "gemini-3.7-flash,gemini-3.6-flash,gemini-3.5-flash-lite"
    )

    OPENAI_API_KEY: str = ""
    OPENAI_AI_MODEL: str = "gpt-5.6-luna"

    # Gemini is preferred. OpenAI is used as fallback when Gemini
    # is unavailable or returns an error.
    AI_PRIMARY_PROVIDER: str = "gemini"
    AI_ENABLE_OPENAI_FALLBACK: bool = True

    # Local development only. When enabled, CoreOne uses
    # a local mock generator instead of external AI APIs.
    AI_MOCK_MODE: bool = False

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
