from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.visitor import Visitor


class VisitorRepository:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_all(self):
        result = await self.db.execute(
            select(Visitor).order_by(
                Visitor.check_in_time.desc()
            )
        )
        return result.scalars().all()

    async def get_by_id(self, visitor_id: int):
        result = await self.db.execute(
            select(Visitor).where(
                Visitor.id == visitor_id
            )
        )
        return result.scalar_one_or_none()

    async def create(self, visitor: Visitor):
        self.db.add(visitor)
        await self.db.commit()
        await self.db.refresh(visitor)
        return visitor

    async def check_out(self, visitor: Visitor):
        visitor.check_out_time = datetime.utcnow()

        await self.db.commit()
        await self.db.refresh(visitor)

        return visitor