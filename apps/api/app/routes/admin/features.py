"""Feature-flag settings."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ...auth import require_role
from ...models import Role
from ._common import read_setting, write_setting

router = APIRouter()


class FeatureFlag(BaseModel):
    key: str = Field(min_length=2, max_length=80, pattern=r"^[a-z][a-z0-9_.]+$")
    label: str = Field(min_length=2, max_length=120)
    description: str = Field(default="", max_length=240)
    enabled: bool = False


class FeaturesSettings(BaseModel):
    items: list[FeatureFlag]


@router.get("/settings/features", response_model=FeaturesSettings)
async def get_features_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    return FeaturesSettings.model_validate(await read_setting("features"))


@router.put("/settings/features", response_model=FeaturesSettings)
async def update_features_settings(
    payload: FeaturesSettings,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    seen: set[str] = set()
    for item in payload.items:
        if item.key in seen:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate feature key '{item.key}'",
            )
        seen.add(item.key)
    await write_setting("features", payload.model_dump(mode="json"), user["_id"])
    return payload
