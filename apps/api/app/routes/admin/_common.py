"""Shared helpers for admin settings routes."""

from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status

from ...db import get_db


async def read_setting(key: str) -> dict[str, Any]:
    doc = await get_db().app_settings.find_one({"key": key})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Setting '{key}' not seeded")
    return doc["value"]


async def write_setting(key: str, value: dict[str, Any], user_id: str) -> None:
    await get_db().app_settings.update_one(
        {"key": key},
        {
            "$set": {
                "value": value,
                "updated_by_user_id": user_id,
                "updated_at": datetime.now(timezone.utc),
            }
        },
        upsert=True,
    )
