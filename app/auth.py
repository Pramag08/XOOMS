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
from .schemas import LoginRequest, Token, SignupRequest
from .db import get_auth_session, get_rental_session
from .models import UserAuth, Customer, Owner
from sqlalchemy.exc import IntegrityError
from .deps import get_current_user
from sqlmodel import select


router = APIRouter()


@router.post("/login", response_model=Token)
def login(form: LoginRequest, session: Session = Depends(get_auth_session)):
    stmt = select(UserAuth).where(UserAuth.email == form.email)
    user = session.exec(stmt).first()
    if not user or not verify_password(form.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")

    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
def signup(payload: SignupRequest, auth_session: Session = Depends(get_auth_session), rental_session: Session = Depends(get_rental_session)):
    # Create user in auth DB
    role_val = payload.role.capitalize()
    if role_val not in ("Admin", "Owner", "User"):
        raise HTTPException(status_code=400, detail="Invalid role")

    # Create auth user in its own transaction
    try:
        with auth_session.begin():
            user = UserAuth(
                email=payload.email,
                password_hash=get_password_hash(payload.password),
                role=role_val,
                verification_status="Pending",
            )
            auth_session.add(user)
        # refresh to get generated id
        auth_session.refresh(user)
    except IntegrityError:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    except Exception:
        raise HTTPException(status_code=500, detail="Failed to create user")

    # Create customer profile in rental DB; if this fails, try to roll back auth user
    try:
        # Create customer (and owner if requested) in a rental_db transaction
        with rental_session.begin():
            cust = Customer(user_id=user.user_id, full_name=payload.full_name, email=payload.email)
            rental_session.add(cust)
            rental_session.flush()
            rental_session.refresh(cust)

            if role_val == "Owner":
                owner = Owner(customer_id=cust.customer_id)
                rental_session.add(owner)
                rental_session.flush()
                rental_session.refresh(owner)
    except Exception:
        # Compensation: try to remove created auth user to avoid orphan
        try:
            with auth_session.begin():
                # re-attach user object if needed and delete
                auth_session.delete(auth_session.get(UserAuth, user.user_id) or user)
        except Exception:
            # best-effort compensation failed; log and continue to raise
            pass
        raise HTTPException(status_code=500, detail="Failed to create customer/owner profile; rolled back user creation")

    # Auto-login: create token
    token = create_access_token({"sub": str(user.user_id), "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/ping")
def ping():
    return {"ping": "pong"}


@router.get("/me")
def me(current_user: UserAuth = Depends(get_current_user), rental_session: Session = Depends(get_rental_session)):
    # Include rental DB profile data (customer) when available so frontend can show full name
    from .models import Customer
    cust = rental_session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
    return {
        "user_id": current_user.user_id,
        "email": current_user.email,
        "role": current_user.role,
        "full_name": getattr(cust, 'full_name', None) if cust else None,
        "verification_status": getattr(cust, 'verification_status', None) if cust else None,
    }


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
