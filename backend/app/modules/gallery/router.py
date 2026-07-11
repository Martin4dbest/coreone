from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.user import User
from app.modules.auth.dependencies.current_user import get_current_user
from app.modules.gallery.schemas import (
    GalleryCreateRequest,
    GalleryResponse,
)
from app.modules.gallery.service import GalleryService


router = APIRouter(
    prefix="/gallery",
    tags=["Gallery"],
)


@router.post(
    "",
    response_model=GalleryResponse,
)
async def create_gallery(
    payload: GalleryCreateRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GalleryService(db).create_gallery(
        payload
    )


@router.get(
    "",
    response_model=list[GalleryResponse],
)
async def get_gallery(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GalleryService(db).get_gallery()


@router.get(
    "/{gallery_id}",
    response_model=GalleryResponse,
)
async def get_gallery_item(
    gallery_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return await GalleryService(db).get_gallery_item(
        gallery_id
    )
