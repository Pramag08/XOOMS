from sqlmodel import create_engine, Session
from .core.config import settings


# Engine for auth_db (separate logical DB)
auth_engine = create_engine(
    settings.AUTH_DATABASE_URL,
    echo=False,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
    pool_recycle=settings.DB_POOL_RECYCLE,
)

# Engine for rental_db (properties, rooms, bookings)
rental_engine = create_engine(
    settings.RENTAL_DATABASE_URL,
    echo=False,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    pool_timeout=settings.DB_POOL_TIMEOUT,
    pool_pre_ping=settings.DB_POOL_PRE_PING,
    pool_recycle=settings.DB_POOL_RECYCLE,
)


def get_auth_session():
    session = Session(auth_engine)
    try:
        yield session
    finally:
        session.close()


def get_rental_session():
    session = Session(rental_engine)
    try:
        yield session
    finally:
        session.close()
