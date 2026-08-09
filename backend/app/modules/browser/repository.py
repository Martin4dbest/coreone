from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.browser_link import BrowserLink


class BrowserLinkRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(
        self,
        school_id: int | None = None,
    ):
        query = select(BrowserLink)

        if school_id is not None:
            query = query.where(
                BrowserLink.school_id == school_id
            )

        query = query.order_by(BrowserLink.title)

        result = await self.db.execute(query)

        return result.scalars().all()

    async def get_by_id(
        self,
        link_id: int,
        school_id: int | None = None,
    ):
        query = select(BrowserLink).where(
            BrowserLink.id == link_id
        )

        if school_id is not None:
            query = query.where(
                BrowserLink.school_id == school_id
            )

        result = await self.db.execute(query)

        return result.scalar_one_or_none()

    async def create(
        self,
        link: BrowserLink,
    ):
        self.db.add(link)

        await self.db.commit()
        await self.db.refresh(link)

        return link

    async def delete(
        self,
        link: BrowserLink,
    ):
        await self.db.delete(link)
        await self.db.commit()

    async def commit(self):
        await self.db.commit()
