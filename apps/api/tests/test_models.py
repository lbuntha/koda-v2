from app.models import Role, Skill, SkillQuestion, SkillStatus, SkillTemplate, User


def test_user_serializes_with_mongo_id_alias() -> None:
    user = User(
        _id="user_1",
        email="parent@example.com",
        password_hash="hash",
        display_name="Parent",
        role=Role.PARENT,
    )

    payload = user.model_dump(by_alias=True)

    assert payload["_id"] == "user_1"
    assert payload["role"] == "parent"
    assert payload["locale"] == "en"


def test_skill_defaults_are_launch_friendly() -> None:
    skill = Skill(
        _id="skill_1",
        slug="addition-within-10",
        title="Addition within 10",
        grade="k",
        questions=[
            SkillQuestion(
                id="q1",
                template=SkillTemplate.MCQ,
                prompt="What is 2 + 3?",
                payload={"choices": [4, 5, 6]},
                answer={"value": 5},
            )
        ],
    )

    assert skill.status == SkillStatus.DRAFT
    assert skill.locale == "en"
    assert skill.questions[0].template == SkillTemplate.MCQ
