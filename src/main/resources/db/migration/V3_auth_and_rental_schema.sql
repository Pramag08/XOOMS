-- V3_auth_and_rental_schema.sql
-- Full schema for `auth_db` and `rental_db` using two databases only.
-- Includes postgres_fdw steps to allow DB-level FK-like enforcement from `rental_db` to `auth_db`.
-- IMPORTANT: Replace placeholders (HOST, PORT, FDW_USER_PASSWORD) with real values. Run on staging first.

-- ===================================================================
-- SECTION A - AUTH DB (run while connected to auth_db:  \c auth_db)
-- ===================================================================
-- Create DB if needed (run as superuser/owner):
-- CREATE DATABASE auth_db;
-- \c auth_db

-- Create domain enum types used by auth DB
CREATE TYPE IF NOT EXISTS role_t AS ENUM ('Admin','Owner','User');
CREATE TYPE IF NOT EXISTS verification_status_t AS ENUM ('Pending','Verified','Rejected');

-- Users table (authentication DB)
DROP TABLE IF EXISTS users_auth CASCADE;
CREATE TABLE users_auth (
  user_id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role role_t NOT NULL DEFAULT 'User',
  verification_status verification_status_t NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_auth_role ON users_auth(role);
CREATE INDEX IF NOT EXISTS idx_users_auth_verification ON users_auth(verification_status);

-- updated_at trigger
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

-- Optional: create a minimal read-only FDW user for rental_db to use (run here in auth_db)
-- Replace 'replace_with_strong_password' before running.
-- CREATE ROLE fdw_readonly LOGIN PASSWORD 'replace_with_strong_password';
-- GRANT CONNECT ON DATABASE auth_db TO fdw_readonly;
-- GRANT USAGE ON SCHEMA public TO fdw_readonly;
-- GRANT SELECT ON users_auth TO fdw_readonly;

-- ===================================================================
-- SECTION B - RENTAL DB (run while connected to rental_db: \c rental_db)
-- ===================================================================
-- Create DB if needed (run as superuser/owner):
-- CREATE DATABASE rental_db;
-- \c rental_db

-- Required extension for exclusion constraints
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Local enum types for rental_db
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

-- Drop old objects (safe for dev). In prod create migrations instead.
DROP TABLE IF EXISTS review CASCADE;
DROP TABLE IF EXISTS booking CASCADE;
DROP TABLE IF EXISTS room CASCADE;
DROP TABLE IF EXISTS property CASCADE;
DROP TABLE IF EXISTS owner CASCADE;

-- OWNER table: links to auth_db.users_auth by user_id (no cross-db FK here)
CREATE TABLE owner (
  owner_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL, -- refers to auth_db.users_auth.user_id
  verification_status r_verification_status_t NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_owner_verification_status ON owner(verification_status);

-- PROPERTY table
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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_property_city_verified ON property(city) WHERE verification_status = 'Verified';
CREATE INDEX IF NOT EXISTS idx_property_owner ON property(owner_id);

-- ROOM table
CREATE TABLE room (
  room_id BIGSERIAL PRIMARY KEY,
  property_id BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
  room_number VARCHAR(20) NOT NULL,
  rent_per_month NUMERIC(10,2) NOT NULL CHECK (rent_per_month > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(property_id, room_number)
);
CREATE INDEX IF NOT EXISTS idx_room_property_active ON room(property_id) WHERE is_active = TRUE;

-- BOOKING table
CREATE TABLE booking (
  booking_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL, -- refers to auth_db.users_auth.user_id
  room_id BIGINT NOT NULL REFERENCES room(room_id) ON DELETE RESTRICT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  booking_status booking_status_t NOT NULL DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CHECK (start_date < end_date)
);
CREATE INDEX IF NOT EXISTS idx_booking_active_room ON booking(room_id) WHERE booking_status = 'Active';
CREATE INDEX IF NOT EXISTS idx_booking_user ON booking(user_id);

-- REVIEW table
CREATE TABLE review (
  review_id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL,
  property_id BIGINT NOT NULL REFERENCES property(property_id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  review_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, property_id)
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

-- =====================================
-- TRIGGERS & FUNCTIONS (rental_db)
-- =====================================
-- Generic updated_at function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Owner verification trigger (robust)
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
CREATE TRIGGER trg_property_owner_verified
BEFORE INSERT OR UPDATE ON property
FOR EACH ROW EXECUTE FUNCTION enforce_verified_owner();

-- Booking property verification
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
CREATE TRIGGER trg_booking_property_verified
BEFORE INSERT OR UPDATE ON booking
FOR EACH ROW EXECUTE FUNCTION enforce_verified_property_for_booking();

-- Review rule: only after completed booking
CREATE OR REPLACE FUNCTION enforce_review_rules()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM booking b JOIN room r ON r.room_id = b.room_id
    WHERE b.user_id = NEW.user_id
      AND r.property_id = NEW.property_id
      AND b.booking_status = 'Completed'
  ) THEN
    RAISE EXCEPTION 'User % cannot review property % without completed booking', NEW.user_id, NEW.property_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trg_review_validation ON review;
CREATE TRIGGER trg_review_validation
BEFORE INSERT OR UPDATE ON review
FOR EACH ROW EXECUTE FUNCTION enforce_review_rules();

-- update_property_rating with advisory lock
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

-- attach generic updated_at trigger to tables
DROP TRIGGER IF EXISTS trg_owner_updated_at ON owner;
CREATE TRIGGER trg_owner_updated_at BEFORE UPDATE ON owner FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_property_updated_at ON property;
CREATE TRIGGER trg_property_updated_at BEFORE UPDATE ON property FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_room_updated_at ON room;
CREATE TRIGGER trg_room_updated_at BEFORE UPDATE ON room FOR EACH ROW EXECUTE FUNCTION set_updated_at();
DROP TRIGGER IF EXISTS trg_booking_updated_at ON booking;
CREATE TRIGGER trg_booking_updated_at BEFORE UPDATE ON booking FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- =====================================
-- postgres_fdw setup (connects rental_db -> auth_db)
-- NOTE: requires superuser to create extension/server and a read-only user on auth_db
-- Replace HOST, PORT, FDW_USER_PASSWORD placeholders before running.
-- ===================================================================

-- Step 1: on auth_db (run in auth_db): create fdw_readonly role and grant SELECT
--
-- CREATE ROLE fdw_readonly LOGIN PASSWORD 'FDW_USER_PASSWORD';
-- GRANT CONNECT ON DATABASE auth_db TO fdw_readonly;
-- GRANT USAGE ON SCHEMA public TO fdw_readonly;
-- GRANT SELECT ON users_auth(user_id) TO fdw_readonly; -- only grant minimal columns if possible

-- Step 2: on rental_db (run in rental_db): create extension, server, and user mapping
-- Replace HOST and PORT and password
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

CREATE SERVER IF NOT EXISTS auth_server
  FOREIGN DATA WRAPPER postgres_fdw
  OPTIONS (host 'HOST', dbname 'auth_db', port 'PORT');

-- Create user mapping for the role that will access the FDW (CURRENT_USER). Adjust if needed.
CREATE USER MAPPING IF NOT EXISTS FOR CURRENT_USER
  SERVER auth_server
  OPTIONS (user 'fdw_readonly', password 'FDW_USER_PASSWORD');

-- Step 3: create foreign table locally (in public schema for simplicity)
-- The foreign table exposes only `user_id` to avoid type mismatches and sensitive data.
DROP FOREIGN TABLE IF EXISTS users_auth_remote;
CREATE FOREIGN TABLE users_auth_remote (
  user_id BIGINT
) SERVER auth_server
OPTIONS (schema_name 'public', table_name 'users_auth');

-- Optional: add a local index on the foreign table to speed lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_remote_user_id ON users_auth_remote(user_id);

-- Step 4: add FK constraints from owner.user_id and booking.user_id to the foreign table
ALTER TABLE owner
  ADD CONSTRAINT fk_owner_user_remote
  FOREIGN KEY (user_id) REFERENCES users_auth_remote(user_id);

ALTER TABLE booking
  ADD CONSTRAINT fk_booking_user_remote
  FOREIGN KEY (user_id) REFERENCES users_auth_remote(user_id);

-- ===================================================================
-- Notes & cautions
-- - Creating the `postgres_fdw` extension and server requires superuser privileges.
-- - Foreign-key enforcement against a foreign table will check existence by querying the remote table.
-- - Cross-database operations are not transactional across servers; plan app logic accordingly.
-- - Use SSL and network controls for the FDW connection if auth_db is on a different host.
-- - If you prefer to keep the FDW user password out of files, create the user mapping with a superuser via psql prompt or use `.pgpass`.

-- End of V3
