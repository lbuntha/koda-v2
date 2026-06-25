from typing import Any

from pymongo import ASCENDING, DESCENDING, IndexModel


async def ensure_indexes(db: Any) -> None:
    await db.users.create_indexes(
        [
            IndexModel([("email", ASCENDING)], unique=True, name="uniq_users_email"),
            IndexModel([("role", ASCENDING)], name="idx_users_role"),
            IndexModel([("disabled_at", ASCENDING)], name="idx_users_disabled_at"),
        ]
    )
    await db.child_profiles.create_indexes(
        [
            IndexModel([("parent_user_id", ASCENDING)], name="idx_child_profiles_parent"),
            IndexModel(
                [("parent_user_id", ASCENDING), ("display_name", ASCENDING)],
                name="idx_child_profiles_parent_name",
            ),
        ]
    )
    await db.skills.create_indexes(
        [
            IndexModel([("slug", ASCENDING)], unique=True, name="uniq_skills_slug"),
            IndexModel(
                [("status", ASCENDING), ("grade", ASCENDING), ("locale", ASCENDING)],
                name="idx_skills_browse",
            ),
            IndexModel([("tags", ASCENDING)], name="idx_skills_tags"),
        ]
    )
    await db.lesson_attempts.create_indexes(
        [
            IndexModel(
                [("child_profile_id", ASCENDING), ("started_at", DESCENDING)],
                name="idx_attempts_child_started",
            ),
            IndexModel(
                [("child_profile_id", ASCENDING), ("skill_id", ASCENDING), ("status", ASCENDING)],
                name="idx_attempts_child_skill_status",
            ),
        ]
    )
    await db.xp_ledger.create_indexes(
        [
            IndexModel(
                [("child_profile_id", ASCENDING), ("created_at", DESCENDING)],
                name="idx_xp_child_created",
            ),
            IndexModel(
                [("source_type", ASCENDING), ("source_id", ASCENDING)],
                unique=True,
                name="uniq_xp_source",
            ),
        ]
    )
    await db.app_settings.create_indexes(
        [
            IndexModel([("key", ASCENDING)], unique=True, name="uniq_app_settings_key"),
        ]
    )
