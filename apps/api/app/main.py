from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .config import settings
from .db import get_db
from .indexes import ensure_indexes
from .routes import admin, auth, children, kid, lessons, parent, placement, skills, uploads
from .seeds.settings import seed_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
    await ensure_indexes(get_db())
    # Migrate legacy superadmin accounts to admin (Role enum no longer accepts superadmin).
    await get_db().users.update_many({"role": "superadmin"}, {"$set": {"role": "admin"}})
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
app.include_router(parent.router)
app.include_router(kid.router)
app.include_router(placement.router)
app.include_router(placement.kid_router)
app.include_router(uploads.router)
app.include_router(children.router)
app.include_router(skills.router)
app.include_router(lessons.router)

Path(settings.upload_dir).mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/health")
async def health() -> dict:
    db = get_db()
    try:
        await db.command("ping")
        mongo_ok = True
    except Exception:
        mongo_ok = False
    return {"status": "ok", "mongo": mongo_ok, "version": "0.1.0"}
