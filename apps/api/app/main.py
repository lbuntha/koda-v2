from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .db import get_db
from .indexes import ensure_indexes
from .routes import admin, auth
from .seeds.settings import seed_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    await ensure_indexes(get_db())
    await seed_settings()
    yield


app = FastAPI(title="Koda API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)


@app.get("/health")
async def health() -> dict:
    db = get_db()
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"status": "ok", "mongo": mongo_ok, "version": "0.1.0"}
