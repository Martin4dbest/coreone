from fastapi import APIRouter, Depends, File, UploadFile

from app.models.user import User
from app.modules.auth.dependencies.current_user import (
    get_current_user,
)
from app.modules.ebooks.upload import (
    save_ebook_cover,
    save_ebook_file,
)


router = APIRouter(
    prefix="/ebooks",
    tags=["Ebooks Upload"],
)


@router.post("/upload")
async def upload_ebook_file(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
):
    url, original_name, size, content_type = (
        await save_ebook_file(
            file,
            current_user.school_id,
        )
    )

    return {
        "url": url,
        "file_url": url,
        "file_name": original_name,
        "file_size": size,
        "file_type": content_type,
    }


@router.post("/upload-cover")
async def upload_ebook_cover(
    file: UploadFile = File(...),
    current_user: User = Depends(
        get_current_user
    ),
):
    url = await save_ebook_cover(
        file,
        current_user.school_id,
    )

    return {
        "url": url,
        "cover_image_url": url,
    }
