from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator

from ..auth import issue_child_profile_session, new_id, require_role
from ..db import get_db
from ..models import ChildProfile, Role

router = APIRouter(prefix="/parent", tags=["parent"])


class OnboardingChildCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    age_range_id: str = Field(min_length=2, max_length=40)
    subject_ids: list[str] = Field(min_length=1)
    primary_subject_id: str = Field(min_length=2, max_length=40)
    locale: str = Field(default="en", min_length=2, max_length=12)
    grade: str | None = Field(default=None, max_length=24)

    @model_validator(mode="after")
    def validate_primary_subject(self):
        if self.primary_subject_id not in self.subject_ids:
            raise ValueError("primary_subject_id must be included in subject_ids")
        return self


class OnboardingChildUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    age_range_id: str | None = Field(default=None, min_length=2, max_length=40)
    subject_ids: list[str] | None = None
    primary_subject_id: str | None = Field(default=None, min_length=2, max_length=40)
    locale: str | None = Field(default=None, min_length=2, max_length=12)
    grade: str | None = Field(default=None, max_length=24)

    @model_validator(mode="after")
    def validate_primary_subject(self):
        if self.subject_ids is not None and len(self.subject_ids) == 0:
            raise ValueError("subject_ids must include at least one subject")
        if self.subject_ids is not None and self.primary_subject_id is not None:
            if self.primary_subject_id not in self.subject_ids:
                raise ValueError("primary_subject_id must be included in subject_ids")
        return self


class ParentNotificationPreferences(BaseModel):
    placement_complete: bool = True
    weekly_summary: bool = True
    learning_reminders: bool = True
    product_updates: bool = False


class ParentProfile(BaseModel):
    id: str = Field(alias="_id")
    email: str
    display_name: str
    locale: str = "en"
    avatar_url: str | None = None
    avatar_svg: str | None = None
    phone: str | None = None
    timezone: str = "Asia/Phnom_Penh"
    notification_preferences: ParentNotificationPreferences = Field(default_factory=ParentNotificationPreferences)
    created_at: datetime
    updated_at: datetime


class ParentProfileUpdate(BaseModel):
    display_name: str | None = Field(default=None, min_length=1, max_length=80)
    locale: str | None = Field(default=None, min_length=2, max_length=12)
    avatar_url: str | None = Field(default=None, max_length=500)
    avatar_svg: str | None = Field(default=None, max_length=80_000)
    phone: str | None = Field(default=None, max_length=40)
    timezone: str | None = Field(default=None, min_length=3, max_length=80)
    notification_preferences: ParentNotificationPreferences | None = None


@router.get("/profile", response_model=ParentProfile)
async def get_parent_profile(user: dict[str, Any] = Depends(require_role(Role.PARENT))) -> dict[str, Any]:
    return _serialize_parent_profile(user)


@router.patch("/profile", response_model=ParentProfile)
async def update_parent_profile(
    payload: ParentProfileUpdate,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    if payload.display_name is not None:
        update["display_name"] = payload.display_name.strip()
    if payload.locale is not None:
        update["locale"] = payload.locale
    if payload.avatar_url is not None:
        update["avatar_url"] = payload.avatar_url.strip() or None
    if payload.avatar_svg is not None:
        update["avatar_svg"] = payload.avatar_svg.strip() or None
    if payload.phone is not None:
        update["phone"] = payload.phone.strip() or None
    if payload.timezone is not None:
        update["timezone"] = payload.timezone
    if payload.notification_preferences is not None:
        update["notification_preferences"] = payload.notification_preferences.model_dump()

    await get_db().users.update_one({"_id": user["_id"]}, {"$set": update})
    updated = await get_db().users.find_one({"_id": user["_id"]})
    return _serialize_parent_profile(updated)


@router.get("/onboarding")
async def get_parent_onboarding(user: dict[str, Any] = Depends(require_role(Role.PARENT))) -> dict[str, Any]:
    db = get_db()
    catalog = await db.app_settings.find_one({"key": "learning_catalog"})
    children = await db.child_profiles.find({"parent_user_id": user["_id"]}).sort("created_at", 1).to_list(length=100)
    return {
        "catalog": catalog["value"] if catalog else {"subjects": [], "age_ranges": []},
        "children": [_serialize_child(child) for child in children],
    }


@router.post("/onboarding/children", status_code=status.HTTP_201_CREATED)
async def create_onboarding_child(
    payload: OnboardingChildCreate,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    await _validate_catalog_selection(payload.age_range_id, payload.subject_ids, payload.primary_subject_id)
    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id("child"),
        "parent_user_id": user["_id"],
        "display_name": payload.display_name.strip(),
        "grade": payload.grade,
        "age_range_id": payload.age_range_id,
        "subject_ids": payload.subject_ids,
        "primary_subject_id": payload.primary_subject_id,
        "placement_status": "not_started",
        "placement_result_summary": None,
        "locale": payload.locale,
        "active_skill_ids": [],
        "created_at": now,
        "updated_at": now,
    }
    await get_db().child_profiles.insert_one(doc)
    return _serialize_child(doc)


@router.patch("/onboarding/children/{child_id}")
async def update_onboarding_child(
    child_id: str,
    payload: OnboardingChildUpdate,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    db = get_db()
    existing = await db.child_profiles.find_one({"_id": child_id, "parent_user_id": user["_id"]})
    if existing is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    next_age_range_id = payload.age_range_id or existing.get("age_range_id")
    next_subject_ids = payload.subject_ids if payload.subject_ids is not None else existing.get("subject_ids", [])
    next_primary = payload.primary_subject_id or existing.get("primary_subject_id")
    if next_age_range_id and next_subject_ids and next_primary:
        await _validate_catalog_selection(next_age_range_id, next_subject_ids, next_primary)

    update: dict[str, Any] = {"updated_at": datetime.now(timezone.utc)}
    for key in ["age_range_id", "subject_ids", "primary_subject_id", "locale", "grade"]:
        value = getattr(payload, key)
        if value is not None:
            update[key] = value
    if payload.display_name is not None:
        update["display_name"] = payload.display_name.strip()

    await db.child_profiles.update_one({"_id": child_id, "parent_user_id": user["_id"]}, {"$set": update})
    updated = await db.child_profiles.find_one({"_id": child_id, "parent_user_id": user["_id"]})
    return _serialize_child(updated)


@router.post("/children/{child_id}/login")
async def login_child_profile(
    child_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    child = await get_db().child_profiles.find_one(
        {"_id": child_id, "parent_user_id": user["_id"], "disabled_at": None},
    )
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    return issue_child_profile_session(child).model_dump(by_alias=True, mode="json")


@router.post("/children/{child_id}/disable")
async def disable_child_profile(
    child_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    result = await get_db().child_profiles.update_one(
        {"_id": child_id, "parent_user_id": user["_id"]},
        {"$set": {"disabled_at": now, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    child = await get_db().child_profiles.find_one({"_id": child_id, "parent_user_id": user["_id"]})
    return _serialize_child(child)


@router.post("/children/{child_id}/enable")
async def enable_child_profile(
    child_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    now = datetime.now(timezone.utc)
    result = await get_db().child_profiles.update_one(
        {"_id": child_id, "parent_user_id": user["_id"]},
        {"$set": {"disabled_at": None, "updated_at": now}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    child = await get_db().child_profiles.find_one({"_id": child_id, "parent_user_id": user["_id"]})
    return _serialize_child(child)


@router.delete("/children/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_child_profile(
    child_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> None:
    db = get_db()
    result = await db.child_profiles.delete_one({"_id": child_id, "parent_user_id": user["_id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")
    await db.placement_sessions.delete_many({"child_profile_id": child_id, "parent_user_id": user["_id"]})


def _serialize_child(doc: dict[str, Any]) -> dict[str, Any]:
    return ChildProfile.model_validate(doc).model_dump(by_alias=True, mode="json")


def _serialize_parent_profile(user: dict[str, Any]) -> dict[str, Any]:
    prefs = ParentNotificationPreferences.model_validate(user.get("notification_preferences") or {})
    return ParentProfile(
        _id=user["_id"],
        email=user["email"],
        display_name=user["display_name"],
        locale=user.get("locale", "en"),
        avatar_url=user.get("avatar_url"),
        avatar_svg=user.get("avatar_svg"),
        phone=user.get("phone"),
        timezone=user.get("timezone", "Asia/Phnom_Penh"),
        notification_preferences=prefs,
        created_at=user["created_at"],
        updated_at=user["updated_at"],
    ).model_dump(by_alias=True, mode="json")


async def _validate_catalog_selection(age_range_id: str, subject_ids: list[str], primary_subject_id: str) -> None:
    if primary_subject_id not in subject_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Primary subject must be selected")

    catalog = await get_db().app_settings.find_one({"key": "learning_catalog"})
    value = catalog["value"] if catalog else {"subjects": [], "age_ranges": []}
    enabled_subjects = {subject["id"] for subject in value.get("subjects", []) if subject.get("enabled", True)}
    enabled_age_ranges = {
        age_range["id"]: set(age_range.get("subject_ids", []))
        for age_range in value.get("age_ranges", [])
        if age_range.get("enabled", True)
    }

    if age_range_id not in enabled_age_ranges:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Age range is not available")

    unknown_subjects = sorted(set(subject_ids) - enabled_subjects)
    if unknown_subjects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject(s) are not available: {', '.join(unknown_subjects)}",
        )

    unsupported = sorted(set(subject_ids) - enabled_age_ranges[age_range_id])
    if unsupported:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Subject(s) are not enabled for this age range: {', '.join(unsupported)}",
        )
