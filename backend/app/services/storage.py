from __future__ import annotations

import os
from typing import BinaryIO

import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile


def _configure_cloudinary() -> None:
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")

    if not all([cloud_name, api_key, api_secret]):
        raise RuntimeError(
            "Cloudinary is not configured. "
            "Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, "
            "and CLOUDINARY_API_SECRET."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True,
    )


async def upload_file(
    file: UploadFile,
    *,
    folder: str,
    resource_type: str = "auto",
    public_id: str | None = None,
    delivery_type: str = "upload",
) -> dict:
    """
    Upload a FastAPI UploadFile to Cloudinary.

    Returns the Cloudinary upload response.
    """

    _configure_cloudinary()

    try:
        result = cloudinary.uploader.upload(
            file.file,
            folder=folder,
            public_id=public_id,
            resource_type=resource_type,
            type=delivery_type,
            overwrite=True,
            use_filename=False,
            unique_filename=True,
            secure=True,
        )

        return result

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary upload failed: {exc}",
        ) from exc


def upload_stream(
    file: BinaryIO,
    *,
    folder: str,
    resource_type: str = "auto",
    public_id: str | None = None,
    delivery_type: str = "upload",
) -> dict:
    """
    Upload a file-like object to Cloudinary.
    """

    _configure_cloudinary()

    try:
        return cloudinary.uploader.upload(
            file,
            folder=folder,
            public_id=public_id,
            resource_type=resource_type,
            type=delivery_type,
            overwrite=True,
            use_filename=False,
            unique_filename=True,
            secure=True,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary upload failed: {exc}",
        ) from exc


def delete_asset(
    public_id: str,
    *,
    resource_type: str = "image",
    invalidate: bool = True,
) -> dict:
    """
    Delete an asset from Cloudinary.
    """

    _configure_cloudinary()

    try:
        return cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=invalidate,
        )

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Cloudinary deletion failed: {exc}",
        ) from exc
