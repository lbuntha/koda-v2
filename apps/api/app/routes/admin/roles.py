"""Roles & permissions settings."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...auth import require_role
from ...db import get_db
from ...models import Role
from ._common import read_setting, write_setting

router = APIRouter()


class RolePermission(BaseModel):
    key: str = Field(min_length=2, max_length=80)
    label: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=240)


class RoleRights(BaseModel):
    role: Role
    label: str = Field(min_length=2, max_length=80)
    permissions: list[str] = Field(default_factory=list)
    menu_items: list[str] = Field(default_factory=list)


class RolesSettings(BaseModel):
    permissions: list[RolePermission]
    roles: list[RoleRights]


@router.get("/settings/roles", response_model=RolesSettings)
async def get_roles_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    return RolesSettings.model_validate(await read_setting("roles"))


@router.put("/settings/roles", response_model=RolesSettings)
async def update_roles_settings(
    payload: RolesSettings,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    permission_keys = {permission.key for permission in payload.permissions}
    catalog_items = await _load_menu_catalog()
    for role_rights in payload.roles:
        unknown_perms = set(role_rights.permissions) - permission_keys
        if unknown_perms:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown permission(s) for role {role_rights.role.value}: {', '.join(sorted(unknown_perms))}",
            )
        for menu_id in role_rights.menu_items:
            item = catalog_items.get(menu_id)
            if item is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Unknown menu item '{menu_id}' for role {role_rights.role.value}",
                )
            if item["scope"] != "all" and item["scope"] != role_rights.role.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Menu item '{menu_id}' is not in scope for role {role_rights.role.value}",
                )
    await write_setting("roles", payload.model_dump(mode="json"), user["_id"])
    return payload


async def _load_menu_catalog() -> dict[str, dict[str, Any]]:
    doc = await get_db().app_settings.find_one({"key": "menus"})
    if doc is None:
        return {}
    return {item["id"]: item for item in doc.get("value", {}).get("items", [])}
