from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str


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
    number_of_rooms: Optional[int] = 0
    rent_per_month: float


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
    is_full: Optional[bool] = False
    rooms_available: Optional[int] = 0
    next_available: Optional[str] = None
    availability_text: Optional[str] = None


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


class BookingCreate(BaseModel):
    room_id: int
    start_date: str
    end_date: str


class BookingUpdate(BaseModel):
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    booking_status: Optional[str] = None


class RoomCreate(BaseModel):
    room_number: Optional[str] = None
    rent_per_month: Optional[float] = 0.0
    is_active: Optional[bool] = True


class RoomRead(BaseModel):
    room_id: int
    property_id: int
    room_number: str
    rent_per_month: float
    is_active: bool


class RoomAvailability(BaseModel):
    room_id: int
    property_id: int
    room_number: str
    rent_per_month: float
    is_active: bool
    is_booked: bool
    next_available: Optional[str] = None
    availability_text: Optional[str] = None


class ReviewCreate(BaseModel):
    rating: int
    review_text: Optional[str] = None


class ReviewRead(BaseModel):
    review_id: int
    property_id: int
    customer_id: int
    rating: int
    review_text: Optional[str] = None
    review_date: Optional[datetime] = None
    reviewer_name: Optional[str] = None


class PropertyDetail(BaseModel):
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
    is_full: Optional[bool] = False
    rooms_available: Optional[int] = 0
    next_available: Optional[str] = None
    availability_text: Optional[str] = None
    rooms: Optional[List[RoomAvailability]] = None
    reviews: Optional[List[ReviewRead]] = None
