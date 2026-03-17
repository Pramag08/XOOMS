import os


class Settings:
    AUTH_DATABASE_URL: str = os.getenv("AUTH_DATABASE_URL", "postgresql://postgres:vaibhav@localhost:5432/auth_db")
    RENTAL_DATABASE_URL: str = os.getenv("RENTAL_DATABASE_URL", "postgresql://postgres:vaibhav@localhost:5432/rental_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRES_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "60"))
    # Database pool tuning
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "5"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_PRE_PING: bool = os.getenv("DB_POOL_PRE_PING", "true").lower() in ("1", "true", "yes")
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "1800"))


settings = Settings()
