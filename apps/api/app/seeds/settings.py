from datetime import datetime, timezone
from typing import Any

from ..db import get_db

DEFAULT_SETTINGS: list[dict[str, Any]] = [
    {
        "key": "platform",
        "value": {
            "launch_mode": "private_beta",
            "default_locale": "en",
            "supported_locales": ["en", "km"],
        },
    },
    {
        "key": "grades",
        "value": {
            "items": [
                {"id": "P", "label": "Pre-K"},
                {"id": "K", "label": "Kindergarten"},
                {"id": "1", "label": "Grade 1"},
            ]
        },
    },
    {
        "key": "xp",
        "value": {
            "lesson_complete": 10,
            "perfect_lesson_bonus": 5,
            "daily_goal": 30,
        },
    },
    {
        "key": "roles",
        "value": {
            "permissions": [
                {
                    "key": "admin.settings.read",
                    "label": "View settings",
                    "description": "Read platform settings, roles, and rights.",
                },
                {
                    "key": "admin.settings.write",
                    "label": "Edit settings",
                    "description": "Update platform settings and role rights.",
                },
                {
                    "key": "admin.users.manage",
                    "label": "Manage users",
                    "description": "View, promote, disable, or restore users.",
                },
                {
                    "key": "content.skills.manage",
                    "label": "Manage skills",
                    "description": "Create, edit, publish, and archive learning skills.",
                },
                {
                    "key": "reports.progress.read",
                    "label": "View progress reports",
                    "description": "Read learner progress, XP, and completion reports.",
                },
            ],
            "roles": [
                {
                    "role": "parent",
                    "label": "Parent",
                    "permissions": ["reports.progress.read"],
                },
                {
                    "role": "teacher",
                    "label": "Teacher",
                    "permissions": ["content.skills.manage", "reports.progress.read"],
                },
                {
                    "role": "admin",
                    "label": "Admin",
                    "permissions": ["admin.settings.read", "admin.users.manage", "content.skills.manage"],
                },
                {
                    "role": "superadmin",
                    "label": "Superadmin",
                    "permissions": [
                        "admin.settings.read",
                        "admin.settings.write",
                        "admin.users.manage",
                        "content.skills.manage",
                        "reports.progress.read",
                    ],
                },
            ],
        },
    },
]


async def seed_settings() -> int:
    now = datetime.now(timezone.utc)
    changed = 0
    for setting in DEFAULT_SETTINGS:
        result = await get_db().app_settings.update_one(
            {"key": setting["key"]},
            {
                "$setOnInsert": {
                    "_id": f"setting_{setting['key']}",
                    "created_at": now,
                },
                "$set": {
                    "value": setting["value"],
                    "updated_by_user_id": None,
                    "updated_at": now,
                },
            },
            upsert=True,
        )
        changed += result.upserted_id is not None or result.modified_count > 0
    return changed


async def main() -> None:
    changed = await seed_settings()
    print(f"Seeded {changed} app setting(s).")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
