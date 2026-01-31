from pydantic import BaseModel
from typing import Optional


class LoginRequest(BaseModel):
    email: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


class PropertyCreate(BaseModel):
    property_description: str
    room_description: str
    property_type: Optional[str] = None
    city: str
    address: str
    google_maps_link: Optional[str] = None


class PropertyRead(BaseModel):
    property_id: int
    owner_id: int
    property_description: str
    room_description: str
    property_type: Optional[str] = None
    city: str
    address: str
    google_maps_link: Optional[str] = None
    verification_status: Optional[str] = None
    average_rating: Optional[float] = None


class BookingRead(BaseModel):
    booking_id: int
    property_id: int
    room_id: int
    room_number: str
    customer_id: int
    customer_name: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    booking_status: Optional[str] = None
