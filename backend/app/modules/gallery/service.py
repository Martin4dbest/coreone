from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gallery import Gallery
from app.modules.gallery.repository import GalleryRepository
from app.modules.gallery.schemas import GalleryCreateRequest


class GalleryService:

    def __init__(self, db: AsyncSession):
        self.repository = GalleryRepository(db)

    async def create_gallery(
        self,
        payload: GalleryCreateRequest,
    ):
        gallery = Gallery(
            school_id=payload.school_id,
            title=payload.title,
            image_url=payload.image_url,
            description=payload.description,
            category=payload.category,
            uploaded_by=payload.uploaded_by,
            is_active=True,
        )

        return await self.repository.create(
            gallery
        )

    async def get_gallery(self):
        return await self.repository.get_all()

    async def get_gallery_item(
        self,
        gallery_id: int,
    ):
        gallery = await self.repository.get_by_id(
            gallery_id
        )

        if not gallery:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gallery item not found",
            )

        return gallery
