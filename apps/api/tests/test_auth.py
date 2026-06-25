from datetime import timedelta

import pytest

from app.auth import create_token, hash_password, normalize_email, public_user, verify_password
from app.models import Role


def test_password_hash_round_trip() -> None:
    password_hash = hash_password("strong-password")

    assert password_hash != "strong-password"
    assert verify_password("strong-password", password_hash)
    assert not verify_password("wrong-password", password_hash)


def test_normalize_email() -> None:
    assert normalize_email(" Parent@Example.COM ") == "parent@example.com"


def test_create_token_returns_jwt() -> None:
    user = {"_id": "user_1", "email": "a@example.com", "role": Role.PARENT.value}

    token = create_token(user, "access", timedelta(minutes=5))

    assert isinstance(token, str)
    assert token.count(".") == 2


def test_public_user_hides_password_hash() -> None:
    public = public_user(
        {
            "_id": "user_1",
            "email": "parent@example.com",
            "password_hash": "secret",
            "display_name": "Parent",
            "role": Role.PARENT.value,
            "locale": "en",
        }
    )

    payload = public.model_dump(by_alias=True)

    assert payload["_id"] == "user_1"
    assert "password_hash" not in payload
