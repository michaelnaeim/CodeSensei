from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    github_token: str = ""
    database_url: str = "sqlite:///./codesensei.db"
    challenge_pass_threshold: int = 80
    quiz_pass_threshold: int = 70
    max_files_to_index: int = 50
    max_file_size_bytes: int = 100_000


settings = Settings()
