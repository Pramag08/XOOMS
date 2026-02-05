from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List, Optional
from datetime import datetime, date

from .db import get_rental_session
from .deps import get_current_user
from .models import Property, Room, Booking, Review, Customer
from .schemas import PropertyRead, BookingCreate, BookingRead, RoomAvailability, ReviewCreate, ReviewRead, PropertyDetail
from datetime import datetime
from sqlalchemy.exc import IntegrityError, ProgrammingError
from sqlalchemy import text, func, or_, exists
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=List[PropertyRead])
def list_properties(
    q: Optional[str] = None,
    city: Optional[str] = None,
    property_type: Optional[str] = None,
    min_rating: Optional[float] = None,
    max_rating: Optional[float] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    available: Optional[bool] = None,  # current-day availability using room.is_booked
    sort: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
    session: Session = Depends(get_rental_session),
):
    try:
        stmt = select(Property)

        # text query (simple ILIKE against description and city)
        if q:
            ilike_val = f"%{q}%"
            stmt = stmt.where(or_(
                Property.property_description.ilike(ilike_val),
                Property.room_description.ilike(ilike_val),
                Property.city.ilike(ilike_val),
            ))

        if city:
            stmt = stmt.where(Property.city == city)

        if property_type:
            # normalize user input (trim whitespace)
            property_type = property_type.strip()
            allowed_types = {"Guest House", "Boys PG", "Girls PG", "Serviced Apartment"}
            if property_type not in allowed_types:
                raise HTTPException(status_code=400, detail=f"Invalid property_type: {property_type}. Allowed: {', '.join(sorted(allowed_types))}")
            stmt = stmt.where(Property.property_type == property_type)

        if min_rating is not None:
            stmt = stmt.where(Property.average_rating >= min_rating)
        if max_rating is not None:
            stmt = stmt.where(Property.average_rating <= max_rating)

        # price filtering: correlated EXISTS — require at least one active room within price range
        if min_price is not None or max_price is not None:
            room_sub = select(Room).where(Room.property_id == Property.property_id, Room.is_active == True)
            if min_price is not None:
                room_sub = room_sub.where(Room.rent_per_month >= min_price)
            if max_price is not None:
                room_sub = room_sub.where(Room.rent_per_month <= max_price)
            stmt = stmt.where(room_sub.exists())

        # availability (best-effort current-day using cached `room.is_booked`) using correlated EXISTS
        if available is True:
            avail_sub = select(Room).where(Room.property_id == Property.property_id, Room.is_active == True, Room.is_booked == False)
            stmt = stmt.where(avail_sub.exists())
        elif available is False:
            avail_sub = select(Room).where(Room.property_id == Property.property_id, Room.is_active == True, Room.is_booked == True)
            stmt = stmt.where(avail_sub.exists())

        # safe sorting
        sort_map = {
            'rating_desc': Property.average_rating.desc(),
            'rating_asc': Property.average_rating.asc(),
            'city_asc': Property.city.asc(),
            'city_desc': Property.city.desc(),
        }
        if sort in sort_map:
            stmt = stmt.order_by(sort_map[sort])

        stmt = stmt.offset(offset).limit(limit)
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
            active_rows = session.exec(
                select(Booking.end_date).where(
                    Booking.room_id == r.room_id,
                    Booking.booking_status == 'Active'
                )
            ).all()
            # active_rows is list of end_date values
            is_booked = len(active_rows) > 0
            next_available = None
            availability_text = "Available"

            if is_booked:
                parsed_dates = []
                for ed in active_rows:
                    # active_rows entries may be scalars or single-item tuples
                    val = ed[0] if isinstance(ed, (list, tuple)) and len(ed) > 0 else ed
                    # accept datetime/date objects directly
                    if isinstance(val, datetime):
                        parsed_dates.append(val)
                        continue
                    if isinstance(val, date):
                        parsed_dates.append(datetime(val.year, val.month, val.day))
                        continue
                    # try parsing strings
                    if isinstance(val, str):
                        try:
                            parsed_dates.append(datetime.fromisoformat(val))
                            continue
                        except Exception:
                            pass
                        try:
                            parsed_dates.append(datetime.strptime(val, "%Y-%m-%d"))
                            continue
                        except Exception:
                            pass

                if parsed_dates:
                    earliest = min(parsed_dates)
                    next_available = earliest.date().isoformat()
                    availability_text = f"Booked till {next_available}"
                else:
                    next_available = None
                    availability_text = "Booked"

            results.append(RoomAvailability(
                room_id=r.room_id,
                property_id=r.property_id,
                room_number=getattr(r, 'room_number', ''),
                rent_per_month=getattr(r, 'rent_per_month', 0.0),
                is_active=getattr(r, 'is_active', True),
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



@router.post("/{property_id}/reviews", response_model=List[ReviewRead], status_code=status.HTTP_201_CREATED)
def create_review_for_property(property_id: int, payload: ReviewCreate, current_user=Depends(get_current_user), session: Session = Depends(get_rental_session)):
    try:
        # only customers may post reviews
        if current_user.role.lower() != 'customer':
            raise HTTPException(status_code=403, detail="Only customers may post reviews")

        # verify property exists
        prop = session.get(Property, property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        # get customer profile
        from .customers import get_customer_by_user
        cust = get_customer_by_user(session, current_user.user_id)
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")

        from datetime import datetime

        # ensure customer actually completed a stay at this property
        room_stmt = select(Room.room_id).where(Room.property_id == property_id)
        room_rows = session.exec(room_stmt).all()
        room_ids = [r for (r,) in room_rows]
        if not room_ids:
            raise HTTPException(status_code=403, detail="Only customers who have stayed may leave reviews")

        booking_stmt = select(Booking).where(
            Booking.customer_id == cust.customer_id,
            Booking.room_id.in_(room_ids),
            Booking.booking_status != 'Cancelled',
            Booking.end_date != None,
            Booking.end_date <= datetime.utcnow(),
        ).limit(1)
        past_booking = session.exec(booking_stmt).first()
        if not past_booking:
            raise HTTPException(status_code=403, detail="Only customers who have completed a stay may leave reviews")

        db_review = Review(
            property_id=property_id,
            customer_id=cust.customer_id,
            rating=payload.rating,
              review_text=payload.review_text if hasattr(payload, 'review_text') else getattr(payload, 'text', None),
              review_date=datetime.utcnow(),
        )

        try:
            with session.begin():
                session.add(db_review)
                session.flush()

                # recompute average rating
                # rating will be updated by DB trigger `update_property_rating`; no manual update required
                pass
        except IntegrityError as e:
            logger.exception("IntegrityError creating review: %s", e)
            raise HTTPException(status_code=400, detail="Could not create review")

        session.refresh(db_review)
        return db_review
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("create_review_for_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/{property_id}/reviews", response_model=List[ReviewRead])
def list_reviews_for_property(property_id: int, limit: int = 50, offset: int = 0, session: Session = Depends(get_rental_session)):
    try:
        stmt = select(Review).where(Review.property_id == property_id).offset(offset).limit(limit)
        rows = session.exec(stmt).all()
        return rows
    except Exception as exc:
        # If the DB schema is missing the `text` column (or similar), fall back to a safe select
        if isinstance(exc, ProgrammingError) or 'column review.text does not exist' in str(exc):
            try:
                q = "SELECT review_id, property_id, customer_id, rating, created_at FROM review WHERE property_id = :pid LIMIT :lim OFFSET :off"
                res = session.execute(text(q), {'pid': property_id, 'lim': limit, 'off': offset})
                rows = res.fetchall()
                results = []
                for row in rows:
                    # row may be a tuple-like
                    if isinstance(row, tuple):
                        review_id, property_id, customer_id, rating, review_date = row
                        review_text = None
                    else:
                        review_id = getattr(row, 'review_id', None)
                        property_id = getattr(row, 'property_id', None)
                        customer_id = getattr(row, 'customer_id', None)
                        rating = getattr(row, 'rating', None)
                        review_text = getattr(row, 'review_text', None)
                        review_date = getattr(row, 'review_date', None)
                    results.append(schemas.ReviewRead(
                        review_id=review_id,
                        property_id=property_id,
                        customer_id=customer_id,
                        rating=rating,
                        review_text=review_text,
                        review_date=review_date,
                    ))
                return results
            except Exception:
                tb = traceback.format_exc()
                logger.exception("list_reviews_for_property fallback failed: %s", exc)
                raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")

        tb = traceback.format_exc()
        logger.exception("list_reviews_for_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/{property_id}", response_model=PropertyDetail)
def get_property_detail(property_id: int, session: Session = Depends(get_rental_session)):
    try:
        prop = session.get(Property, property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")

        # rooms and per-room availability
        room_rows = session.exec(select(Room).where(Room.property_id == property_id)).all()
        rooms: List[RoomAvailability] = []
        for r in room_rows:
            active_rows = session.exec(select(Booking.end_date).where(Booking.room_id == r.room_id, Booking.booking_status == 'Active')).all()
            is_booked = len(active_rows) > 0
            next_available = None
            availability_text = "Available"
            if is_booked:
                parsed_dates = []
                for ed in active_rows:
                    val = ed[0] if isinstance(ed, (list, tuple)) and len(ed) > 0 else ed
                    if isinstance(val, datetime):
                        parsed_dates.append(val)
                        continue
                    if isinstance(val, date):
                        parsed_dates.append(datetime(val.year, val.month, val.day))
                        continue
                    if isinstance(val, str):
                        try:
                            parsed_dates.append(datetime.fromisoformat(val))
                            continue
                        except Exception:
                            pass
                        try:
                            parsed_dates.append(datetime.strptime(val, "%Y-%m-%d"))
                            continue
                        except Exception:
                            pass
                if parsed_dates:
                    earliest = min(parsed_dates)
                    next_available = earliest.date().isoformat()
                    availability_text = f"Booked till {next_available}"
                else:
                    availability_text = "Booked"

            rooms.append(RoomAvailability(
                room_id=r.room_id,
                property_id=r.property_id,
                room_number=getattr(r, 'room_number', ''),
                rent_per_month=getattr(r, 'rent_per_month', 0.0),
                is_active=getattr(r, 'is_active', True),
                is_booked=is_booked,
                next_available=next_available,
                availability_text=availability_text,
            ))

        # property-level availability summary
        total_rooms = len(room_rows)
        rooms_available = 0
        is_full = False
        prop_next_available = None
        prop_availability_text = None
        if total_rooms == 0:
            rooms_available = 0
            is_full = False
            prop_availability_text = "No rooms"
        else:
            room_ids = [r.room_id for r in room_rows if getattr(r, 'room_id', None) is not None]
            if not room_ids:
                rooms_available = total_rooms
                is_full = False
                prop_availability_text = f"{total_rooms} rooms available"
            else:
                active_booked_rows = session.exec(select(Booking.room_id, Booking.end_date).where(Booking.booking_status == 'Active', Booking.room_id.in_(room_ids))).all()
                booked_room_ids = set([rid for rid, _ in active_booked_rows])
                unique_booked = len(booked_room_ids)
                rooms_available = max(0, total_rooms - unique_booked)
                is_full = (rooms_available == 0)
                if rooms_available > 0:
                    prop_availability_text = f"{rooms_available} rooms available"
                else:
                    end_dates = [ed for _, ed in active_booked_rows if ed]
                    parsed_dates = []
                    for ed in end_dates:
                        if isinstance(ed, datetime):
                            parsed_dates.append(ed)
                            continue
                        if isinstance(ed, date):
                            parsed_dates.append(datetime(ed.year, ed.month, ed.day))
                            continue
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
                    if parsed_dates:
                        earliest = min(parsed_dates)
                        prop_next_available = earliest.date().isoformat()
                        prop_availability_text = f"Booked till {prop_next_available}"
                    else:
                        prop_availability_text = "Fully booked"

        # reviews with reviewer name
        rev_stmt = select(Review, Customer.full_name).join(Customer, Customer.customer_id == Review.customer_id).where(Review.property_id == property_id)
        rev_rows = session.exec(rev_stmt).all()
        reviews: List[ReviewRead] = []
        for rev, reviewer_name in rev_rows:
            reviews.append(ReviewRead(
                review_id=rev.review_id,
                property_id=rev.property_id,
                customer_id=rev.customer_id,
                rating=rev.rating,
                review_text=getattr(rev, 'review_text', None),
                review_date=getattr(rev, 'review_date', None),
                reviewer_name=reviewer_name,
            ))

        result = PropertyDetail(
            property_id=prop.property_id,
            owner_id=prop.owner_id,
            property_description=prop.property_description,
            room_description=prop.room_description,
            property_type=prop.property_type,
            city=prop.city,
            address=prop.address,
            google_maps_link=prop.google_maps_link,
            verification_status=prop.verification_status,
            average_rating=prop.average_rating,
            is_full=is_full,
            rooms_available=rooms_available,
            next_available=prop_next_available,
            availability_text=prop_availability_text,
            rooms=rooms,
            reviews=reviews,
        )

        return result
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("get_property_detail failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")
