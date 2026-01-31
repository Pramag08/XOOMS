import os


class Settings:
    AUTH_DATABASE_URL: str = os.getenv("AUTH_DATABASE_URL", "postgresql://postgres:vaibhav@localhost:5432/auth_db")
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-prod")
    ALGORITHM: str = os.getenv("ALGORITHM", "HS256")
    ACCESS_TOKEN_EXPIRES_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRES_MINUTES", "60"))


settings = Settings()
