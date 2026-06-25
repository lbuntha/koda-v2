from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel, EmailStr, Field
from pymongo.errors import DuplicateKeyError

from ..auth import (
    AuthTokens,
    get_current_user,
    hash_password,
    issue_tokens,
    new_id,
    normalize_email,
    public_user,
    verify_password,
)
from ..db import get_db
from ..models import Role

router = APIRouter(prefix="/auth", tags=["auth"])


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    display_name: str = Field(min_length=1, max_length=80)
    locale: str = Field(default="en", min_length=2, max_length=12)


@router.post("/register", response_model=AuthTokens, status_code=status.HTTP_201_CREATED)
async def register_parent(payload: RegisterRequest) -> AuthTokens:
    now = datetime.now(timezone.utc)
    user = {
        "_id": new_id("user"),
        "email": normalize_email(payload.email),
        "password_hash": hash_password(payload.password),
        "display_name": payload.display_name.strip(),
        "role": Role.PARENT.value,
        "locale": payload.locale,
        "created_at": now,
        "updated_at": now,
        "disabled_at": None,
    }

    try:
        await get_db().users.insert_one(user)
    except DuplicateKeyError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc

    return issue_tokens(user)


@router.post("/login", response_model=AuthTokens)
async def login(form: Annotated[OAuth2PasswordRequestForm, Depends()]) -> AuthTokens:
    email = normalize_email(form.username)
    user = await get_db().users.find_one({"email": email, "disabled_at": None})
    if user is None or not verify_password(form.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return issue_tokens(user)


@router.post("/refresh", response_model=AuthTokens)
async def refresh() -> AuthTokens:
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail="Refresh token rotation lands with session hardening",
    )


@router.get("/me")
async def me(user=Depends(get_current_user)):
    return public_user(user)
