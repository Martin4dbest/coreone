from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cbt_provider import CBTProvider


class CBTProviderRepository:

    def __init__(
        self,
        db: AsyncSession,
    ):
        self.db = db

    async def get_all(
        self,
        school_id: int,
    ):
        result = await self.db.execute(
            select(CBTProvider)
            .where(
                CBTProvider.school_id == school_id
            )
            .order_by(
                CBTProvider.display_name
            )
        )

        return result.scalars().all()


    async def get_provider(
        self,
        school_id: int,
        provider: str,
    ):
        result = await self.db.execute(
            select(CBTProvider)
            .where(
                CBTProvider.school_id == school_id,
                CBTProvider.provider == provider,
            )
        )

        return result.scalar_one_or_none()


    async def update(
        self,
        item,
    ):
        await self.db.commit()
        await self.db.refresh(item)
        return item


    async def create(
        self,
        item,
    ):
        self.db.add(item)
        await self.db.commit()
        await self.db.refresh(item)
        return item


    async def delete(
        self,
        item,
    ):
        await self.db.delete(item)
        await self.db.commit()