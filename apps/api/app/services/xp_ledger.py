"""Append-only XP ledger.

The xp_ledger collection has a unique index on (source_type, source_id), so
inserting the same lesson attempt twice is a no-op — that is the idempotency
guarantee. Totals are derived by aggregating amounts for a child.
"""

from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError

from ..auth import new_id
from ..db import get_db


async def grant_xp_for_attempt(
    *,
    child_profile_id: str,
    attempt_id: str,
    amount: int,
    reason: str,
) -> int:
    """Insert one ledger entry for an attempt. Returns amount granted (0 if duplicate)."""
    if amount <= 0:
        return 0
    entry = {
        "_id": new_id("xp"),
        "child_profile_id": child_profile_id,
        "source_type": "lesson_attempt",
        "source_id": attempt_id,
        "amount": amount,
        "reason": reason,
        "created_at": datetime.now(timezone.utc),
    }
    try:
        await get_db().xp_ledger.insert_one(entry)
        return amount
    except DuplicateKeyError:
        return 0


async def total_xp_for_child(child_profile_id: str) -> int:
    pipeline = [
        {"$match": {"child_profile_id": child_profile_id}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    docs = await get_db().xp_ledger.aggregate(pipeline).to_list(length=1)
    return int(docs[0]["total"]) if docs else 0
