from pathlib import Path
from typing import Any, Literal

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel

from ..auth import get_current_child_profile, require_role
from ..config import settings
from ..models import Role

router = APIRouter(prefix="/uploads", tags=["uploads"])

MAX_UPLOAD_BYTES = 1_500_000
ALLOWED_RASTER_TYPES = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/gif": ".gif",
}


class UploadedAsset(BaseModel):
    kind: Literal["image", "svg"]
    content_type: str
    filename: str
    size: int
    url: str
    svg: str | None = None


@router.post("/parent-avatar", response_model=UploadedAsset)
async def upload_parent_avatar(
    file: UploadFile = File(...),
    user: dict[str, Any] = Depends(require_role(Role.PARENT)),
) -> UploadedAsset:
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload is empty")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Upload is too large")

    detected = _detect_upload(content, file.content_type or "")
    upload_dir = Path(settings.upload_dir) / "avatars" / user["_id"]
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"avatar{detected['extension']}"
    path = upload_dir / filename
    path.write_bytes(content)

    url = f"{settings.public_base_url.rstrip('/')}/uploads/avatars/{user['_id']}/{filename}"
    return UploadedAsset(
        kind=detected["kind"],
        content_type=detected["content_type"],
        filename=filename,
        size=len(content),
        url=url,
        svg=content.decode("utf-8") if detected["kind"] == "svg" else None,
    )


@router.post("/child-avatar", response_model=UploadedAsset)
async def upload_child_avatar(
    file: UploadFile = File(...),
    child: dict[str, Any] = Depends(get_current_child_profile),
) -> UploadedAsset:
    content = await file.read()
    if len(content) == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Upload is empty")
    if len(content) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE, detail="Upload is too large")

    detected = _detect_upload(content, file.content_type or "")
    upload_dir = Path(settings.upload_dir) / "avatars" / child["parent_user_id"] / child["_id"]
    upload_dir.mkdir(parents=True, exist_ok=True)

    filename = f"avatar{detected['extension']}"
    path = upload_dir / filename
    path.write_bytes(content)

    url = f"{settings.public_base_url.rstrip('/')}/uploads/avatars/{child['parent_user_id']}/{child['_id']}/{filename}"
    return UploadedAsset(
        kind=detected["kind"],
        content_type=detected["content_type"],
        filename=filename,
        size=len(content),
        url=url,
        svg=content.decode("utf-8") if detected["kind"] == "svg" else None,
    )


def _detect_upload(content: bytes, declared_type: str) -> dict[str, str]:
    if _is_svg(content, declared_type):
        svg = content.decode("utf-8", errors="ignore").lower()
        if "<script" in svg or "javascript:" in svg or " onload=" in svg:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Unsafe SVG content")
        return {"kind": "svg", "content_type": "image/svg+xml", "extension": ".svg"}

    signatures = [
        (b"\x89PNG\r\n\x1a\n", "image/png"),
        (b"\xff\xd8\xff", "image/jpeg"),
        (b"GIF87a", "image/gif"),
        (b"GIF89a", "image/gif"),
        (b"RIFF", "image/webp"),
    ]
    for signature, content_type in signatures:
        if content.startswith(signature):
            if content_type == "image/webp" and content[8:12] != b"WEBP":
                continue
            return {
                "kind": "image",
                "content_type": content_type,
                "extension": ALLOWED_RASTER_TYPES[content_type],
            }

    if declared_type in ALLOWED_RASTER_TYPES:
        return {"kind": "image", "content_type": declared_type, "extension": ALLOWED_RASTER_TYPES[declared_type]}

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unsupported avatar type. Upload PNG, JPG, WEBP, GIF, or SVG.",
    )


def _is_svg(content: bytes, declared_type: str) -> bool:
    if declared_type in {"image/svg+xml", "text/xml", "application/xml"}:
        return True
    head = content[:500].decode("utf-8", errors="ignore").lower().lstrip()
    return head.startswith("<svg") or ("<svg" in head and head.startswith("<?xml"))
