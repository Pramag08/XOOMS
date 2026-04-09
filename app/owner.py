from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from .db import get_rental_session
from .models import Property, UserAuth, Room, Booking
from sqlalchemy import func
from .schemas import PropertyCreate, PropertyRead, BookingRead, RoomCreate, RoomRead, RoomAvailability
from datetime import datetime, date
from .deps import require_role, get_current_user
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/owner", tags=["owner"])

# NOTE: transaction handling is explicit in these endpoints (using `session.begin()`
# or `session.commit()`/`session.flush()` as needed). The prior `@transactional`
# helper was removed intentionally to make transaction boundaries visible in code.


@router.post("/properties", response_model=PropertyRead)
def create_property(
    payload: PropertyCreate,
    current_user: UserAuth = Depends(require_role("Owner")),
    session: Session = Depends(get_rental_session),
):
    try:
        # resolve owner_id in rental_db: auth.user_id -> customers.user_id -> owner.owner_id
        from .models import Customer, Owner

        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        # Ensure non-nullable DB columns are populated even if payload omitted them
        safe_property_type = payload.property_type if getattr(payload, 'property_type', None) is not None else 'Other'
        prop = Property(
            owner_id=owner.owner_id,
            property_description=payload.property_description,
            room_description=payload.room_description,
            property_type=safe_property_type,
            city=payload.city,
            address=payload.address,
            google_maps_link=payload.google_maps_link,
        )
        try:
            if session.in_transaction():
                session.add(prop)
                session.flush()
                # create rooms if requested
                num = int(payload.number_of_rooms or 0)
                rooms = []
                for i in range(1, num + 1):
                    r = Room(property_id=prop.property_id if getattr(prop, 'property_id', None) else None,
                             room_number=f"R{i}", rent_per_month=payload.rent_per_month, is_active=True)
                    session.add(r)
                    rooms.append(r)
                # commit explicitly when caller has an open transaction to ensure persistence
                session.commit()
                session.refresh(prop)
                for r in rooms:
                    try:
                        session.refresh(r)
                    except Exception:
                        pass
            else:
                with session.begin():
                    session.add(prop)
                    session.flush()
                    # create rooms if requested
                    num = int(payload.number_of_rooms or 0)
                    rooms = []
                    for i in range(1, num + 1):
                        r = Room(property_id=prop.property_id, room_number=f"R{i}", rent_per_month=payload.rent_per_month, is_active=True)
                        session.add(r)
                        rooms.append(r)
                    session.refresh(prop)
        except Exception:
            # let outer handler catch and return 500 with logs
            raise
        return PropertyRead(
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
            average_rent=(float(payload.rent_per_month) if getattr(payload, 'rent_per_month', None) is not None else None),
        )
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("create_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")



@router.get("/properties/{property_id}/rooms", response_model=list[RoomAvailability])
def owner_list_property_rooms(property_id: int, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        rooms = session.exec(select(Room).where(Room.property_id == property_id)).all()
        results: list[RoomAvailability] = []
        for r in rooms:
            active_rows = session.exec(select(Booking.end_date).where(Booking.room_id == r.room_id, Booking.booking_status == 'Active')).all()
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
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("owner_list_property_rooms failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.post("/properties/{property_id}/rooms", response_model=RoomRead, status_code=status.HTTP_201_CREATED)
def owner_add_room(property_id: int, payload: RoomCreate, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        # auto-assign room_number if not provided: R{N+1}
        room_number = payload.room_number
        if not room_number:
            existing = session.exec(select(Room).where(Room.property_id == property_id)).all()
            room_number = f"R{len(existing) + 1}"

        room = Room(property_id=property_id, room_number=room_number, rent_per_month=payload.rent_per_month or 0.0, is_active=payload.is_active if payload.is_active is not None else True)
        logger.debug("owner_add_room: before add room=%s session.in_transaction=%s", room, session.in_transaction())
        # Add and flush; commit only if there's no surrounding transaction
        session.add(room)
        logger.debug("owner_add_room: after session.add, room.room_id=%s", getattr(room, 'room_id', None))
        session.flush()
        logger.debug("owner_add_room: after flush, room.room_id=%s", getattr(room, 'room_id', None))
        try:
            session.commit()
            logger.debug("owner_add_room: committed transaction")
        except Exception:
            logger.exception("owner_add_room: commit failed")
            raise
        session.refresh(room)
        logger.debug("owner_add_room: after refresh, room.room_id=%s", getattr(room, 'room_id', None))

        return RoomRead(room_id=room.room_id, property_id=room.property_id, room_number=room.room_number, rent_per_month=room.rent_per_month, is_active=room.is_active)
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("owner_add_room failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.put("/properties/{property_id}/rooms/{room_id}", response_model=RoomRead)
def owner_update_room(property_id: int, room_id: int, payload: RoomCreate, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        room = session.get(Room, room_id)
        if not room or room.property_id != property_id:
            raise HTTPException(status_code=404, detail="Room not found for property")

        if payload.room_number is not None:
            room.room_number = payload.room_number
        if payload.rent_per_month is not None:
            room.rent_per_month = payload.rent_per_month
        if payload.is_active is not None:
            room.is_active = payload.is_active

        # Add and flush; commit only if there's no surrounding transaction
        session.add(room)
        session.flush()
        try:
            session.commit()
        except Exception:
            logger.exception("owner_update_room: commit failed")
            raise
        session.refresh(room)

        return RoomRead(room_id=room.room_id, property_id=room.property_id, room_number=room.room_number, rent_per_month=room.rent_per_month, is_active=room.is_active)
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("owner_update_room failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/bookings", response_model=list[BookingRead])
def list_owner_bookings(current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        # resolve owner
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        # get room ids for owner's properties
        prop_ids = session.exec(select(Property.property_id).where(Property.owner_id == owner.owner_id)).all()
        if not prop_ids:
            return []
        room_ids = session.exec(select(Room.room_id).where(Room.property_id.in_(prop_ids))).all()
        if not room_ids:
            return []

        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids))).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=room.property_id if room else None,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_owner_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/properties/{property_id}/bookings", response_model=list[BookingRead])
def list_property_bookings(property_id: int, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        # verify property belongs to owner
        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        room_ids = session.exec(select(Room.room_id).where(Room.property_id == property_id)).all()
        if not room_ids:
            return []
        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids))).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=property_id,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_property_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/bookings/active", response_model=list[BookingRead])
def list_owner_active_bookings(current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop_ids = session.exec(select(Property.property_id).where(Property.owner_id == owner.owner_id)).all()
        if not prop_ids:
            return []
        room_ids = session.exec(select(Room.room_id).where(Room.property_id.in_(prop_ids))).all()
        if not room_ids:
            return []

        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids), Booking.booking_status == 'Active')).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=room.property_id if room else None,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_owner_active_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/bookings/completed", response_model=list[BookingRead])
def list_owner_completed_bookings(current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop_ids = session.exec(select(Property.property_id).where(Property.owner_id == owner.owner_id)).all()
        if not prop_ids:
            return []
        room_ids = session.exec(select(Room.room_id).where(Room.property_id.in_(prop_ids))).all()
        if not room_ids:
            return []

        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids), Booking.booking_status == 'Completed')).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=room.property_id if room else None,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_owner_completed_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/properties/{property_id}/bookings/active", response_model=list[BookingRead])
def list_property_active_bookings(property_id: int, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        room_ids = session.exec(select(Room.room_id).where(Room.property_id == property_id)).all()
        if not room_ids:
            return []
        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids), Booking.booking_status == 'Active')).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=property_id,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_property_active_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")


@router.get("/properties/{property_id}/bookings/completed", response_model=list[BookingRead])
def list_property_completed_bookings(property_id: int, current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)):
    try:
        from .models import Customer, Owner, Room, Booking
        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        prop = session.get(Property, property_id)
        if not prop or prop.owner_id != owner.owner_id:
            raise HTTPException(status_code=404, detail="Property not found for owner")

        room_ids = session.exec(select(Room.room_id).where(Room.property_id == property_id)).all()
        if not room_ids:
            return []
        bookings = session.exec(select(Booking).where(Booking.room_id.in_(room_ids), Booking.booking_status == 'Completed')).all()
        results = []
        for b in bookings:
            room = session.get(Room, b.room_id)
            customer = session.get(Customer, b.customer_id)
            results.append(BookingRead(
                booking_id=b.booking_id,
                property_id=property_id,
                room_id=b.room_id,
                room_number=room.room_number if room else "",
                customer_id=b.customer_id,
                customer_name=customer.full_name if customer else None,
                start_date=str(b.start_date) if getattr(b, 'start_date', None) else None,
                end_date=str(b.end_date) if getattr(b, 'end_date', None) else None,
                booking_status=b.booking_status,
            ))
        return results
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_property_completed_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")
    


@router.get("/properties", response_model=list[PropertyRead])
def list_my_properties(
    current_user: UserAuth = Depends(require_role("Owner")), session: Session = Depends(get_rental_session)
):
    try:
        # resolve owner_id for current user
        from .models import Customer, Owner

        cust = session.exec(select(Customer).where(Customer.user_id == current_user.user_id)).first()
        if not cust:
            raise HTTPException(status_code=404, detail="Customer profile not found in rental DB")
        owner = session.exec(select(Owner).where(Owner.customer_id == cust.customer_id)).first()
        if not owner:
            raise HTTPException(status_code=403, detail="User is not an owner")

        stmt = select(Property).where(Property.owner_id == owner.owner_id)
        props = session.exec(stmt).all()
        results = []
        for p in props:
            rooms = session.exec(select(Room).where(Room.property_id == p.property_id)).all()
            total_rooms = len(rooms)
            if total_rooms == 0:
                is_full = False
                rooms_available = 0
                next_available = None
                availability_text = "No rooms"
            else:
                room_ids = [r.room_id for r in rooms if getattr(r, 'room_id', None) is not None]
                active_rows = session.exec(select(Booking.room_id, Booking.end_date).where(Booking.booking_status == 'Active', Booking.room_id.in_(room_ids))).all()
                booked_room_ids = set([r for r, _ in active_rows])
                unique_booked = len(booked_room_ids)
                rooms_available = max(0, total_rooms - unique_booked)
                is_full = (rooms_available == 0)
                if rooms_available > 0:
                    next_available = None
                    availability_text = f"{rooms_available} rooms available"
                else:
                    end_dates = [ed for _, ed in active_rows if ed]
                    parsed_dates = []
                    for ed in end_dates:
                        try:
                            parsed_dates.append(datetime.fromisoformat(ed))
                        except Exception:
                            try:
                                parsed_dates.append(datetime.strptime(ed, "%Y-%m-%d"))
                            except Exception:
                                pass
                    if parsed_dates:
                        earliest = min(parsed_dates)
                        next_available = earliest.date().isoformat()
                        availability_text = f"Booked till {next_available}"
                    else:
                        next_available = None
                        availability_text = "Fully booked"

            results.append(PropertyRead(
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
                average_rent=None,
                is_full=is_full,
                rooms_available=rooms_available,
                next_available=next_available,
                availability_text=availability_text,
            ))
        # compute average rent per property for owner's properties
        for i, p in enumerate(props):
            try:
                avg_r = session.exec(select(func.avg(Room.rent_per_month)).where(Room.property_id == p.property_id, Room.is_active == True)).first()
                results[i].average_rent = float(avg_r) if avg_r is not None else None
            except Exception:
                results[i].average_rent = None
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_my_properties failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")
