from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import select, Session
from .db import get_auth_session
from .models import UserAuth
from jose import jwt
from .core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")


def get_current_user(token: str = Depends(oauth2_scheme), session: Session = Depends(get_auth_session)):
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

    user_id = payload.get("sub") if isinstance(payload, dict) else None
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
    stmt = select(UserAuth).where(UserAuth.user_id == int(user_id))
    user = session.exec(stmt).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_role(required_role: str):
    def role_dependency(token: str = Depends(oauth2_scheme), current_user: UserAuth = Depends(get_current_user)):
        # First ensure token decodes and claims the required role
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        except Exception:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")

        token_role = payload.get("role")
        user_role = getattr(current_user, "role", None)

        # If either token role or DB role does not match required role, forbid access
        if token_role != required_role or user_role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role: {required_role}",
            )
        return current_user

    return role_dependency
