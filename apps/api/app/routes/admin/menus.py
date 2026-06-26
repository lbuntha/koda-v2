"""Menu catalog: the list of sidebar items that roles can be assigned.

Per-item CRUD endpoints persist immediately; the bulk PUT is kept for
batch saves from the catalog editor UI.
"""

from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...auth import require_role
from ...db import get_db
from ...models import Role
from ._common import read_setting, write_setting

router = APIRouter()

# Routes that exist as real pages on the frontend.
# Menu items can only point at one of these.
ROUTE_REGISTRY: dict[str, list[str]] = {
    "/admin":                ["admin"],
    "/admin/roles":          ["admin"],
    "/admin/features":       ["admin"],
    "/admin/settings":       ["admin"],
    "/admin/system-status":  ["admin"],
    "/admin/menus":          ["admin"],
    "/admin/skills":         ["admin"],
    "/admin/users":          ["admin"],
    "/admin/audit":          ["admin"],
    "/teacher":              ["teacher"],
    "/teacher/skills":       ["teacher"],
    "/teacher/students":     ["teacher"],
    "/teacher/reports":      ["teacher"],
    "/teacher/classes":      ["teacher"],
    "/teacher/settings":     ["teacher"],
    "/parent":               ["parent"],
    "/parent/children":      ["parent"],
    "/parent/progress":      ["parent"],
    "/parent/settings":      ["parent"],
    "/student":              ["student"],
    "/student/progress":     ["student"],
    "/student/rewards":      ["student"],
}

ALLOWED_ICONS = {
    "LayoutDashboard", "ShieldCheck", "ToggleLeft", "Settings", "Activity",
    "Menu", "BookOpen", "Users", "ScrollText", "GraduationCap", "BarChart3",
    "School", "Baby", "TrendingUp", "Trophy",
}


class MenuItem(BaseModel):
    id: str = Field(min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_.]+$")
    label_key: str = Field(min_length=2, max_length=80)
    route: str = Field(min_length=1, max_length=120)
    icon: str = Field(min_length=2, max_length=40)
    section: Literal["top", "manage"]
    scope: Literal["student", "parent", "teacher", "admin", "all"]
    permission: Optional[str] = None
    end: bool = False
    order: int = Field(default=0, ge=0, le=10000)
    enabled: bool = True


class MenusSettings(BaseModel):
    items: list[MenuItem]


def _validate_menu_item(item: MenuItem) -> None:
    allowed_scopes = ROUTE_REGISTRY.get(item.route)
    if allowed_scopes is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown route '{item.route}' for menu '{item.id}'",
        )
    if item.scope != "all" and item.scope not in allowed_scopes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Route '{item.route}' is not allowed for scope '{item.scope}'",
        )
    if item.icon not in ALLOWED_ICONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown icon '{item.icon}' for menu '{item.id}'",
        )


async def _load_menus() -> MenusSettings:
    return MenusSettings.model_validate(await read_setting("menus"))


async def _save_menus(settings: MenusSettings, user_id: str) -> None:
    await write_setting("menus", settings.model_dump(mode="json"), user_id)


@router.get("/settings/menus", response_model=MenusSettings)
async def get_menus_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    return await _load_menus()


@router.put("/settings/menus", response_model=MenusSettings)
async def update_menus_settings(
    payload: MenusSettings,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    seen: set[str] = set()
    for item in payload.items:
        if item.id in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate menu id '{item.id}'",
            )
        seen.add(item.id)
        _validate_menu_item(item)
    await _save_menus(payload, user["_id"])
    return payload


@router.post("/settings/menus/items", response_model=MenuItem, status_code=status.HTTP_201_CREATED)
async def create_menu_item(
    item: MenuItem,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    current = await _load_menus()
    if any(existing.id == item.id for existing in current.items):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Menu id '{item.id}' already exists",
        )
    _validate_menu_item(item)
    current.items.append(item)
    await _save_menus(current, user["_id"])
    return item


@router.put("/settings/menus/items/{item_id}", response_model=MenuItem)
async def update_menu_item(
    item_id: str,
    patch: MenuItem,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    if patch.id != item_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Menu id in path and body must match",
        )
    current = await _load_menus()
    index = next((i for i, existing in enumerate(current.items) if existing.id == item_id), None)
    if index is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Menu '{item_id}' not found")
    _validate_menu_item(patch)
    current.items[index] = patch
    await _save_menus(current, user["_id"])
    return patch


@router.delete("/settings/menus/items/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_menu_item(
    item_id: str,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    current = await _load_menus()
    next_items = [item for item in current.items if item.id != item_id]
    if len(next_items) == len(current.items):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Menu '{item_id}' not found")
    current.items = next_items
    await _save_menus(current, user["_id"])
    await _cascade_role_menu_items(item_id, user["_id"])
    return None


async def _cascade_role_menu_items(removed_id: str, user_id: str) -> None:
    """When a menu item is deleted, drop it from every role.menu_items."""
    roles_doc = await get_db().app_settings.find_one({"key": "roles"})
    if roles_doc is None:
        return
    roles_value = roles_doc.get("value", {})
    changed = False
    for role in roles_value.get("roles", []):
        if removed_id in role.get("menu_items", []):
            role["menu_items"] = [mid for mid in role["menu_items"] if mid != removed_id]
            changed = True
    if changed:
        await write_setting("roles", roles_value, user_id)
