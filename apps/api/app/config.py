from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", case_sensitive=False, extra="ignore")

    mongo_uri: str = "mongodb://koda:changeme-dev@mongo:27017/koda?authSource=admin"
    mongo_db: str = "koda"
    jwt_secret: str = "changeme-jwt-secret-min-32-chars-please-rotate"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 30
    cors_origin_regex: str = r"^http://(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$"


settings = Settings()
