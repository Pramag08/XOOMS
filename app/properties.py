from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, date

from .db import get_rental_session
from .deps import get_current_user
from .models import Property, Room, Booking
from .schemas import PropertyRead, BookingCreate, BookingRead, RoomAvailability
from datetime import datetime
from sqlalchemy.exc import IntegrityError
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=List[PropertyRead])
def list_properties(session: Session = Depends(get_rental_session)):
    try:
        stmt = select(Property)
        props = session.exec(stmt).all()
        results = [PropertyRead(
            property_id=p.property_id,
            owner_id=p.owner_id,
            property_description=p.property_description,
            room_description=p.room_description,
            property_type=p.property_type,
            city=p.city,
            address=p.address,
            google_maps_link=p.google_maps_link,
            verification_status=p.verification_status,
            average_rating=p.average_rating,
            is_full=False,
        ) for p in props]
        # compute occupancy and availability per property
        for idx, p in enumerate(props):
            rooms = session.exec(select(Room).where(Room.property_id == p.property_id)).all()
            total_rooms = len(rooms)
            if total_rooms == 0:
                results[idx].is_full = False
                results[idx].rooms_available = 0
                results[idx].next_available = None
                results[idx].availability_text = "No rooms"
                continue

            room_ids = [r.room_id for r in rooms if getattr(r, 'room_id', None) is not None]
            if not room_ids:
                results[idx].is_full = False
                results[idx].rooms_available = total_rooms
                results[idx].next_available = None
                results[idx].availability_text = f"{total_rooms} rooms available"
                continue

            active_booked_rows = session.exec(select(Booking.room_id, Booking.end_date).where(Booking.booking_status == 'Active', Booking.room_id.in_(room_ids))).all()
            # active_booked_rows is list of tuples (room_id, end_date)
            booked_room_ids = set([r for r, _ in active_booked_rows])
            unique_booked = len(booked_room_ids)
            available = max(0, total_rooms - unique_booked)

            results[idx].rooms_available = available
            results[idx].is_full = (available == 0)

            if available > 0:
                results[idx].next_available = None
                results[idx].availability_text = f"{available} rooms available"
            else:
                # all rooms booked — compute earliest end_date among active bookings
                end_dates = [ed for _, ed in active_booked_rows if ed]
                parsed_dates = []
                for ed in end_dates:
                    # accept datetime/date objects directly
                    if isinstance(ed, datetime):
                        parsed_dates.append(ed)
                        continue
                    if isinstance(ed, date):
                        parsed_dates.append(datetime(ed.year, ed.month, ed.day))
                        continue
                    # try parsing strings
                    if isinstance(ed, str):
                        try:
                            parsed_dates.append(datetime.fromisoformat(ed))
                            continue
                        except Exception:
                            pass
                        try:
                            parsed_dates.append(datetime.strptime(ed, "%Y-%m-%d"))
                            continue
                        except Exception:
                            pass
                    # unknown type — skip
                if parsed_dates:
                    earliest = min(parsed_dates)
                    results[idx].next_available = earliest.date().isoformat()
                    results[idx].availability_text = f"Booked till {results[idx].next_available}"
                else:
                    results[idx].next_available = None
                    results[idx].availability_text = "Fully booked"

        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_properties failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


class RoomOut(BaseException):
    pass


@router.get("/{property_id}/rooms", response_model=List[RoomAvailability])
def list_property_rooms(property_id: int, session: Session = Depends(get_rental_session)):
    try:
        stmt = select(Room).where(Room.property_id == property_id)
        rooms = session.exec(stmt).all()
        results: List[RoomAvailability] = []
        for r in rooms:
            # find active bookings for this room
            active_rows = session.exec(select(Booking.end_date).where(Booking.room_id == r.room_id, Booking.booking_status == 'Active')).all()
            # active_rows is list of end_date values
            is_booked = len(active_rows) > 0
            next_available = None
            availability_text = "Available"
            if is_booked:
                parsed_dates = []
                for ed in active_rows:
                    if not ed:
                        continue
                    # accept datetime/date objects directly
                    if isinstance(ed, datetime):
                        parsed_dates.append(ed)
                        continue
                    if isinstance(ed, date):
                        parsed_dates.append(datetime(ed.year, ed.month, ed.day))
                        continue
                    # try parsing strings
                    if isinstance(ed, str):
                        try:
                            parsed_dates.append(datetime.fromisoformat(ed))
                            continue
                        except Exception:
                            pass
                        try:
                            parsed_dates.append(datetime.strptime(ed, "%Y-%m-%d"))
                            continue
                        except Exception:
                            pass
                    # unknown type — skip
                if parsed_dates:
                    earliest = min(parsed_dates)
                    next_available = earliest.date().isoformat()
                    availability_text = f"Booked till {next_available}"
                else:
                    availability_text = "Booked"

            results.append(RoomAvailability(
                room_id=r.room_id,
                property_id=r.property_id,
                room_number=r.room_number,
                rent_per_month=r.rent_per_month,
                is_active=r.is_active,
                is_booked=is_booked,
                next_available=next_available,
                availability_text=availability_text,
            ))

        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_property_rooms failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.post("/{property_id}/bookings", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
def create_booking_for_property(property_id: int, payload: BookingCreate, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        # resolve customer profile
        stmt = select(Property).where(Property.property_id == property_id)
        prop = session.exec(stmt).first()
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        room = session.get(Room, payload.room_id)
        if not room or room.property_id != property_id:
            raise HTTPException(status_code=404, detail="Room not found for this property")

        # get customer
        from .customers import get_customer_by_user
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        booking = Booking(
            customer_id=cust.customer_id,
            room_id=payload.room_id,
            start_date=payload.start_date,
            end_date=payload.end_date,
            booking_status='Active',
        )

        try:
            with session.begin():
                session.add(booking)
                session.flush()
                session.refresh(booking)
        except IntegrityError as e:
            logger.exception("IntegrityError creating booking: %s", e)
            raise HTTPException(status_code=409, detail="Booking conflicts with existing active booking")

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
        logger.exception("create_booking_for_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")
