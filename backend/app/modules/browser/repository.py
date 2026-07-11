from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.browser_link import BrowserLink


class BrowserLinkRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(BrowserLink).order_by(
                BrowserLink.title
            )
        )
        return result.scalars().all()

    async def get_by_id(
        self,
        link_id: int,
    ):
        result = await self.db.execute(
            select(BrowserLink).where(
                BrowserLink.id == link_id
            )
        )
        return result.scalar_one_or_none()

    async def create(
        self,
        link: BrowserLink,
    ):
        self.db.add(link)
        await self.db.commit()
        await self.db.refresh(link)
        return link
