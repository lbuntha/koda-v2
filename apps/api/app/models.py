from datetime import datetime, timezone
from enum import StrEnum
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, model_validator


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Role(StrEnum):
    STUDENT = "student"
    PARENT = "parent"
    TEACHER = "teacher"
    ADMIN = "admin"


class SkillStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    ARCHIVED = "archived"


class AttemptStatus(StrEnum):
    STARTED = "started"
    COMPLETED = "completed"
    ABANDONED = "abandoned"


class PyObjectModel(BaseModel):
    model_config = ConfigDict(populate_by_name=True, arbitrary_types_allowed=True)


class User(PyObjectModel):
    id: str = Field(alias="_id")
    email: EmailStr
    password_hash: str
    display_name: str
    role: Role
    locale: str = "en"
    avatar_url: str | None = None
    phone: str | None = None
    timezone: str = "Asia/Phnom_Penh"
    avatar_svg: str | None = None
    notification_preferences: dict[str, bool] = Field(default_factory=dict)
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    disabled_at: datetime | None = None


class ChildProfile(PyObjectModel):
    id: str = Field(alias="_id")
    parent_user_id: str
    display_name: str
    avatar_url: str | None = None
    avatar_svg: str | None = None
    grade: str | None = None
    age_range_id: str | None = None
    subject_ids: list[str] = Field(default_factory=list)
    primary_subject_id: str | None = None
    placement_status: Literal["not_started", "in_progress", "complete"] = "not_started"
    placement_result_summary: dict[str, Any] | None = None
    locale: str = "en"
    active_skill_ids: list[str] = Field(default_factory=list)
    disabled_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)


class SkillTemplate(StrEnum):
    MCQ = "mcq"
    MATH_WORKSHEET = "math-worksheet"


class SkillQuestion(BaseModel):
    id: str
    template: SkillTemplate
    prompt: str
    payload: dict[str, Any] = Field(default_factory=dict)
    answer: dict[str, Any] = Field(default_factory=dict)


class Skill(PyObjectModel):
    id: str = Field(alias="_id")
    slug: str
    title: str
    description: str = ""
    grade: str
    locale: str = "en"
    status: SkillStatus = SkillStatus.DRAFT
    tags: list[str] = Field(default_factory=list)
    questions: list[SkillQuestion] = Field(default_factory=list)
    created_by_user_id: str | None = None
    created_at: datetime = Field(default_factory=utc_now)
    updated_at: datetime = Field(default_factory=utc_now)
    published_at: datetime | None = None

    @model_validator(mode="after")
    def validate_questions(self):
        from .templates import validate_skill_questions

        validate_skill_questions(self.questions)
        return self


class LessonAttempt(PyObjectModel):
    id: str = Field(alias="_id")
    child_profile_id: str
    skill_id: str
    status: AttemptStatus = AttemptStatus.STARTED
    score: int = 0
    max_score: int = 0
    started_at: datetime = Field(default_factory=utc_now)
    completed_at: datetime | None = None
    answers: list[dict[str, Any]] = Field(default_factory=list)


class XpLedgerEntry(PyObjectModel):
    id: str = Field(alias="_id")
    child_profile_id: str
    source_type: Literal["lesson_attempt", "admin_adjustment", "streak_bonus"]
    source_id: str
    amount: int
    reason: str
    created_at: datetime = Field(default_factory=utc_now)


class AppSetting(PyObjectModel):
    id: str = Field(alias="_id")
    key: str
    value: dict[str, Any]
    updated_by_user_id: str | None = None
    updated_at: datetime = Field(default_factory=utc_now)
