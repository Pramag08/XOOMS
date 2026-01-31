from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from .db import get_rental_session
from .models import Property, UserAuth
from .schemas import PropertyCreate, PropertyRead, BookingRead
from .deps import require_role, get_current_user
import logging
import traceback

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/owner", tags=["owner"])


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

        prop = Property(
            owner_id=owner.owner_id,
            property_description=payload.property_description,
            room_description=payload.room_description,
            property_type=payload.property_type,
            city=payload.city,
            address=payload.address,
            google_maps_link=payload.google_maps_link,
        )
        session.add(prop)
        session.commit()
        session.refresh(prop)
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
        )
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("create_property failed: %s", exc)
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
        return [PropertyRead(
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
        ) for p in props]
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("list_my_properties failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error (see server logs)\n{tb}")
