from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.gallery import Gallery


class GalleryRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Gallery).order_by(
                Gallery.created_at.desc()
            )
        )
        return result.scalars().all()

    async def get_by_id(
        self,
        gallery_id: int,
    ):
        result = await self.db.execute(
            select(Gallery).where(
                Gallery.id == gallery_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        gallery: Gallery,
    ):
        self.db.add(gallery)
        await self.db.commit()
        await self.db.refresh(gallery)
        return gallery