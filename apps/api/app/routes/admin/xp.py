"""XP rule settings."""

from typing import Any

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from ...auth import require_role
from ...models import Role
from ._common import read_setting, write_setting

router = APIRouter()


class XpSettings(BaseModel):
    lesson_complete: int = Field(ge=0, le=1000)
    perfect_lesson_bonus: int = Field(ge=0, le=1000)
    daily_goal: int = Field(ge=0, le=10000)


@router.get("/settings/xp", response_model=XpSettings)
async def get_xp_settings(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    return XpSettings.model_validate(await read_setting("xp"))


@router.put("/settings/xp", response_model=XpSettings)
async def update_xp_settings(
    payload: XpSettings,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    await write_setting("xp", payload.model_dump(mode="json"), user["_id"])
    return payload
