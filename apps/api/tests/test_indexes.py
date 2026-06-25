from app.indexes import ensure_indexes


class FakeCollection:
    def __init__(self) -> None:
        self.calls = []

    async def create_indexes(self, indexes):
        self.calls.append(indexes)


class FakeDb:
    def __init__(self) -> None:
        self.users = FakeCollection()
        self.child_profiles = FakeCollection()
        self.skills = FakeCollection()
        self.lesson_attempts = FakeCollection()
        self.xp_ledger = FakeCollection()
        self.app_settings = FakeCollection()


async def test_ensure_indexes_creates_expected_collections() -> None:
    db = FakeDb()

    await ensure_indexes(db)  # type: ignore[arg-type]

    assert db.users.calls
    assert db.child_profiles.calls
    assert db.skills.calls
    assert db.lesson_attempts.calls
    assert db.xp_ledger.calls
    assert db.app_settings.calls


async def test_xp_ledger_has_unique_source_index() -> None:
    db = FakeDb()

    await ensure_indexes(db)  # type: ignore[arg-type]

    xp_indexes = db.xp_ledger.calls[0]
    assert any(index.document["name"] == "uniq_xp_source" for index in xp_indexes)
