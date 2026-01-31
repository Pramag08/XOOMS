from typing import Optional
from sqlmodel import SQLModel, Field


class UserAuth(SQLModel, table=True):
    __tablename__ = "users_auth"
    user_id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    password_hash: str
    role: str
    verification_status: str
