from typing import Optional
from sqlmodel import SQLModel, Field


class UserAuth(SQLModel, table=True):
    __tablename__ = "users_auth"
    user_id: Optional[int] = Field(default=None, primary_key=True)
    email: str
    password_hash: str
    role: str
    verification_status: str


class Property(SQLModel, table=True):
    __tablename__ = "property"
    property_id: Optional[int] = Field(default=None, primary_key=True)
    owner_id: int
    property_description: str
    room_description: str
    property_type: Optional[str] = None
    city: str
    address: str
    google_maps_link: Optional[str] = None
    verification_status: Optional[str] = None
    average_rating: Optional[float] = None


class Customer(SQLModel, table=True):
    __tablename__ = "customers"
    customer_id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int
    full_name: str
    email: str


class Owner(SQLModel, table=True):
    __tablename__ = "owner"
    owner_id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int
    verification_status: Optional[str] = None


class Room(SQLModel, table=True):
    __tablename__ = "room"
    room_id: Optional[int] = Field(default=None, primary_key=True)
    property_id: int
    room_number: str
    rent_per_month: float
    is_active: bool = True


class Booking(SQLModel, table=True):
    __tablename__ = "booking"
    booking_id: Optional[int] = Field(default=None, primary_key=True)
    customer_id: int
    room_id: int
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    booking_status: Optional[str] = None
