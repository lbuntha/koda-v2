"""Admin settings routes.

Each settings concern (roles, menus, features, xp) lives in its own module.
They are all mounted under the /admin prefix via this package's router so
external imports (``from .routes import admin``) keep working.
"""

from fastapi import APIRouter

from . import features, learning, menus, reseed, roles, users, xp

router = APIRouter(prefix="/admin", tags=["admin"])
router.include_router(roles.router)
router.include_router(menus.router)
router.include_router(learning.router)
router.include_router(features.router)
router.include_router(xp.router)
router.include_router(users.router)
router.include_router(reseed.router)

__all__ = ["router"]
