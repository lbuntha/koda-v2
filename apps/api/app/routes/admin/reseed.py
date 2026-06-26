"""Reset a single app_settings doc (or all of them) back to seeded defaults."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from ...auth import require_role
from ...db import get_db
from ...models import Role
from ...seeds.settings import DEFAULT_SETTINGS, reseed_settings

router = APIRouter()

_DEFAULT_KEYS = {entry["key"] for entry in DEFAULT_SETTINGS}


class ReseedResponse(BaseModel):
    reset: list[str]


@router.post("/settings/reseed", response_model=ReseedResponse)
async def reseed_settings_endpoint(
    key: str | None = None,
    _user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    """Reset one or all app_settings docs back to DEFAULT_SETTINGS.

    Pass ``?key=menus`` to reset just menus; omit to reset everything.
    """
    if key is not None:
        if key not in _DEFAULT_KEYS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown settings key '{key}'",
            )
        await get_db().app_settings.delete_one({"key": key})
        await reseed_settings()
        return ReseedResponse(reset=[key])
    await get_db().app_settings.delete_many({"key": {"$in": list(_DEFAULT_KEYS)}})
    await reseed_settings()
    return ReseedResponse(reset=sorted(_DEFAULT_KEYS))
