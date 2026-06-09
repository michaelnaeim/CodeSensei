from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    github_token: str = ""
    database_url: str = "sqlite:///./codesensei.db"
    challenge_pass_threshold: int = 80
    quiz_pass_threshold: int = 70
    max_files_to_index: int = 80
    max_file_size_bytes: int = 150_000
    max_files_for_llm: int = 25
    max_snippet_chars: int = 2500
    max_topics: int = 8
    max_cached_file_chars: int = 10_000
    max_cached_files: int = 50

    # Comma-separated list of allowed frontend origins for CORS.
    # Use "*" to allow any origin (safe here since credentials are disabled).
    allowed_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def cors_origins(self) -> list[str]:
        value = self.allowed_origins.strip()
        if value == "*":
            return ["*"]
        return [origin.strip() for origin in value.split(",") if origin.strip()]


settings = Settings()
