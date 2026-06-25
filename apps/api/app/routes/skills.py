from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status

from ..auth import get_current_user
from ..db import get_db
from ..models import Skill, SkillStatus
from ..templates import render_question

router = APIRouter(prefix="/skills", tags=["skills"])


def _summary(doc: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": doc["_id"],
        "slug": doc["slug"],
        "title": doc["title"],
        "description": doc.get("description", ""),
        "grade": doc["grade"],
        "locale": doc.get("locale", "en"),
        "status": doc["status"],
        "tags": doc.get("tags", []),
        "question_count": len(doc.get("questions", [])),
    }


@router.get("")
async def list_skills(
    grade: str | None = Query(default=None),
    locale: str | None = Query(default=None),
    skill_status: SkillStatus = Query(default=SkillStatus.PUBLISHED, alias="status"),
    _user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    query: dict[str, Any] = {"status": skill_status.value}
    if grade:
        query["grade"] = grade
    if locale:
        query["locale"] = locale
    docs = await get_db().skills.find(query).sort("title", 1).to_list(length=500)
    return [_summary(d) for d in docs]


@router.get("/{skill_id}")
async def get_skill(
    skill_id: str,
    _user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    doc = await get_db().skills.find_one({"$or": [{"_id": skill_id}, {"slug": skill_id}]})
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")

    skill = Skill.model_validate(doc)
    rendered = [render_question(question).model_dump(mode="json") for question in skill.questions]
    return {
        "id": skill.id,
        "slug": skill.slug,
        "title": skill.title,
        "description": skill.description,
        "grade": skill.grade,
        "locale": skill.locale,
        "status": skill.status.value,
        "tags": skill.tags,
        "questions": rendered,
    }
