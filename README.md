StayMadeSimple — FastAPI backend (auth starter)

Quick start (development):

1. Install dependencies (prefer a virtualenv):

```bash
pip install -r requirements.txt
```

2. Set environment variables (optional):

```bash
export AUTH_DATABASE_URL="postgresql://postgres:vaibhav@localhost:5432/auth_db"
export SECRET_KEY="a-long-random-secret"
```

3. Run the app:

```bash
uvicorn app.main:app --reload --port 8000
```

Login endpoint: `POST /login` with JSON `{ "email": "...", "password": "..." }`.

Notes:
- The seed data inserted earlier used placeholder password hashes; to login for seeded users either update their `password_hash` with a bcrypt hash (use the helper in `app/auth.py`) or create new users via your application's signup flow.
- This scaffold uses `SQLModel` (SQLAlchemy) and a separate engine pointed at `AUTH_DATABASE_URL` for the `auth_db` database.
