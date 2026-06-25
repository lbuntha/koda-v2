from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
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


class FeatureFlag(BaseModel):
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_.]+$")
    label: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=240)
    enabled: bool = False


class FeaturesSettings(BaseModel):
    items: list[FeatureFlag]


class XpSettings(BaseModel):
    lesson_complete: int = Field(ge=0, le=1000)
    perfect_lesson_bonus: int = Field(ge=0, le=1000)
    daily_goal: int = Field(ge=0, le=10000)


async def _read_setting(key: str) -> dict[str, Any]:
    doc = await get_db().app_settings.find_one({"key": key})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Setting '{key}' not seeded")
    return doc["value"]


async def _write_setting(key: str, value: dict[str, Any], user_id: str) -> None:
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


@router.get("/settings/roles", response_model=RolesSettings)
async def get_roles_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN, Role.SUPERADMIN))):
    return RolesSettings.model_validate(await _read_setting("roles"))


@router.put("/settings/roles", response_model=RolesSettings)
async def update_roles_settings(
    payload: RolesSettings,
    user: dict[str, Any] = Depends(require_role(Role.SUPERADMIN)),
):
    permission_keys = {permission.key for permission in payload.permissions}
    for role_rights in payload.roles:
        unknown = set(role_rights.permissions) - permission_keys
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown permission(s) for role {role_rights.role.value}: {', '.join(sorted(unknown))}",
            )
    await _write_setting("roles", payload.model_dump(mode="json"), user["_id"])
    return payload


@router.get("/settings/features", response_model=FeaturesSettings)
async def get_features_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN, Role.SUPERADMIN))):
    return FeaturesSettings.model_validate(await _read_setting("features"))


@router.put("/settings/features", response_model=FeaturesSettings)
async def update_features_settings(
    payload: FeaturesSettings,
    user: dict[str, Any] = Depends(require_role(Role.SUPERADMIN)),
):
    seen: set[str] = set()
    for item in payload.items:
        if item.key in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate feature key '{item.key}'",
            )
        seen.add(item.key)
    await _write_setting("features", payload.model_dump(mode="json"), user["_id"])
    return payload


@router.get("/settings/xp", response_model=XpSettings)
async def get_xp_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN, Role.SUPERADMIN))):
    return XpSettings.model_validate(await _read_setting("xp"))


@router.put("/settings/xp", response_model=XpSettings)
async def update_xp_settings(
    payload: XpSettings,
    user: dict[str, Any] = Depends(require_role(Role.SUPERADMIN)),
):
    await _write_setting("xp", payload.model_dump(mode="json"), user["_id"])
    return payload
