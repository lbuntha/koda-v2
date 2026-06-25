from abc import ABC, abstractmethod
from typing import Any

from pydantic import BaseModel, Field, ValidationError, field_validator

from .models import SkillQuestion, SkillTemplate


class RenderedQuestion(BaseModel):
    id: str
    template: SkillTemplate
    prompt: str
    payload: dict[str, Any]
    max_score: int = 1


class GradeResult(BaseModel):
    correct: bool
    score: int
    max_score: int = 1
    feedback: str | None = None


class QuestionTemplate(ABC):
    template: SkillTemplate

    @abstractmethod
    def validate_question(self, question: SkillQuestion) -> SkillQuestion:
        pass

    @abstractmethod
    def render(self, question: SkillQuestion) -> RenderedQuestion:
        pass

    @abstractmethod
    def grade(self, question: SkillQuestion, submitted_answer: Any) -> GradeResult:
        pass


class McqPayload(BaseModel):
    choices: list[str | int | float] = Field(min_length=2, max_length=8)

    @field_validator("choices")
    @classmethod
    def choices_must_be_unique(cls, choices: list[str | int | float]) -> list[str | int | float]:
        normalized = [str(choice) for choice in choices]
        if len(set(normalized)) != len(normalized):
            raise ValueError("choices must be unique")
        return choices


class McqAnswer(BaseModel):
    value: str | int | float


class McqSubmittedAnswer(BaseModel):
    value: str | int | float


class McqTemplate(QuestionTemplate):
    template = SkillTemplate.MCQ

    def validate_question(self, question: SkillQuestion) -> SkillQuestion:
        payload = McqPayload.model_validate(question.payload)
        answer = McqAnswer.model_validate(question.answer)
        if str(answer.value) not in {str(choice) for choice in payload.choices}:
            raise ValueError("answer.value must be one of payload.choices")
        return question

    def render(self, question: SkillQuestion) -> RenderedQuestion:
        payload = McqPayload.model_validate(question.payload)
        return RenderedQuestion(
            id=question.id,
            template=question.template,
            prompt=question.prompt,
            payload=payload.model_dump(),
            max_score=1,
        )

    def grade(self, question: SkillQuestion, submitted_answer: Any) -> GradeResult:
        self.validate_question(question)
        submitted = McqSubmittedAnswer.model_validate(submitted_answer)
        answer = McqAnswer.model_validate(question.answer)
        correct = str(submitted.value) == str(answer.value)
        return GradeResult(correct=correct, score=1 if correct else 0, max_score=1)


class MathWorksheetProblem(BaseModel):
    id: str
    left: int
    operator: str = Field(pattern=r"^[+\-]$")
    right: int


class MathWorksheetPayload(BaseModel):
    layout: str = "vertical"
    problems: list[MathWorksheetProblem] = Field(min_length=1, max_length=20)


class MathWorksheetAnswer(BaseModel):
    values: dict[str, int]


class MathWorksheetSubmittedAnswer(BaseModel):
    values: dict[str, int]


class MathWorksheetTemplate(QuestionTemplate):
    template = SkillTemplate.MATH_WORKSHEET

    def validate_question(self, question: SkillQuestion) -> SkillQuestion:
        payload = MathWorksheetPayload.model_validate(question.payload)
        answer = MathWorksheetAnswer.model_validate(question.answer)
        problem_ids = {problem.id for problem in payload.problems}
        if len(problem_ids) != len(payload.problems):
            raise ValueError("problem ids must be unique")
        missing_answers = problem_ids - set(answer.values)
        if missing_answers:
            raise ValueError(f"missing answers for problems: {', '.join(sorted(missing_answers))}")
        return question

    def render(self, question: SkillQuestion) -> RenderedQuestion:
        payload = MathWorksheetPayload.model_validate(question.payload)
        return RenderedQuestion(
            id=question.id,
            template=question.template,
            prompt=question.prompt,
            payload=payload.model_dump(),
            max_score=len(payload.problems),
        )

    def grade(self, question: SkillQuestion, submitted_answer: Any) -> GradeResult:
        self.validate_question(question)
        payload = MathWorksheetPayload.model_validate(question.payload)
        submitted = MathWorksheetSubmittedAnswer.model_validate(submitted_answer)
        answer = MathWorksheetAnswer.model_validate(question.answer)
        score = sum(1 for problem in payload.problems if submitted.values.get(problem.id) == answer.values[problem.id])
        return GradeResult(
            correct=score == len(payload.problems),
            score=score,
            max_score=len(payload.problems),
        )


TEMPLATES: dict[SkillTemplate, QuestionTemplate] = {
    SkillTemplate.MCQ: McqTemplate(),
    SkillTemplate.MATH_WORKSHEET: MathWorksheetTemplate(),
}


def get_template(template: SkillTemplate) -> QuestionTemplate:
    return TEMPLATES[template]


def validate_skill_questions(questions: list[SkillQuestion]) -> list[SkillQuestion]:
    for question in questions:
        try:
            get_template(question.template).validate_question(question)
        except (ValidationError, ValueError) as exc:
            raise ValueError(f"Invalid question {question.id}: {exc}") from exc
    return questions


def render_question(question: SkillQuestion) -> RenderedQuestion:
    return get_template(question.template).render(question)


def grade_question(question: SkillQuestion, submitted_answer: Any) -> GradeResult:
    return get_template(question.template).grade(question, submitted_answer)
