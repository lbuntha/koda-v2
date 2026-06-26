from datetime import datetime, timezone
from typing import Any

from ..db import get_db

ADMIN_SUBJECTS_MENU = {
    "id": "admin.subjects",
    "label_key": "navSubjects",
    "route": "/admin/subjects",
    "icon": "BookOpen",
    "section": "top",
    "scope": "admin",
    "permission": "admin.settings.write",
    "end": False,
    "order": 70,
    "enabled": True,
}

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
        "key": "learning_catalog",
        "value": {
            "subjects": [
                {"id": "math", "label": "Math", "description": "Numbers, operations, and problem solving.", "enabled": True},
                {"id": "reading", "label": "Reading", "description": "Letters, phonics, vocabulary, and comprehension.", "enabled": True},
                {"id": "science", "label": "Science", "description": "Observation, nature, and simple experiments.", "enabled": True},
            ],
            "age_ranges": [
                {"id": "age-5-6", "label": "Age 5-6", "short_label": "5-6", "category": "Early", "ui_style": "Discover (simple home, ages 5-6)", "description": "Numbers, vowels, light, sound, rules.", "color": "#CFF9DF", "min_age": 5, "max_age": 6, "subject_ids": ["math", "reading"], "enabled": True},
                {"id": "age-7-8", "label": "Age 7-8", "short_label": "7-8", "category": "Elementary", "ui_style": "Explore (guided classroom, ages 7-8)", "description": "Word problems, reading fluency, plants, weather.", "color": "#FFE1E7", "min_age": 7, "max_age": 8, "subject_ids": ["math", "reading", "science"], "enabled": True},
                {"id": "age-8-9", "label": "Age 8-9", "short_label": "8-9", "category": "Elementary", "ui_style": "Build (projects and practice, ages 8-9)", "description": "Multiplication, paragraphs, forces, habitats.", "color": "#DFF2FF", "min_age": 8, "max_age": 9, "subject_ids": ["math", "reading", "science"], "enabled": True},
            ],
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
        "key": "features",
        "value": {
            "items": [
                {
                    "key": "lessons.enabled",
                    "label": "Lessons",
                    "description": "Allow children to play published lessons.",
                    "enabled": True,
                },
                {
                    "key": "streaks.enabled",
                    "label": "Streaks",
                    "description": "Show streak progress and daily-goal badges.",
                    "enabled": True,
                },
                {
                    "key": "ocr.enabled",
                    "label": "OCR worksheet upload",
                    "description": "Allow teachers to upload a worksheet image and generate questions.",
                    "enabled": False,
                },
                {
                    "key": "llm.enabled",
                    "label": "LLM-assisted authoring",
                    "description": "Use an LLM to draft questions and explanations.",
                    "enabled": False,
                },
                {
                    "key": "multiplayer.enabled",
                    "label": "Multiplayer",
                    "description": "Enable Study Together live multiplayer sessions.",
                    "enabled": False,
                },
            ]
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
                    "key": "admin.system.read",
                    "label": "View system status",
                    "description": "Read platform health, service status, and uptime checks.",
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
                    "role": "student",
                    "label": "Student",
                    "permissions": [],
                    "menu_items": [
                        "student.learn",
                        "student.progress",
                        "student.rewards",
                    ],
                },
                {
                    "role": "parent",
                    "label": "Parent",
                    "permissions": ["reports.progress.read"],
                    "menu_items": [
                        "parent.overview",
                        "parent.children",
                        "parent.progress",
                        "parent.settings",
                    ],
                },
                {
                    "role": "teacher",
                    "label": "Teacher",
                    "permissions": ["content.skills.manage", "reports.progress.read"],
                    "menu_items": [
                        "teacher.overview",
                        "teacher.skills",
                        "teacher.students",
                        "teacher.reports",
                        "teacher.classes",
                        "teacher.settings",
                    ],
                },
                {
                    "role": "admin",
                    "label": "Admin",
                    "permissions": [
                        "admin.settings.read",
                        "admin.settings.write",
                        "admin.users.manage",
                        "admin.system.read",
                        "content.skills.manage",
                        "reports.progress.read",
                    ],
                    "menu_items": [
                        "admin.overview",
                        "admin.roles",
                        "admin.features",
                        "admin.settings",
                        "admin.system_status",
                        "admin.menus",
                        "admin.subjects",
                        "admin.skills",
                        "admin.users",
                        "admin.audit",
                    ],
                },
            ],
        },
    },
    {
        "key": "menus",
        "value": {
            "items": [
                # Admin — top
                {"id": "admin.overview",      "label_key": "navOverview",     "route": "/admin",               "icon": "LayoutDashboard", "section": "top",    "scope": "admin",      "permission": None,                     "end": True,  "order": 10,  "enabled": True},
                {"id": "admin.roles",         "label_key": "navRoles",        "route": "/admin/roles",         "icon": "ShieldCheck",     "section": "top",    "scope": "admin",      "permission": "admin.settings.read",    "end": False, "order": 20,  "enabled": True},
                {"id": "admin.features",      "label_key": "navFeatures",     "route": "/admin/features",      "icon": "ToggleLeft",      "section": "top",    "scope": "admin",      "permission": "admin.settings.read",    "end": False, "order": 30,  "enabled": True},
                {"id": "admin.settings",      "label_key": "navSettings",     "route": "/admin/settings",      "icon": "Settings",        "section": "top",    "scope": "admin",      "permission": "admin.settings.read",    "end": False, "order": 40,  "enabled": True},
                {"id": "admin.system_status", "label_key": "navSystemStatus", "route": "/admin/system-status", "icon": "Activity",        "section": "top",    "scope": "admin",      "permission": "admin.system.read",      "end": False, "order": 50,  "enabled": True},
                {"id": "admin.menus",         "label_key": "navMenus",        "route": "/admin/menus",         "icon": "Menu",            "section": "top",    "scope": "admin",      "permission": "admin.settings.read",    "end": False, "order": 60,  "enabled": True},
                {"id": "admin.subjects",      "label_key": "navSubjects",     "route": "/admin/subjects",      "icon": "BookOpen",        "section": "top",    "scope": "admin",      "permission": "admin.settings.write",   "end": False, "order": 70,  "enabled": True},
                # Admin — manage
                {"id": "admin.skills", "label_key": "navSkills", "route": "/admin/skills", "icon": "BookOpen",   "section": "manage", "scope": "admin", "permission": "content.skills.manage", "end": False, "order": 110, "enabled": True},
                {"id": "admin.users",  "label_key": "navUsers",  "route": "/admin/users",  "icon": "Users",      "section": "manage", "scope": "admin", "permission": "admin.users.manage",    "end": False, "order": 120, "enabled": True},
                {"id": "admin.audit",  "label_key": "navAudit",  "route": "/admin/audit",  "icon": "ScrollText", "section": "manage", "scope": "admin", "permission": "admin.settings.read",   "end": False, "order": 130, "enabled": True},
                # Teacher
                {"id": "teacher.overview", "label_key": "navOverview", "route": "/teacher",          "icon": "LayoutDashboard", "section": "top",    "scope": "teacher", "permission": None, "end": True,  "order": 10,  "enabled": True},
                {"id": "teacher.skills",   "label_key": "navSkills",   "route": "/teacher/skills",   "icon": "BookOpen",        "section": "top",    "scope": "teacher", "permission": None, "end": False, "order": 20,  "enabled": True},
                {"id": "teacher.students", "label_key": "navStudents", "route": "/teacher/students", "icon": "GraduationCap",   "section": "top",    "scope": "teacher", "permission": None, "end": False, "order": 30,  "enabled": True},
                {"id": "teacher.reports",  "label_key": "navReports",  "route": "/teacher/reports",  "icon": "BarChart3",       "section": "top",    "scope": "teacher", "permission": None, "end": False, "order": 40,  "enabled": True},
                {"id": "teacher.classes",  "label_key": "navClasses",  "route": "/teacher/classes",  "icon": "School",          "section": "manage", "scope": "teacher", "permission": None, "end": False, "order": 110, "enabled": True},
                {"id": "teacher.settings", "label_key": "navSettings", "route": "/teacher/settings", "icon": "Settings",        "section": "manage", "scope": "teacher", "permission": None, "end": False, "order": 120, "enabled": True},
                # Parent
                {"id": "parent.overview", "label_key": "navOverview", "route": "/parent",          "icon": "LayoutDashboard", "section": "top", "scope": "parent", "permission": None,                    "end": True,  "order": 10, "enabled": True},
                {"id": "parent.children", "label_key": "navChildren", "route": "/parent/children", "icon": "Baby",            "section": "top", "scope": "parent", "permission": None,                    "end": False, "order": 20, "enabled": True},
                {"id": "parent.progress", "label_key": "navProgress", "route": "/parent/progress", "icon": "TrendingUp",      "section": "top", "scope": "parent", "permission": "reports.progress.read", "end": False, "order": 30, "enabled": True},
                {"id": "parent.settings", "label_key": "navSettings", "route": "/parent/settings", "icon": "Settings",        "section": "top", "scope": "parent", "permission": None,                    "end": False, "order": 40, "enabled": True},
                # Student
                {"id": "student.learn",    "label_key": "navLearn",    "route": "/student",          "icon": "BookOpen",   "section": "top", "scope": "student", "permission": None, "end": True,  "order": 10, "enabled": True},
                {"id": "student.progress", "label_key": "navProgress", "route": "/student/progress", "icon": "TrendingUp", "section": "top", "scope": "student", "permission": None, "end": False, "order": 20, "enabled": True},
                {"id": "student.rewards",  "label_key": "navRewards",  "route": "/student/rewards",  "icon": "Trophy",     "section": "top", "scope": "student", "permission": None, "end": False, "order": 30, "enabled": True},
            ]
        },
    },
]


async def seed_settings() -> int:
    """Insert default settings if missing. Existing docs are left untouched so
    UI edits persist across restarts. To force a reset, delete the doc in
    app_settings and restart, or call seed_settings(force=True)."""
    return await _seed(force=False)


async def reseed_settings() -> int:
    """Force-overwrite every default setting with the values in DEFAULT_SETTINGS."""
    return await _seed(force=True)


async def _seed(force: bool) -> int:
    now = datetime.now(timezone.utc)
    changed = 0
    for setting in DEFAULT_SETTINGS:
        update: dict[str, Any] = {
            "$setOnInsert": {
                "_id": f"setting_{setting['key']}",
                "created_at": now,
                "value": setting["value"],
                "updated_by_user_id": None,
                "updated_at": now,
            },
        }
        if force:
            update["$set"] = {
                "value": setting["value"],
                "updated_by_user_id": None,
                "updated_at": now,
            }
            update["$setOnInsert"] = {
                "_id": f"setting_{setting['key']}",
                "created_at": now,
            }
        result = await get_db().app_settings.update_one(
            {"key": setting["key"]},
            update,
            upsert=True,
        )
        changed += result.upserted_id is not None or result.modified_count > 0
    if not force:
        changed += await _merge_builtin_updates(now)
    return changed


async def _merge_builtin_updates(now: datetime) -> int:
    """Add new built-in settings entries without wiping admin edits."""
    changed = 0
    menus_result = await get_db().app_settings.update_one(
        {"key": "menus", "value.items.id": {"$ne": ADMIN_SUBJECTS_MENU["id"]}},
        {
            "$push": {"value.items": ADMIN_SUBJECTS_MENU},
            "$set": {"updated_at": now},
        },
    )
    changed += menus_result.modified_count > 0

    roles_result = await get_db().app_settings.update_one(
        {"key": "roles", "value.roles": {"$elemMatch": {"role": "admin", "menu_items": {"$ne": ADMIN_SUBJECTS_MENU["id"]}}}},
        {
            "$addToSet": {"value.roles.$.menu_items": ADMIN_SUBJECTS_MENU["id"]},
            "$set": {"updated_at": now},
        },
    )
    changed += roles_result.modified_count > 0
    return changed


async def main() -> None:
    import sys

    force = "--force" in sys.argv
    changed = await (reseed_settings() if force else seed_settings())
    mode = "Re-seeded" if force else "Seeded"
    print(f"{mode} {changed} app setting(s).")


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
