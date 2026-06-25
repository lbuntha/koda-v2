from app.seeds.admin import promote_superadmin
from app.seeds.settings import DEFAULT_SETTINGS, seed_settings


class FakeUpdateResult:
    def __init__(self, upserted_id=None, modified_count=0) -> None:
        self.upserted_id = upserted_id
        self.modified_count = modified_count


class FakeInsertResult:
    def __init__(self, inserted_id) -> None:
        self.inserted_id = inserted_id


class FakeCollection:
    def __init__(self, existing=None) -> None:
        self.existing = existing
        self.updates = []
        self.inserts = []

    async def find_one(self, query):
        return self.existing

    async def update_one(self, query, update, upsert=False):
        self.updates.append((query, update, upsert))
        return FakeUpdateResult(upserted_id="new" if upsert else None)

    async def insert_one(self, document):
        self.inserts.append(document)
        return FakeInsertResult(document["_id"])


class FakeDb:
    def __init__(self, existing_user=None) -> None:
        self.users = FakeCollection(existing_user)
        self.app_settings = FakeCollection()


async def test_seed_settings_upserts_defaults(monkeypatch) -> None:
    db = FakeDb()
    monkeypatch.setattr("app.seeds.settings.get_db", lambda: db)

    changed = await seed_settings()

    assert changed == len(DEFAULT_SETTINGS)
    assert len(db.app_settings.updates) == len(DEFAULT_SETTINGS)
    assert all(call[2] is True for call in db.app_settings.updates)


def test_default_settings_include_roles_and_rights() -> None:
    roles_setting = next(setting for setting in DEFAULT_SETTINGS if setting["key"] == "roles")

    assert {role["role"] for role in roles_setting["value"]["roles"]} == {
        "parent",
        "teacher",
        "admin",
        "superadmin",
    }
    assert "admin.settings.write" in next(
        role for role in roles_setting["value"]["roles"] if role["role"] == "superadmin"
    )["permissions"]


async def test_admin_seed_promotes_existing_user(monkeypatch) -> None:
    db = FakeDb({"_id": "user_1", "email": "owner@example.com"})
    monkeypatch.setattr("app.seeds.admin.get_db", lambda: db)

    message = await promote_superadmin("Owner@Example.com", None, None)

    assert message == "Promoted owner@example.com to superadmin."
    assert db.users.updates[0][0] == {"_id": "user_1"}
    assert db.users.inserts == []


async def test_admin_seed_creates_missing_user(monkeypatch) -> None:
    db = FakeDb()
    monkeypatch.setattr("app.seeds.admin.get_db", lambda: db)

    message = await promote_superadmin("owner@example.com", "strong-password", "Owner")

    assert message == "Created superadmin owner@example.com."
    assert db.users.inserts[0]["role"] == "superadmin"
    assert db.users.inserts[0]["display_name"] == "Owner"
