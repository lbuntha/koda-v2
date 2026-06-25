import pytest

from app.models import Skill, SkillQuestion, SkillTemplate
from app.templates import grade_question, render_question, validate_skill_questions


def test_mcq_renders_without_answer_and_grades() -> None:
    question = SkillQuestion(
        id="q1",
        template=SkillTemplate.MCQ,
        prompt="What is 2 + 3?",
        payload={"choices": [4, 5, 6]},
        answer={"value": 5},
    )

    rendered = render_question(question)
    correct = grade_question(question, {"value": 5})
    incorrect = grade_question(question, {"value": 4})

    assert rendered.payload == {"choices": [4, 5, 6]}
    assert correct.score == 1
    assert correct.correct is True
    assert incorrect.score == 0
    assert incorrect.correct is False


def test_mcq_requires_answer_to_match_choice() -> None:
    question = SkillQuestion(
        id="q1",
        template=SkillTemplate.MCQ,
        prompt="Pick one",
        payload={"choices": ["a", "b"]},
        answer={"value": "c"},
    )

    with pytest.raises(ValueError, match="Invalid question q1"):
        validate_skill_questions([question])


def test_math_worksheet_scores_per_problem() -> None:
    question = SkillQuestion(
        id="worksheet-1",
        template=SkillTemplate.MATH_WORKSHEET,
        prompt="Solve.",
        payload={
            "layout": "vertical",
            "problems": [
                {"id": "p1", "left": 2, "operator": "+", "right": 3},
                {"id": "p2", "left": 9, "operator": "-", "right": 4},
            ],
        },
        answer={"values": {"p1": 5, "p2": 5}},
    )

    rendered = render_question(question)
    result = grade_question(question, {"values": {"p1": 5, "p2": 4}})

    assert rendered.max_score == 2
    assert result.score == 1
    assert result.max_score == 2
    assert result.correct is False


def test_skill_model_validates_template_payloads() -> None:
    with pytest.raises(ValueError, match="choices"):
        Skill(
            _id="skill_1",
            slug="bad-mcq",
            title="Bad MCQ",
            grade="K",
            questions=[
                SkillQuestion(
                    id="q1",
                    template=SkillTemplate.MCQ,
                    prompt="Bad",
                    payload={"choices": [1, 1]},
                    answer={"value": 1},
                )
            ],
        )
