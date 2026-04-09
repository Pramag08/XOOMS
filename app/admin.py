from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List

from .db import get_rental_session, get_auth_session
from .deps import require_role
from .models import Property, Owner, Customer, UserAuth
from .schemas import PropertyRead
from .models import Booking, Room
from sqlmodel import and_, func
from typing import Optional
from datetime import date
import logging, traceback

router = APIRouter(prefix="/admin", tags=["admin"])
logger = logging.getLogger(__name__)


@router.get("/properties", response_model=List[PropertyRead])
def admin_list_properties(session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        props = session.exec(select(Property)).all()
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
            average_rent=None,
            is_full=False,
        ) for p in props]
        # compute average rent for each property
        for i, p in enumerate(props):
            try:
                avg_r = session.exec(select(func.avg(Room.rent_per_month)).where(Room.property_id == p.property_id, Room.is_active == True)).first()
                results[i].average_rent = float(avg_r) if avg_r is not None else None
            except Exception:
                results[i].average_rent = None
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_list_properties failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.get("/properties/unverified", response_model=List[PropertyRead])
def admin_list_unverified_properties(session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        # return properties that are pending verification, include owner name/email
        props = session.exec(select(Property).where(Property.verification_status == 'Pending')).all()
        results = []
        for p in props:
            owner = session.get(Owner, p.owner_id)
            owner_name = None
            owner_email = None
            if owner is not None:
                cust = session.get(Customer, owner.customer_id)
                if cust is not None:
                    owner_name = getattr(cust, 'full_name', None)
                    owner_email = getattr(cust, 'email', None)
            results.append({
                'property_id': p.property_id,
                'owner_id': p.owner_id,
                'owner_name': owner_name,
                'owner_email': owner_email,
                'property_description': p.property_description,
                'room_description': p.room_description,
                'property_type': p.property_type,
                'city': p.city,
                'address': p.address,
                'google_maps_link': p.google_maps_link,
                'verification_status': p.verification_status,
                'average_rating': p.average_rating,
            })
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_list_unverified_properties failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.put("/properties/{property_id}/verify", status_code=status.HTTP_200_OK)
def admin_verify_property(property_id: int, status: str = "Verified", session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        if status not in ("Verified", "Rejected", "Pending"):
            raise HTTPException(status_code=400, detail="status must be one of Verified, Rejected, Pending")
        prop = session.get(Property, property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        prop.verification_status = status
        try:
            session.add(prop)
            session.commit()
            session.refresh(prop)
        except Exception:
            session.rollback()
            raise
        return {"property_id": property_id, "verification_status": status}
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_verify_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.delete("/properties/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_property(property_id: int, session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        prop = session.get(Property, property_id)
        if not prop:
            raise HTTPException(status_code=404, detail="Property not found")
        try:
            session.delete(prop)
            session.commit()
        except Exception:
            session.rollback()
            raise
        return None
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_delete_property failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.get("/owners")
def admin_list_owners(session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        # return owners enriched with linked customer info (name, email)
        rows = session.exec(select(Owner)).all()
        results = []
        for o in rows:
            cust = session.get(Customer, o.customer_id)
            results.append({
                "owner_id": o.owner_id,
                "customer_id": o.customer_id,
                "name": getattr(cust, "full_name", None) if cust is not None else None,
                "email": getattr(cust, "email", None) if cust is not None else None,
                "verification_status": o.verification_status,
            })
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_list_owners failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.get("/owners/unverified")
def admin_list_unverified_owners(session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        owners = session.exec(select(Owner).where(Owner.verification_status == 'Pending')).all()
        results = []
        for o in owners:
            cust = session.get(Customer, o.customer_id)
            results.append({
                "owner_id": o.owner_id,
                "customer_id": o.customer_id,
                "name": getattr(cust, "full_name", None) if cust is not None else None,
                "email": getattr(cust, "email", None) if cust is not None else None,
                "verification_status": o.verification_status,
            })
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_list_unverified_owners failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.put("/owners/{owner_id}/verify")
def admin_verify_owner(owner_id: int, status: str = "Verified", session: Session = Depends(get_rental_session), current_user=Depends(require_role("Admin"))):
    try:
        if status not in ("Verified", "Rejected", "Pending"):
            raise HTTPException(status_code=400, detail="status must be one of Verified, Rejected, Pending")
        owner = session.get(Owner, owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")
        owner.verification_status = status
        try:
            session.add(owner)
            session.commit()
            session.refresh(owner)
        except Exception:
            session.rollback()
            raise
        return {"owner_id": owner_id, "verification_status": status}
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_verify_owner failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.delete("/owners/{owner_id}", status_code=status.HTTP_204_NO_CONTENT)
def admin_delete_owner(
    owner_id: int,
    session: Session = Depends(get_rental_session),
    auth_session: Session = Depends(get_auth_session),
    current_user=Depends(require_role("Admin")),
):
    try:
        owner = session.get(Owner, owner_id)
        if not owner:
            raise HTTPException(status_code=404, detail="Owner not found")

        # find linked customer -> user_id so we can remove auth record too
        cust = session.get(Customer, owner.customer_id)
        user_id = None
        if cust:
            user_id = getattr(cust, "user_id", None)

        # delete owner in rental DB
        try:
            session.delete(owner)
            session.commit()
        except Exception:
            session.rollback()
            raise

        # attempt to delete auth user in auth_db (best-effort)
        if user_id is not None:
            try:
                auth_user = auth_session.get(UserAuth, user_id)
                if auth_user:
                    auth_session.delete(auth_user)
                    auth_session.commit()
            except Exception:
                auth_session.rollback()
                # log and raise so calling client sees failure to remove auth record
                tb = traceback.format_exc()
                logger.exception("failed to delete auth user %s: %s", user_id, tb)
                raise HTTPException(status_code=500, detail=f"Failed to delete linked auth user: {tb}")

        return None
    except HTTPException:
        raise
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_delete_owner failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")


@router.get("/bookings")
def admin_list_bookings(
    property_id: Optional[int] = None,
    owner_id: Optional[int] = None,
    customer_id: Optional[int] = None,
    start_date_from: Optional[date] = None,
    start_date_to: Optional[date] = None,
    end_date_from: Optional[date] = None,
    end_date_to: Optional[date] = None,
    session: Session = Depends(get_rental_session),
    current_user=Depends(require_role("Admin")),
):
    """Return bookings with optional filters by property, owner, customer, and date ranges."""
    try:
        q = select(Booking, Room.property_id).join(Room, Booking.room_id == Room.room_id)
        # apply filters
        conditions = []
        if property_id is not None:
            conditions.append(Room.property_id == property_id)
        if owner_id is not None:
            # join to property via Room.property_id -> Property.property_id and filter owner
            from .models import Property as _Property

            q = q.join(_Property, Room.property_id == _Property.property_id)
            conditions.append(_Property.owner_id == owner_id)
        if customer_id is not None:
            conditions.append(Booking.customer_id == customer_id)
        if start_date_from is not None:
            conditions.append(Booking.start_date >= start_date_from.isoformat())
        if start_date_to is not None:
            conditions.append(Booking.start_date <= start_date_to.isoformat())
        if end_date_from is not None:
            conditions.append(Booking.end_date >= end_date_from.isoformat())
        if end_date_to is not None:
            conditions.append(Booking.end_date <= end_date_to.isoformat())

        if conditions:
            q = q.where(and_(*conditions))

        rows = session.exec(q).all()

        # rows are tuples (Booking, property_id) due to select(Booking, Room.property_id)
        results = []
        for row in rows:
            booking = row[0]
            prop_id = row[1]
            results.append({
                "booking_id": booking.booking_id,
                "customer_id": booking.customer_id,
                "room_id": booking.room_id,
                "property_id": prop_id,
                "start_date": booking.start_date,
                "end_date": booking.end_date,
                "booking_status": booking.booking_status,
            })
        return results
    except Exception as exc:
        tb = traceback.format_exc()
        logger.exception("admin_list_bookings failed: %s", exc)
        raise HTTPException(status_code=500, detail=f"Internal server error\n{tb}")
