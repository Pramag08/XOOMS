-- V4_schema_with_customers.sql
-- Final schema: `auth_db` for authentication only, `rental_db` contains domain data and a local `customers` table.
-- Run Section A while connected to auth_db (\c auth_db), then Section B while connected to rental_db (\c rental_db).
-- Test on staging first.

-- ==========================================
-- SECTION A - AUTH DB (auth_db)
-- ==========================================
-- \c auth_db

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'role_t') THEN
    CREATE TYPE role_t AS ENUM ('Admin','Owner','User');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_status_t') THEN
    CREATE TYPE verification_status_t AS ENUM ('Pending','Verified','Rejected');
  END IF;
END $$;

DROP TABLE IF EXISTS users_auth CASCADE;
CREATE TABLE users_auth (
  user_id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role role_t NOT NULL DEFAULT 'User',
  verification_status verification_status_t NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_auth_role ON users_auth(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_verification ON users_auth(verification_status);

CREATE OR REPLACE FUNCTION set_updated_at_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_auth_updated_at ON users_auth;
CREATE TRIGGER trg_users_auth_updated_at
BEFORE UPDATE ON users_auth
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_trigger();

-- ==========================================
-- SECTION B - RENTAL DB (rental_db)
-- ==========================================
-- \c rental_db

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'r_verification_status_t') THEN
    CREATE TYPE r_verification_status_t AS ENUM ('Pending','Verified','Rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'property_type_t') THEN
    CREATE TYPE property_type_t AS ENUM ('Guest House','Boys PG','Girls PG','Serviced Apartment');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'booking_status_t') THEN
    CREATE TYPE booking_status_t AS ENUM ('Active','Completed','Cancelled');
  END IF;
END $$;

-- Drop domain objects if present (safe for dev)
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS owner CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- CUSTOMERS: local domain profile table (created by app at signup)
CREATE TABLE customers (
  customer_id BIGSERIAL PRIMARY KEY,
  -- local link to auth_db.users_auth.user_id (no cross-db FK)
  user_id BIGINT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- OWNER: links to a customer (domain-level owner)
CREATE TABLE owner (
  owner_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id) ON DELETE RESTRICT,
  verification_status r_verification_status_t NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_owner_verification_status ON owner(verification_status);

-- PROPERTY
CREATE TABLE property (
  property_id BIGSERIAL PRIMARY KEY,
  owner_id BIGINT NOT NULL REFERENCES owner(owner_id) ON DELETE RESTRICT,
  property_description TEXT NOT NULL,
  room_description TEXT NOT NULL,
  property_type property_type_t NOT NULL,
  city VARCHAR(100) NOT NULL,
  address TEXT NOT NULL,
  google_maps_link TEXT UNIQUE,
  verification_status r_verification_status_t NOT NULL DEFAULT 'Pending',
  average_rating NUMERIC(2,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_property_city_verified ON property(city) WHERE verification_status = 'Verified';
CREATE INDEX IF NOT EXISTS idx_property_owner ON property(owner_id);

-- ROOM
CREATE TABLE room (
  room_id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  rent_per_month NUMERIC(10,2) NOT NULL CHECK (rent_per_month > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, room_number)
);
CREATE INDEX IF NOT EXISTS idx_room_property_active ON room(property_id) WHERE is_active = TRUE;

-- BOOKING now references customers.customer_id
CREATE TABLE booking (
  booking_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES customers(customer_id),
  room_id BIGINT NOT NULL REFERENCES room(room_id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  booking_status booking_status_t NOT NULL DEFAULT 'Active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_date < end_date)
);
CREATE INDEX IF NOT EXISTS idx_booking_active_room ON booking(room_id) WHERE booking_status = 'Active';
CREATE INDEX IF NOT EXISTS idx_booking_customer ON booking(customer_id);

-- REVIEW references customers as reviewer
CREATE TABLE review (
  review_id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT NOT NULL,
  property_id BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(customer_id, property_id)
);
CREATE INDEX IF NOT EXISTS idx_review_property ON review(property_id);

-- NO OVERLAPPING ACTIVE BOOKINGS PER ROOM
ALTER TABLE booking
  ADD CONSTRAINT IF NOT EXISTS no_room_overlap
  EXCLUDE USING gist (
    room_id WITH =,
    daterange(start_date, end_date, '[)') WITH &&
  )
  WHERE (booking_status = 'Active');

-- ==========================================
-- TRIGGERS & FUNCTIONS (rental_db)
-- ==========================================
-- generic updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- enforce owner verification when creating/updating property
CREATE OR REPLACE FUNCTION enforce_verified_owner()
RETURNS TRIGGER AS $$
DECLARE v_status r_verification_status_t;
BEGIN
  SELECT verification_status INTO v_status FROM owner WHERE owner_id = NEW.owner_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Owner % does not exist', NEW.owner_id;
  ELSIF v_status <> 'Verified' THEN
    RAISE EXCEPTION 'Owner % is not verified', NEW.owner_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_property_owner_verified ON property;
CREATE TRIGGER trg_property_owner_verified BEFORE INSERT OR UPDATE ON property
FOR EACH ROW EXECUTE FUNCTION enforce_verified_owner();

-- enforce verified property for booking
CREATE OR REPLACE FUNCTION enforce_verified_property_for_booking()
RETURNS TRIGGER AS $$
DECLARE v_status r_verification_status_t;
BEGIN
  SELECT p.verification_status INTO v_status
  FROM room r JOIN property p ON p.property_id = r.property_id
  WHERE r.room_id = NEW.room_id;
  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Room % or its property does not exist', NEW.room_id;
  ELSIF v_status <> 'Verified' THEN
    RAISE EXCEPTION 'Cannot book room %, property is not verified', NEW.room_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_booking_property_verified ON booking;
CREATE TRIGGER trg_booking_property_verified BEFORE INSERT OR UPDATE ON booking
FOR EACH ROW EXECUTE FUNCTION enforce_verified_property_for_booking();

-- reviews only after completed booking (use customer_id)
CREATE OR REPLACE FUNCTION enforce_review_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM booking b
    JOIN room r ON r.room_id = b.room_id
    WHERE b.customer_id = NEW.customer_id
      AND r.property_id = NEW.property_id
      AND b.booking_status = 'Completed'
  ) THEN
    RAISE EXCEPTION 'Customer % cannot review property % without completed booking', NEW.customer_id, NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_review_validation ON review;
CREATE TRIGGER trg_review_validation BEFORE INSERT OR UPDATE ON review
FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

-- rating update with advisory lock
CREATE OR REPLACE FUNCTION update_property_rating()
RETURNS TRIGGER AS $$
DECLARE p_id BIGINT := COALESCE(NEW.property_id, OLD.property_id);
BEGIN
  PERFORM pg_advisory_xact_lock(p_id);
  UPDATE property
  SET average_rating = (
    SELECT ROUND(AVG(rating)::numeric, 1) FROM review WHERE property_id = p_id
  )
  WHERE property_id = p_id;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_rating_after_insert ON review;
DROP TRIGGER IF EXISTS trg_rating_after_update ON review;
DROP TRIGGER IF EXISTS trg_rating_after_delete ON review;
CREATE TRIGGER trg_rating_after_insert AFTER INSERT ON review FOR EACH ROW EXECUTE FUNCTION update_property_rating();
CREATE TRIGGER trg_rating_after_update AFTER UPDATE ON review FOR EACH ROW EXECUTE FUNCTION update_property_rating();
CREATE TRIGGER trg_rating_after_delete AFTER DELETE ON review FOR EACH ROW EXECUTE FUNCTION update_property_rating();

-- attach updated_at triggers
DROP TRIGGER IF EXISTS trg_owner_updated_at ON owner;
CREATE TRIGGER trg_owner_updated_at BEFORE UPDATE ON owner FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_property_updated_at ON property;
CREATE TRIGGER trg_property_updated_at BEFORE UPDATE ON property FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_room_updated_at ON room;
CREATE TRIGGER trg_room_updated_at BEFORE UPDATE ON room FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_booking_updated_at ON booking;
CREATE TRIGGER trg_booking_updated_at BEFORE UPDATE ON booking FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_customers_updated_at ON customers;
CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ==========================================
-- Indexes and housekeeping
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_property_city_verified ON property(city) WHERE verification_status = 'Verified';
CREATE INDEX IF NOT EXISTS idx_property_owner ON property(owner_id);
CREATE INDEX IF NOT EXISTS idx_room_property_active ON room(property_id) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_booking_active_room ON booking(room_id) WHERE booking_status = 'Active';
CREATE INDEX IF NOT EXISTS idx_booking_customer ON booking(customer_id);
CREATE INDEX IF NOT EXISTS idx_review_property ON review(property_id);
-- (unique constraint on customers.user_id creates an index automatically)

-- ==========================================
-- Notes
-- - Keep `auth_db` for login only. Create `customers` rows in `rental_db` at signup (or lazily on first action).
-- - If you still want DB-level enforcement to the auth DB, set up postgres_fdw and expose only `user_id`.
-- - Test whole flow in staging: signup -> create customer -> create owner -> create property -> bookings -> reviews.

-- End of V4
