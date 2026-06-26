"""Subject and age-range catalog settings."""

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field, model_validator

from ...auth import require_role
from ...models import Role
from ._common import read_setting, write_setting

router = APIRouter()


class SubjectItem(BaseModel):
    id: str = Field(min_length=2, max_length=40, pattern=r"^[a-z][a-z0-9_-]+$")
    label: str = Field(min_length=1, max_length=80)
    description: str = Field(default="", max_length=240)
    enabled: bool = True


class AgeRangeItem(BaseModel):
    id: str = Field(min_length=2, max_length=40, pattern=r"^[a-z][a-z0-9_-]+$")
    label: str = Field(min_length=1, max_length=80)
    short_label: str = Field(default="", max_length=24)
    category: str = Field(default="", max_length=80)
    ui_style: str = Field(default="", max_length=120)
    description: str = Field(default="", max_length=240)
    color: str = Field(default="#CFF9DF", max_length=24)
    min_age: int = Field(ge=0, le=18)
    max_age: int = Field(ge=0, le=18)
    subject_ids: list[str] = Field(default_factory=list)
    enabled: bool = True

    @model_validator(mode="after")
    def validate_age_order(self):
        if self.max_age < self.min_age:
            raise ValueError("max_age must be greater than or equal to min_age")
        return self


class LearningCatalogSettings(BaseModel):
    subjects: list[SubjectItem] = Field(default_factory=list)
    age_ranges: list[AgeRangeItem] = Field(default_factory=list)


@router.get("/settings/learning-catalog", response_model=LearningCatalogSettings)
async def get_learning_catalog(_user: dict[str, Any] = Depends(require_role(Role.ADMIN))):
    return LearningCatalogSettings.model_validate(await read_setting("learning_catalog"))


@router.put("/settings/learning-catalog", response_model=LearningCatalogSettings)
async def update_learning_catalog(
    payload: LearningCatalogSettings,
    user: dict[str, Any] = Depends(require_role(Role.ADMIN)),
):
    subject_ids = [subject.id for subject in payload.subjects]
    duplicate_subjects = _duplicates(subject_ids)
    if duplicate_subjects:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate subject id(s): {', '.join(duplicate_subjects)}",
        )

    age_ids = [age_range.id for age_range in payload.age_ranges]
    duplicate_ages = _duplicates(age_ids)
    if duplicate_ages:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Duplicate age range id(s): {', '.join(duplicate_ages)}",
        )

    known_subjects = set(subject_ids)
    for age_range in payload.age_ranges:
        unknown = sorted(set(age_range.subject_ids) - known_subjects)
        if unknown:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Unknown subject(s) for {age_range.label}: {', '.join(unknown)}",
            )

    await write_setting("learning_catalog", payload.model_dump(mode="json"), user["_id"])
    return payload


def _duplicates(values: list[str]) -> list[str]:
    seen: set[str] = set()
    duplicates: set[str] = set()
    for value in values:
        if value in seen:
            duplicates.add(value)
        seen.add(value)
    return sorted(duplicates)
