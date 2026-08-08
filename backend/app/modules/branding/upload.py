from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


BASE_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = BASE_DIR / "uploads" / "branding"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_CONTENT_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_FILE_SIZE = 5 * 1024 * 1024


async def save_branding_image(
    file: UploadFile,
    school_id: int,
    asset_type: str,
) -> str:
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG and WebP images are allowed.",
        )

    content = await file.read()

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Image must not exceed 5 MB.",
        )

    extension = ALLOWED_CONTENT_TYPES[file.content_type]

    school_dir = UPLOAD_DIR / str(school_id)
    school_dir.mkdir(parents=True, exist_ok=True)

    filename = f"{asset_type}-{uuid4().hex}{extension}"
    file_path = school_dir / filename

    file_path.write_bytes(content)

    return f"/uploads/branding/{school_id}/{filename}"