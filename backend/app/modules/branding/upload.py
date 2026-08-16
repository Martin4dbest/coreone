from __future__ import annotations

from fastapi import UploadFile

from app.services.storage import upload_file


async def save_branding_image(
    file: UploadFile,
    school_id: int,
) -> str:
    """
    Upload school branding assets to Cloudinary.

    Branding assets are stored per school so every tenant remains
    logically isolated in Cloudinary.
    """

    result = await upload_file(
        file,
        folder=f"presense/schools/{school_id}/branding",
        resource_type="image",
    )

    secure_url = result.get("secure_url")

    if not secure_url:
        raise RuntimeError("Cloudinary did not return a secure URL.")

    return secure_url
