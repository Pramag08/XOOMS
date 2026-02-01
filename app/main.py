from fastapi import FastAPI

from .auth import router as auth_router
from .owner import router as owner_router
from .customers import router as customers_router
from .properties import router as properties_router


app = FastAPI(title="StayMadeSimple - Auth")


app.include_router(auth_router)
app.include_router(owner_router)
app.include_router(customers_router)
app.include_router(properties_router)