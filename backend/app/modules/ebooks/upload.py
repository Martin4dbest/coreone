from __future__ import annotations

from fastapi import HTTPException, UploadFile, status

from app.services.storage import upload_file


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

    # Reset the UploadFile stream so Cloudinary receives
    # the complete file.
    await file.seek(0)

    result = await upload_file(
        file,
        folder=f"presense/schools/{school_id}/ebooks",
        resource_type="raw",
        delivery_type="authenticated",
    )

    secure_url = result.get("secure_url")

    if not secure_url:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary did not return a secure ebook URL.",
        )

    return (
        secure_url,
        file.filename or "ebook",
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

    await file.seek(0)

    result = await upload_file(
        file,
        folder=f"presense/schools/{school_id}/ebooks/covers",
        resource_type="image",
    )

    secure_url = result.get("secure_url")

    if not secure_url:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary did not return a secure cover URL.",
        )

    return secure_url
