from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ..auth import require_role
from ..db import get_db
from ..models import Role

router = APIRouter(prefix="/admin", tags=["admin"])


class RolePermission(BaseModel):
    key: str = Field(min_length=2, max_length=80)
    label: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=240)


class RoleRights(BaseModel):
    role: Role
    label: str = Field(min_length=2, max_length=80)
    permissions: list[str] = Field(default_factory=list)


class RolesSettings(BaseModel):
    permissions: list[RolePermission]
    roles: list[RoleRights]


@router.get("/settings/roles", response_model=RolesSettings)
async def get_roles_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN, Role.SUPERADMIN))):
    setting = await get_db().app_settings.find_one({"key": "roles"})
    return RolesSettings.model_validate(setting["value"])


@router.put("/settings/roles", response_model=RolesSettings)
async def update_roles_settings(
    payload: RolesSettings,
    user: dict[str, Any] = Depends(require_role(Role.SUPERADMIN)),
):
    await get_db().app_settings.update_one(
        {"key": "roles"},
        {
            "$set": {
                "value": payload.model_dump(mode="json"),
                "updated_by_user_id": user["_id"],
            }
        },
        upsert=True,
    )
    return payload
