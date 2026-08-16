from __future__ import annotations

from fastapi import UploadFile

from app.services.storage import upload_file


async def save_branding_image(
    file: UploadFile,
    school_id: int,
    asset_type: str,
) -> str:
    """
    Upload a school branding image directly to Cloudinary.

    Each school's branding assets are isolated in its own folder.
    """

    result = await upload_file(
        file,
        folder=f"coreone/schools/{school_id}/branding/{asset_type}",
        resource_type="image",
    )

    secure_url = result.get("secure_url")

    if not secure_url:
        raise RuntimeError(
            "Cloudinary did not return a secure URL."
        )

    return secure_url
