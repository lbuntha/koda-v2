from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.hash import pbkdf2_sha256
from pydantic import BaseModel, EmailStr, Field

from .config import settings
from .db import get_db
from .models import Role

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


class UserPublic(BaseModel):
    id: str = Field(alias="_id")
    email: EmailStr
    display_name: str
    role: Role
    locale: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserPublic


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_password(password: str) -> str:
    return pbkdf2_sha256.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pbkdf2_sha256.verify(password, password_hash)


def new_id(prefix: str) -> str:
    return f"{prefix}_{uuid4().hex}"


def public_user(user: dict[str, Any]) -> UserPublic:
    return UserPublic(
        _id=user["_id"],
        email=user["email"],
        display_name=user["display_name"],
        role=user["role"],
        locale=user.get("locale", "en"),
    )


def create_token(user: dict[str, Any], token_type: str, ttl: timedelta) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": user["_id"],
        "email": user["email"],
        "role": user["role"],
        "type": token_type,
        "iat": int(now.timestamp()),
        "exp": int((now + ttl).timestamp()),
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm="HS256")


def issue_tokens(user: dict[str, Any]) -> AuthTokens:
    access = create_token(
        user,
        "access",
        timedelta(minutes=settings.jwt_access_ttl_minutes),
    )
    refresh = create_token(
        user,
        "refresh",
        timedelta(days=settings.jwt_refresh_ttl_days),
    )
    return AuthTokens(access_token=access, refresh_token=refresh, user=public_user(user))


async def get_current_user(token: str = Depends(oauth2_scheme)) -> dict[str, Any]:
    try:
        payload = jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])
    except JWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    if payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not isinstance(user_id, str):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user = await get_db().users.find_one({"_id": user_id, "disabled_at": None})
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(*roles: Role):
    async def dependency(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
        if user.get("role") not in {role.value for role in roles}:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient role")
        return user

    return dependency
