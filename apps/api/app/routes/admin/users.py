"""Admin user management routes."""

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field

from ...auth import require_role
from ...db import get_db
from ...models import Role

router = APIRouter()


class AdminChildProfile(BaseModel):
    id: str = Field(alias="_id")
    parent_user_id: str
    display_name: str
    grade: str | None = None
    age_range_id: str | None = None
    subject_ids: list[str] = Field(default_factory=list)
    primary_subject_id: str | None = None
    placement_status: str = "not_started"
    placement_result_summary: dict[str, Any] | None = None
    locale: str = "en"
    active_skill_ids: list[str] = Field(default_factory=list)
    disabled_at: datetime | None = None
    created_at: datetime
    updated_at: datetime


class AdminUserListItem(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    display_name: str
    role: Role
    locale: str = "en"
    created_at: datetime
    updated_at: datetime
    disabled_at: datetime | None = None
    children: list[AdminChildProfile] = Field(default_factory=list)


@router.get("/users", response_model=list[AdminUserListItem])
async def list_users(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    cursor = (
        get_db()
        .users.find(
            {},
            {
                "_id": 1,
                "email": 1,
                "display_name": 1,
                "role": 1,
                "locale": 1,
                "created_at": 1,
                "updated_at": 1,
                "disabled_at": 1,
            },
        )
        .sort("created_at", -1)
    )
    users = await cursor.to_list(length=500)
    parent_ids = [user["_id"] for user in users if user.get("role") == Role.PARENT.value]
    children_by_parent: dict[str, list[AdminChildProfile]] = {parent_id: [] for parent_id in parent_ids}
    if parent_ids:
        child_cursor = (
            get_db()
            .child_profiles.find({"parent_user_id": {"$in": parent_ids}})
            .sort([("parent_user_id", 1), ("created_at", 1)])
        )
        children = await child_cursor.to_list(length=2000)
        for child in children:
            children_by_parent.setdefault(child["parent_user_id"], []).append(AdminChildProfile.model_validate(child))
    for user in users:
        user["children"] = children_by_parent.get(user["_id"], [])
    return [AdminUserListItem.model_validate(user) for user in users]
