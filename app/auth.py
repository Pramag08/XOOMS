from datetime import datetime, timedelta
import hashlib
import hmac
import os
import binascii
from jose import jwt
from .core.config import settings

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import select, Session
from .schemas import LoginRequest, Token
from .db import get_auth_session
from .models import UserAuth
from .deps import get_current_user


router = APIRouter()


@router.post("/login", response_model=Token)
def login(form: LoginRequest, session: Session = Depends(get_auth_session)):
    stmt = select(UserAuth).where(UserAuth.email == form.email)
    user = session.exec(stmt).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/ping")
def ping():
    return {"ping": "pong"}


@router.get("/me")
def me(current_user: UserAuth = Depends(get_current_user)):
    return {"user_id": current_user.user_id, "email": current_user.email, "role": current_user.role}


# Simple PBKDF2 password hashing for dev/testing. Format: pbkdf2$<iters>$<salt_hex>$<hash_hex>
def get_password_hash(password: str, iterations: int = 200_000) -> str:
    salt = os.urandom(16)
    dk = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt, iterations)
    return f"pbkdf2${iterations}${binascii.hexlify(salt).decode()}${binascii.hexlify(dk).decode()}"


def verify_password(plain_password: str, stored_hash: str) -> bool:
    try:
        parts = stored_hash.split('$')
        if parts[0] != 'pbkdf2':
            return False
        iterations = int(parts[1])
        salt = binascii.unhexlify(parts[2])
        expected = binascii.unhexlify(parts[3])
        dk = hashlib.pbkdf2_hmac('sha256', plain_password.encode('utf-8'), salt, iterations)
        return hmac.compare_digest(dk, expected)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRES_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        return payload
    except Exception:
        return {}
