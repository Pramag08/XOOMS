from sqlmodel import Session, select
from typing import List, Optional
from .models import Customer
from fastapi import APIRouter, Depends, HTTPException, status
from .db import get_rental_session
from .deps import get_current_user
from .models import Booking, Room
from .schemas import BookingRead, BookingUpdate
from sqlalchemy.exc import IntegrityError
import traceback
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/customer", tags=["customers"])


# Customer booking creation moved to `app.properties` as POST /properties/{property_id}/bookings


@router.put("/mybookings/{booking_id}", response_model=BookingRead)
def update_booking_customer(booking_id: int, payload: BookingUpdate, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        booking = session.get(Booking, booking_id)
        if not booking or booking.customer_id != cust.customer_id:
            raise HTTPException(status_code=404, detail="Booking not found")

        if payload.start_date is not None:
            booking.start_date = payload.start_date
        if payload.end_date is not None:
            booking.end_date = payload.end_date
        if payload.booking_status is not None:
            booking.booking_status = payload.booking_status

        # avoid nested transaction errors by using explicit add/flush/commit
        session.add(booking)
        session.flush()
        try:
            session.commit()
        except IntegrityError as e:
            session.rollback()
            raise HTTPException(status_code=409, detail="Booking conflicts with existing active booking")
        session.refresh(booking)

        room = session.get(Room, booking.room_id)
        return BookingRead(
            booking_id=booking.booking_id,
            property_id=room.property_id if room else None,
            room_id=booking.room_id,
            room_number=room.room_number if room else "",
            customer_id=booking.customer_id,
            customer_name=cust.full_name,
            start_date=str(booking.start_date) if getattr(booking, 'start_date', None) else None,
            end_date=str(booking.end_date) if getattr(booking, 'end_date', None) else None,
            booking_status=booking.booking_status,
        )
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("update_booking_customer failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.delete("/mybookings/{booking_id}", status_code=status.HTTP_204_NO_CONTENT)
def cancel_booking_customer(booking_id: int, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        booking = session.get(Booking, booking_id)
        if not booking or booking.customer_id != cust.customer_id:
            raise HTTPException(status_code=404, detail="Booking not found")

        try:
            with session.begin():
                booking.booking_status = 'Cancelled'
                session.add(booking)
        except Exception:
            raise

        return None
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("cancel_booking_customer failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")



def get_customer_by_user(session: Session, user_id: int) -> Customer | None:
    stmt = select(Customer).where(Customer.user_id == user_id)
    return session.exec(stmt).first()


@router.get("/mybookings", response_model=List[BookingRead])
def list_customer_bookings(status: Optional[str] = None, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        stmt = select(Booking).where(Booking.customer_id == cust.customer_id)
        if status:
            stmt = stmt.where(Booking.booking_status == status)

        bookings = session.exec(stmt).all()
        results: List[BookingRead] = []
        for booking in bookings:
            room = session.get(Room, booking.room_id)
            results.append(BookingRead(
                booking_id=booking.booking_id,
                property_id=room.property_id if room else None,
                room_id=booking.room_id,
                room_number=room.room_number if room else "",
                customer_id=booking.customer_id,
                customer_name=cust.full_name,
                start_date=str(booking.start_date) if getattr(booking, 'start_date', None) else None,
                end_date=str(booking.end_date) if getattr(booking, 'end_date', None) else None,
                booking_status=booking.booking_status,
            ))

        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_customer_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/mybookings/{booking_id}", response_model=BookingRead)
def get_customer_booking(booking_id: int, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        booking = session.get(Booking, booking_id)
        if not booking or booking.customer_id != cust.customer_id:
            raise HTTPException(status_code=404, detail="Booking not found")

        room = session.get(Room, booking.room_id)
        return BookingRead(
            booking_id=booking.booking_id,
            property_id=room.property_id if room else None,
            room_id=booking.room_id,
            room_number=room.room_number if room else "",
            customer_id=booking.customer_id,
            customer_name=cust.full_name,
            start_date=str(booking.start_date) if getattr(booking, 'start_date', None) else None,
            end_date=str(booking.end_date) if getattr(booking, 'end_date', None) else None,
            booking_status=booking.booking_status,
        )
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("get_customer_booking failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get('/debug')
def debug_customer_profile(current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        cust = get_customer_by_user(session, current_user.user_id)
        return {
            'user_id': current_user.user_id,
            'email': getattr(current_user, 'email', None),
            'customer_exists': bool(cust),
        }
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception('debug_customer_profile failed: %s', exc)
        raise HTTPException(status_code=500, detail=f'Internal server error (see server logs)\n{tb}')
