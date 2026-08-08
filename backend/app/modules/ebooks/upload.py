from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status


BASE_DIR = Path(__file__).resolve().parents[3]
UPLOAD_DIR = BASE_DIR / "protected_ebooks"
PUBLIC_UPLOAD_DIR = BASE_DIR / "uploads" / "ebooks"
COVER_UPLOAD_DIR = BASE_DIR / "uploads" / "ebooks"

MAX_EBOOK_SIZE = 50 * 1024 * 1024
MAX_COVER_SIZE = 5 * 1024 * 1024

ALLOWED_EBOOK_TYPES = {
    "application/pdf": ".pdf",
    "application/epub+zip": ".epub",
    "application/epub": ".epub",
}

ALLOWED_COVER_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}


async def save_ebook_file(
    file: UploadFile,
    school_id: int,
) -> tuple[str, str, int, str]:

    content_type = (
        file.content_type
        or "application/octet-stream"
    ).lower()

    if content_type not in ALLOWED_EBOOK_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and ePub files are allowed.",
        )

    content = await file.read()

    if len(content) > MAX_EBOOK_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ebook must not exceed 50 MB.",
        )

    extension = ALLOWED_EBOOK_TYPES[content_type]

    school_dir = UPLOAD_DIR / str(school_id) / "files"
    school_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        f"ebook-{uuid4().hex}{extension}"
    )

    file_path = school_dir / filename
    file_path.write_bytes(content)

    url = (
        f"/uploads/ebooks/"
        f"{school_id}/files/{filename}"
    )

    return (
        url,
        file.filename or filename,
        len(content),
        content_type,
    )


async def save_ebook_cover(
    file: UploadFile,
    school_id: int,
) -> str:

    content_type = (
        file.content_type
        or ""
    ).lower()

    if content_type not in ALLOWED_COVER_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG, PNG and WebP cover images are allowed.",
        )

    content = await file.read()

    if len(content) > MAX_COVER_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cover image must not exceed 5 MB.",
        )

    extension = ALLOWED_COVER_TYPES[content_type]

    school_dir = COVER_UPLOAD_DIR / str(school_id) / "covers"
    school_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    filename = (
        f"cover-{uuid4().hex}{extension}"
    )

    file_path = school_dir / filename
    file_path.write_bytes(content)

    return (
        f"/uploads/ebooks/"
        f"{school_id}/covers/{filename}"
    )
