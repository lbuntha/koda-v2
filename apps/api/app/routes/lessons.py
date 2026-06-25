"""Lesson submission endpoint.

The client runs through questions locally and POSTs a single payload at the
end. We re-grade server-side as the canonical source of truth, upsert one
lesson_attempts row by client-supplied id, and grant XP idempotently via the
xp_ledger unique (source_type, source_id) index.
"""

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_user
from ..db import get_db
from ..models import AttemptStatus, Skill
from ..services.xp_ledger import grant_xp_for_attempt, total_xp_for_child
from ..templates import grade_question

router = APIRouter(prefix="/lessons", tags=["lessons"])


class SubmittedAnswer(BaseModel):
    question_id: str
    value: Any


class LessonSubmit(BaseModel):
    client_attempt_id: str = Field(min_length=8, max_length=64)
    child_profile_id: str
    skill_id: str
    answers: list[SubmittedAnswer]
    started_at: datetime | None = None
    completed_at: datetime | None = None


class QuestionResult(BaseModel):
    question_id: str
    correct: bool
    score: int
    max_score: int


class LessonResult(BaseModel):
    attempt_id: str
    skill_id: str
    score: int
    max_score: int
    accuracy: float
    xp_granted: int
    total_xp: int
    results: list[QuestionResult]


def _xp_amount(xp_settings: dict[str, Any], score: int, max_score: int) -> int:
    base = int(xp_settings.get("lesson_complete", 10))
    perfect_bonus = int(xp_settings.get("perfect_lesson_bonus", 5))
    bonus = perfect_bonus if max_score > 0 and score == max_score else 0
    return base + bonus


@router.post("/submit", response_model=LessonResult)
async def submit_lesson(
    payload: LessonSubmit,
    user: dict[str, Any] = Depends(get_current_user),
) -> LessonResult:
    db = get_db()

    child = await db.child_profiles.find_one(
        {"_id": payload.child_profile_id, "parent_user_id": user["_id"]},
    )
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    skill_doc = await db.skills.find_one({"_id": payload.skill_id})
    if skill_doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    skill = Skill.model_validate(skill_doc)

    answers_by_id: dict[str, Any] = {a.question_id: a.value for a in payload.answers}

    results: list[QuestionResult] = []
    answers_for_storage: list[dict[str, Any]] = []
    total_score = 0
    total_max = 0

    for question in skill.questions:
        submitted = answers_by_id.get(question.id)
        if submitted is None:
            result = QuestionResult(
                question_id=question.id,
                correct=False,
                score=0,
                max_score=1,
            )
        else:
            grade = grade_question(question, submitted)
            result = QuestionResult(
                question_id=question.id,
                correct=grade.correct,
                score=grade.score,
                max_score=grade.max_score,
            )
        results.append(result)
        total_score += result.score
        total_max += result.max_score
        answers_for_storage.append(
            {
                "question_id": question.id,
                "value": submitted,
                "score": result.score,
                "max_score": result.max_score,
            }
        )

    now = datetime.now(timezone.utc)
    started_at = payload.started_at or now
    completed_at = payload.completed_at or now
    attempt_id = (
        payload.client_attempt_id
        if payload.client_attempt_id.startswith("att_")
        else f"att_{payload.client_attempt_id}"
    )

    await db.lesson_attempts.update_one(
        {"_id": attempt_id},
        {
            "$setOnInsert": {
                "_id": attempt_id,
                "child_profile_id": child["_id"],
                "skill_id": skill.id,
                "started_at": started_at,
            },
            "$set": {
                "status": AttemptStatus.COMPLETED.value,
                "score": total_score,
                "max_score": total_max,
                "completed_at": completed_at,
                "answers": answers_for_storage,
            },
        },
        upsert=True,
    )

    xp_settings_doc = await db.app_settings.find_one({"key": "xp"})
    xp_settings = xp_settings_doc.get("value", {}) if xp_settings_doc else {}
    xp_amount = _xp_amount(xp_settings, total_score, total_max)
    xp_granted = await grant_xp_for_attempt(
        child_profile_id=child["_id"],
        attempt_id=attempt_id,
        amount=xp_amount,
        reason=f"Lesson · {skill.title}",
    )
    total_xp = await total_xp_for_child(child["_id"])

    accuracy = (total_score / total_max) if total_max else 0.0
    return LessonResult(
        attempt_id=attempt_id,
        skill_id=skill.id,
        score=total_score,
        max_score=total_max,
        accuracy=round(accuracy, 4),
        xp_granted=xp_granted,
        total_xp=total_xp,
        results=results,
    )


@router.get("/me/totals")
async def get_my_totals(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    db = get_db()
    children = await db.child_profiles.find(
        {"parent_user_id": user["_id"]}, projection={"_id": 1, "display_name": 1}
    ).to_list(length=200)
    totals: list[dict[str, Any]] = []
    for child in children:
        totals.append(
            {
                "child_profile_id": child["_id"],
                "display_name": child["display_name"],
                "total_xp": await total_xp_for_child(child["_id"]),
            }
        )
    return {"children": totals}
