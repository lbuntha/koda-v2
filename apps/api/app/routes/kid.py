from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..auth import get_current_child_profile
from ..db import get_db
from ..models import ChildProfile

router = APIRouter(prefix="/kid", tags=["kid"])


class KidProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=500)
    avatar_svg: str | None = Field(default=None, max_length=80_000)
    locale: str | None = Field(default=None, min_length=2, max_length=12)


@router.get("/profile", response_model=ChildProfile)
async def get_kid_profile(child: dict[str, Any] = Depends(get_current_child_profile)) -> dict[str, Any]:
    return _serialize_child(child)


@router.patch("/profile", response_model=ChildProfile)
async def update_kid_profile(
    payload: KidProfileUpdate,
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> dict[str, Any]:
    update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.display_name is not None:
        update["display_name"] = payload.display_name.strip()
    if payload.avatar_url is not None:
        update["avatar_url"] = payload.avatar_url.strip() or None
    if payload.avatar_svg is not None:
        update["avatar_svg"] = payload.avatar_svg.strip() or None
    if payload.locale is not None:
        update["locale"] = payload.locale

    await get_db().child_profiles.update_one(
        {"_id": child["_id"], "parent_user_id": child["parent_user_id"]},
        {"$set": update},
    )
    updated = await get_db().child_profiles.find_one({"_id": child["_id"], "parent_user_id": child["parent_user_id"]})
    return _serialize_child(updated)


def _serialize_child(doc: dict[str, Any]) -> dict[str, Any]:
    return ChildProfile.model_validate(doc).model_dump(by_alias=True, mode="json")
