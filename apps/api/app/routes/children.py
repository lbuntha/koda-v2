from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_user, new_id
from ..db import get_db
from ..models import ChildProfile

router = APIRouter(prefix="/me/children", tags=["children"])


class ChildCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    grade: str | None = None
    locale: str = "en"


def _serialize(doc: dict[str, Any]) -> dict[str, Any]:
    return ChildProfile.model_validate(doc).model_dump(by_alias=True, mode="json")


@router.get("")
async def list_children(user: dict[str, Any] = Depends(get_current_user)) -> list[dict[str, Any]]:
    cursor = get_db().child_profiles.find({"parent_user_id": user["_id"]}).sort("created_at", 1)
    docs = await cursor.to_list(length=200)
    return [_serialize(d) for d in docs]


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_child(
    payload: ChildCreate,
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id("child"),
        "parent_user_id": user["_id"],
        "display_name": payload.display_name.strip(),
        "grade": payload.grade,
        "locale": payload.locale,
        "active_skill_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    await get_db().child_profiles.insert_one(doc)
    return _serialize(doc)


@router.delete("/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child(
    child_id: str,
    user: dict[str, Any] = Depends(get_current_user),
) -> None:
    result = await get_db().child_profiles.delete_one(
        {"_id": child_id, "parent_user_id": user["_id"]},
    )
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
