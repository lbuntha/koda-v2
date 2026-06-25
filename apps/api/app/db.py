from typing import Any

from motor.motor_asyncio import AsyncIOMotorClient

from .config import settings

_client: Any | None = None


def get_client() -> Any:
    global _client
    if _client is None:
        _client = AsyncIOMotorClient(settings.mongo_uri)
    return _client


def get_db() -> Any:
    return get_client()[settings.mongo_db]
