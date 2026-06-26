from datetime import datetime, timezone
from typing import Any, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from ..auth import get_current_child_profile, new_id, require_role
from ..db import get_db
from ..models import Role

router = APIRouter(prefix="/placement", tags=["placement"])
kid_router = APIRouter(prefix="/kid/placement", tags=["kid-placement"])

PlacementStatus = Literal["started", "completed", "abandoned"]
Difficulty = Literal["warmup", "target", "stretch"]
PlacementBand = Literal["review", "ready", "stretch"]


class PlacementQuestion(BaseModel):
    id: str
    subject_id: str
    prompt: str
    choices: list[str | int]
    difficulty: Difficulty


class PlacementAnswerCreate(BaseModel):
    question_id: str = Field(min_length=2, max_length=80)
    selected_value: str | int


class PlacementSessionCreate(BaseModel):
    child_profile_id: str = Field(min_length=2, max_length=80)
    subject_id: str | None = Field(default=None, min_length=2, max_length=40)


class PlacementAnswer(BaseModel):
    question_id: str
    subject_id: str
    difficulty: Difficulty
    selected_value: str | int
    correct: bool
    answered_at: datetime


class PlacementResultSummary(BaseModel):
    subject_id: str
    band: PlacementBand
    accuracy: float
    recommended_age_range_id: str | None = None
    recommended_skill_ids: list[str] = Field(default_factory=list)
    parent_summary: str


class PlacementSession(BaseModel):
    id: str = Field(alias="_id")
    parent_user_id: str
    child_profile_id: str
    age_range_id: str | None = None
    subject_id: str
    status: PlacementStatus
    current_question_index: int = 0
    answers: list[PlacementAnswer] = Field(default_factory=list)
    result: PlacementResultSummary | None = None
    started_at: datetime
    completed_at: datetime | None = None


@router.post("/sessions", response_model=PlacementSession, status_code=status.HTTP_201_CREATED)
async def create_placement_session(
    payload: PlacementSessionCreate,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    db = get_db()
    child = await db.child_profiles.find_one({"_id": payload.child_profile_id, "parent_user_id": user["_id"]})
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child profile not found")

    subject_id = payload.subject_id or child.get("primary_subject_id")
    if not subject_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Child has no primary subject")
    if subject_id not in child.get("subject_ids", []):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject is not selected for this child")
    if subject_id not in QUESTION_BANK:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement questions are not available")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id("placement"),
        "parent_user_id": user["_id"],
        "child_profile_id": child["_id"],
        "age_range_id": child.get("age_range_id"),
        "subject_id": subject_id,
        "status": "started",
        "current_question_index": 0,
        "answers": [],
        "result": None,
        "started_at": now,
        "completed_at": None,
    }
    await db.placement_sessions.insert_one(doc)
    await db.child_profiles.update_one(
        {"_id": child["_id"], "parent_user_id": user["_id"]},
        {"$set": {"placement_status": "in_progress", "updated_at": now}},
    )
    return _serialize_session(doc)


@kid_router.post("/sessions", response_model=PlacementSession, status_code=status.HTTP_201_CREATED)
async def create_kid_placement_session(
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> dict[str, Any]:
    subject_id = child.get("primary_subject_id")
    if not subject_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Child has no primary subject")
    if subject_id not in child.get("subject_ids", []):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Subject is not selected for this child")
    if subject_id not in QUESTION_BANK:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement questions are not available")

    now = datetime.now(timezone.utc)
    doc = {
        "_id": new_id("placement"),
        "parent_user_id": child["parent_user_id"],
        "child_profile_id": child["_id"],
        "age_range_id": child.get("age_range_id"),
        "subject_id": subject_id,
        "status": "started",
        "current_question_index": 0,
        "answers": [],
        "result": None,
        "started_at": now,
        "completed_at": None,
    }
    db = get_db()
    await db.placement_sessions.insert_one(doc)
    await db.child_profiles.update_one(
        {"_id": child["_id"], "parent_user_id": child["parent_user_id"]},
        {"$set": {"placement_status": "in_progress", "updated_at": now}},
    )
    return _serialize_session(doc)


@router.get("/sessions/{session_id}", response_model=PlacementSession)
async def get_placement_session(
    session_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    session = await _get_parent_session(session_id, user["_id"])
    return _serialize_session(session)


@router.get("/sessions/{session_id}/next-question", response_model=PlacementQuestion | None)
async def get_next_question(
    session_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any] | None:
    session = await _get_parent_session(session_id, user["_id"])
    if session["status"] != "started":
        return None
    questions = QUESTION_BANK.get(session["subject_id"], [])
    answered_ids = {answer["question_id"] for answer in session.get("answers", [])}
    for question in questions:
        if question["id"] not in answered_ids:
            return _public_question(question)
    return None


@kid_router.get("/sessions/{session_id}/next-question", response_model=PlacementQuestion | None)
async def get_next_kid_question(
    session_id: str,
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> dict[str, Any] | None:
    session = await _get_child_session(session_id, child)
    if session["status"] != "started":
        return None
    questions = QUESTION_BANK.get(session["subject_id"], [])
    answered_ids = {answer["question_id"] for answer in session.get("answers", [])}
    for question in questions:
        if question["id"] not in answered_ids:
            return _public_question(question)
    return None


@router.post("/sessions/{session_id}/answers", response_model=PlacementSession)
async def answer_placement_question(
    session_id: str,
    payload: PlacementAnswerCreate,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    db = get_db()
    session = await _get_parent_session(session_id, user["_id"])
    if session["status"] != "started":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement session is not active")

    questions = QUESTION_BANK.get(session["subject_id"], [])
    question = next((item for item in questions if item["id"] == payload.question_id), None)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    answered_ids = {answer["question_id"] for answer in session.get("answers", [])}
    if payload.question_id in answered_ids:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Question already answered")

    now = datetime.now(timezone.utc)
    answer = {
        "question_id": question["id"],
        "subject_id": question["subject_id"],
        "difficulty": question["difficulty"],
        "selected_value": payload.selected_value,
        "correct": payload.selected_value == question["answer"],
        "answered_at": now,
    }
    next_index = len(session.get("answers", [])) + 1
    await db.placement_sessions.update_one(
        {"_id": session_id, "parent_user_id": user["_id"]},
        {"$push": {"answers": answer}, "$set": {"current_question_index": next_index}},
    )
    updated = await _get_parent_session(session_id, user["_id"])
    return _serialize_session(updated)


@kid_router.post("/sessions/{session_id}/answers", response_model=PlacementSession)
async def answer_kid_placement_question(
    session_id: str,
    payload: PlacementAnswerCreate,
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> dict[str, Any]:
    db = get_db()
    session = await _get_child_session(session_id, child)
    if session["status"] != "started":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement session is not active")

    questions = QUESTION_BANK.get(session["subject_id"], [])
    question = next((item for item in questions if item["id"] == payload.question_id), None)
    if question is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Question not found")

    answered_ids = {answer["question_id"] for answer in session.get("answers", [])}
    if payload.question_id in answered_ids:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Question already answered")

    now = datetime.now(timezone.utc)
    answer = {
        "question_id": question["id"],
        "subject_id": question["subject_id"],
        "difficulty": question["difficulty"],
        "selected_value": payload.selected_value,
        "correct": payload.selected_value == question["answer"],
        "answered_at": now,
    }
    next_index = len(session.get("answers", [])) + 1
    await db.placement_sessions.update_one(
        {"_id": session_id, "child_profile_id": child["_id"], "parent_user_id": child["parent_user_id"]},
        {"$push": {"answers": answer}, "$set": {"current_question_index": next_index}},
    )
    updated = await _get_child_session(session_id, child)
    return _serialize_session(updated)


@router.post("/sessions/{session_id}/complete", response_model=PlacementSession)
async def complete_placement_session(
    session_id: str,
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> dict[str, Any]:
    db = get_db()
    session = await _get_parent_session(session_id, user["_id"])
    if session["status"] == "completed":
        return _serialize_session(session)
    if session["status"] != "started":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement session is not active")

    questions = QUESTION_BANK.get(session["subject_id"], [])
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement questions are not available")
    result = _score_session(session, questions)
    now = datetime.now(timezone.utc)
    await db.placement_sessions.update_one(
        {"_id": session_id, "parent_user_id": user["_id"]},
        {"$set": {"status": "completed", "result": result, "completed_at": now}},
    )
    await db.child_profiles.update_one(
        {"_id": session["child_profile_id"], "parent_user_id": user["_id"]},
        {
            "$set": {
                "placement_status": "complete",
                "placement_result_summary": result,
                "active_skill_ids": result["recommended_skill_ids"],
                "updated_at": now,
            }
        },
    )
    updated = await _get_parent_session(session_id, user["_id"])
    return _serialize_session(updated)


@kid_router.post("/sessions/{session_id}/complete", response_model=PlacementSession)
async def complete_kid_placement_session(
    session_id: str,
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> dict[str, Any]:
    db = get_db()
    session = await _get_child_session(session_id, child)
    if session["status"] == "completed":
        return _serialize_session(session)
    if session["status"] != "started":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement session is not active")

    questions = QUESTION_BANK.get(session["subject_id"], [])
    if not questions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placement questions are not available")
    result = _score_session(session, questions)
    now = datetime.now(timezone.utc)
    await db.placement_sessions.update_one(
        {"_id": session_id, "child_profile_id": child["_id"], "parent_user_id": child["parent_user_id"]},
        {"$set": {"status": "completed", "result": result, "completed_at": now}},
    )
    await db.child_profiles.update_one(
        {"_id": child["_id"], "parent_user_id": child["parent_user_id"]},
        {
            "$set": {
                "placement_status": "complete",
                "placement_result_summary": result,
                "active_skill_ids": result["recommended_skill_ids"],
                "updated_at": now,
            }
        },
    )
    updated = await _get_child_session(session_id, child)
    return _serialize_session(updated)


async def _get_parent_session(session_id: str, parent_user_id: str) -> dict[str, Any]:
    session = await get_db().placement_sessions.find_one({"_id": session_id, "parent_user_id": parent_user_id})
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement session not found")
    return session


async def _get_child_session(session_id: str, child: dict[str, Any]) -> dict[str, Any]:
    session = await get_db().placement_sessions.find_one(
        {"_id": session_id, "child_profile_id": child["_id"], "parent_user_id": child["parent_user_id"]},
    )
    if session is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Placement session not found")
    return session


def _serialize_session(doc: dict[str, Any]) -> dict[str, Any]:
    return PlacementSession.model_validate(doc).model_dump(by_alias=True, mode="json")


def _public_question(question: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": question["id"],
        "subject_id": question["subject_id"],
        "prompt": question["prompt"],
        "choices": question["choices"],
        "difficulty": question["difficulty"],
    }


def _score_session(session: dict[str, Any], questions: list[dict[str, Any]]) -> dict[str, Any]:
    answer_by_id = {answer["question_id"]: answer for answer in session.get("answers", [])}
    correct = sum(1 for question in questions if answer_by_id.get(question["id"], {}).get("correct"))
    accuracy = correct / len(questions)
    if accuracy <= 0.4:
        band: PlacementBand = "review"
    elif accuracy <= 0.75:
        band = "ready"
    else:
        band = "stretch"

    subject_id = session["subject_id"]
    return {
        "subject_id": subject_id,
        "band": band,
        "accuracy": accuracy,
        "recommended_age_range_id": session.get("age_range_id"),
        "recommended_skill_ids": RECOMMENDED_SKILLS.get(subject_id, {}).get(band, []),
        "parent_summary": RESULT_SUMMARIES[band],
    }


QUESTION_BANK: dict[str, list[dict[str, Any]]] = {
    "math": [
        {"id": "math-1", "subject_id": "math", "prompt": "What is 2 + 1?", "choices": [2, 3, 4, 5], "answer": 3, "difficulty": "warmup"},
        {"id": "math-2", "subject_id": "math", "prompt": "Which number is bigger?", "choices": [4, 7, 2, 1], "answer": 7, "difficulty": "warmup"},
        {"id": "math-3", "subject_id": "math", "prompt": "What is 4 + 2?", "choices": [5, 6, 7, 8], "answer": 6, "difficulty": "target"},
        {"id": "math-4", "subject_id": "math", "prompt": "What is 9 - 3?", "choices": [4, 5, 6, 7], "answer": 6, "difficulty": "target"},
        {"id": "math-5", "subject_id": "math", "prompt": "What is 5 + 5?", "choices": [8, 9, 10, 11], "answer": 10, "difficulty": "target"},
        {"id": "math-6", "subject_id": "math", "prompt": "What comes after 19?", "choices": [18, 20, 21, 29], "answer": 20, "difficulty": "stretch"},
    ],
    "reading": [
        {"id": "reading-1", "subject_id": "reading", "prompt": "Which letter starts apple?", "choices": ["A", "B", "M", "T"], "answer": "A", "difficulty": "warmup"},
        {"id": "reading-2", "subject_id": "reading", "prompt": "Which word rhymes with cat?", "choices": ["sun", "hat", "dog", "pen"], "answer": "hat", "difficulty": "warmup"},
        {"id": "reading-3", "subject_id": "reading", "prompt": "Choose the word: The dog can run.", "choices": ["run", "red", "rain", "rice"], "answer": "run", "difficulty": "target"},
        {"id": "reading-4", "subject_id": "reading", "prompt": "Which word means small?", "choices": ["big", "tiny", "fast", "blue"], "answer": "tiny", "difficulty": "target"},
        {"id": "reading-5", "subject_id": "reading", "prompt": "Pick the sentence.", "choices": ["cat the", "The cat naps.", "naps cat the", "Cat the naps"], "answer": "The cat naps.", "difficulty": "target"},
        {"id": "reading-6", "subject_id": "reading", "prompt": "What comes first in a story?", "choices": ["End", "Middle", "Beginning", "Score"], "answer": "Beginning", "difficulty": "stretch"},
    ],
    "science": [
        {"id": "science-1", "subject_id": "science", "prompt": "Which one is a living thing?", "choices": ["Rock", "Tree", "Chair", "Cup"], "answer": "Tree", "difficulty": "warmup"},
        {"id": "science-2", "subject_id": "science", "prompt": "What do plants need?", "choices": ["Sunlight", "Shoes", "Paper", "Music"], "answer": "Sunlight", "difficulty": "warmup"},
        {"id": "science-3", "subject_id": "science", "prompt": "Ice is made from...", "choices": ["Water", "Sand", "Wood", "Air"], "answer": "Water", "difficulty": "target"},
        {"id": "science-4", "subject_id": "science", "prompt": "Which sense uses your ears?", "choices": ["Seeing", "Hearing", "Smelling", "Touching"], "answer": "Hearing", "difficulty": "target"},
        {"id": "science-5", "subject_id": "science", "prompt": "A baby frog is called a...", "choices": ["Tadpole", "Cub", "Calf", "Chick"], "answer": "Tadpole", "difficulty": "stretch"},
        {"id": "science-6", "subject_id": "science", "prompt": "What pulls things toward Earth?", "choices": ["Gravity", "Paint", "Heat", "Sound"], "answer": "Gravity", "difficulty": "stretch"},
    ],
}

RECOMMENDED_SKILLS: dict[str, dict[PlacementBand, list[str]]] = {
    "math": {
        "review": ["math-count-objects", "math-compare-numbers", "math-add-pictures"],
        "ready": ["math-count-objects", "math-add-within-10", "math-compare-numbers"],
        "stretch": ["math-add-within-20", "math-subtract-within-20", "math-missing-numbers"],
    },
    "reading": {
        "review": ["reading-letter-sounds", "reading-rhymes", "reading-sight-words"],
        "ready": ["reading-sight-words", "reading-short-sentences", "reading-vocabulary"],
        "stretch": ["reading-story-order", "reading-main-idea", "reading-fluency"],
    },
    "science": {
        "review": ["science-living-things", "science-five-senses", "science-weather"],
        "ready": ["science-plants", "science-materials", "science-observation"],
        "stretch": ["science-life-cycles", "science-forces", "science-experiments"],
    },
}

RESULT_SUMMARIES: dict[PlacementBand, str] = {
    "review": "Start with foundation practice and build confidence step by step.",
    "ready": "Start in the selected age range with a balanced practice path.",
    "stretch": "Start with the selected age range plus a few challenge skills.",
}
