import argparse
import getpass
from datetime import datetime, timezone

from ..auth import hash_password, new_id, normalize_email
from ..db import get_db
from ..models import Role


async def promote_user(email: str, role: Role, password: str | None, display_name: str | None) -> str:
    now = datetime.now(timezone.utc)
    normalized_email = normalize_email(email)
    existing = await get_db().users.find_one({"email": normalized_email})

    if existing is not None:
        await get_db().users.update_one(
            {"_id": existing["_id"]},
            {
                "$set": {
                    "role": role.value,
                    "updated_at": now,
                    "disabled_at": None,
                }
            },
        )
        return f"Promoted {normalized_email} to {role.value}."

    if not password:
        raise ValueError(f"Password is required when creating a new {role.value} account.")

    user = {
        "_id": new_id("user"),
        "email": normalized_email,
        "password_hash": hash_password(password),
        "display_name": display_name or normalized_email.split("@")[0],
        "role": role.value,
        "locale": "en",
        "created_at": now,
        "updated_at": now,
        "disabled_at": None,
    }
    await get_db().users.insert_one(user)
    return f"Created {role.value} {normalized_email}."


async def main() -> None:
    parser = argparse.ArgumentParser(description="Create or promote a Koda admin account.")
    parser.add_argument("--email", required=True)
    parser.add_argument("--role", choices=[Role.ADMIN.value], default=Role.ADMIN.value)
    parser.add_argument("--password", default=None)
    parser.add_argument("--display-name", default=None)
    args = parser.parse_args()
    role = Role(args.role)

    try:
        message = await promote_user(args.email, role, args.password, args.display_name)
    except ValueError:
        password = getpass.getpass(f"Password for new {role.value} account: ")
        message = await promote_user(args.email, role, password, args.display_name)
    print(message)


if __name__ == "__main__":
    import asyncio

    asyncio.run(main())
