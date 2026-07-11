from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ebook import Ebook


class EbookRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Ebook).order_by(
                Ebook.title
            )
        )
        return result.scalars().all()

    async def get_by_id(self, ebook_id: int):
        result = await self.db.execute(
            select(Ebook).where(
                Ebook.id == ebook_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, ebook: Ebook):
        self.db.add(ebook)
        await self.db.commit()
        await self.db.refresh(ebook)
        return ebook
